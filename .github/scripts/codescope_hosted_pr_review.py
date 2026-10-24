#!/usr/bin/env python3
"""Hosted CodeScope PR review (bounded, lexical diff-only static analysis).

Runs in GitHub Actions without a local CodeScope service. This is *not* the
Milestone 11-14 AST, call-graph, Prisma attribution, or Ollama engine.
Never checks out or executes untrusted PR code; only GETs GitHub PR metadata
and diff hunks. Findings are regex-based changed-line candidates, not verified
runtime behavior, vulnerabilities or defect predictions.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

MAX_RESPONSE_BYTES = 2_000_000
MAX_PAGES = 5
PER_PAGE = 100
MAX_PATCH_LENGTH = 180_000
MAX_FINDINGS = 120
PR_NUMBER = re.compile(r"[1-9][0-9]{0,8}\Z")
GITHUB_REPO = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\Z")
COMMIT_SHA = re.compile(r"[0-9a-f]{40}\Z", re.IGNORECASE)
HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")
RULES = (
    ("database_mutation_candidate", re.compile(r"\.\s*(?:createMany|updateMany|deleteMany|create|update|upsert|delete)\s*\("), 30,
     "A changed line appears to call a database mutation method; verify the actual receiver and behavior."),
    ("transaction_candidate", re.compile(r"\.\s*\$transaction\s*\("), 12,
     "A changed line appears to introduce a transaction boundary."),
    ("database_read_candidate", re.compile(r"\.\s*(?:findFirst|findUnique|findMany|aggregate|count)\s*\("), 8,
     "A changed line appears to call a database read method; verify the actual receiver and data contract."),
    ("outbound_network_candidate", re.compile(r"\b(?:fetch\s*\(|axios\s*\.\s*(?:get|post|put|patch|delete)\s*\()"), 10,
     "A changed line appears to perform a network request; inspect error handling and payloads."),
    ("queue_operation_candidate", re.compile(r"\.\s*(?:lPush|rPush|publish|sendToQueue)\s*\("), 10,
     "A changed line appears to publish or enqueue data; inspect message contracts."),
    ("authentication_candidate", re.compile(r"\b(?:verifyToken|verifyJwt|authorize|authenticate|signIn|signOut)\s*\("), 12,
     "A changed line contains an authentication-related call name; inspect authorization boundaries."),
)
SUPPORTED = {".ts", ".tsx", ".js", ".jsx", ".py"}


def fetch_json(url: str, token: str, *, opener=None) -> Any:
    if not url.startswith("https://api.github.com/repos/"):
        raise ValueError("Refusing to contact a non-GitHub API endpoint")
    request = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "codescope-hosted-review",
    })
    try:
        if opener is None:
            opener = urllib.request.urlopen
        with opener(request, timeout=20) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
        if len(raw) > MAX_RESPONSE_BYTES:
            raise ValueError("GitHub response exceeds size limit")
        return json.loads(raw.decode("utf-8"))
    except (OSError, urllib.error.URLError, ValueError, UnicodeError) as exc:
        # Never expose response body or token in the resulting artifact.
        raise RuntimeError("GitHub metadata is unavailable or invalid") from exc


def changed_lines(patch: str) -> list[tuple[int, str]]:
    """Parse only additions from unified hunks and track their NEW file lines."""
    added = []
    new_line = None
    for line in patch.splitlines():
        match = HUNK.match(line)
        if match:
            new_line = int(match.group(1))
            continue
        if new_line is None or line.startswith("\\ No newline"):
            continue
        if line.startswith("+++") or line.startswith("---"):
            continue
        if line.startswith("+"):
            added.append((new_line, line[1:]))
            new_line += 1
        elif line.startswith("-"):
            pass
        elif line.startswith(" "):
            new_line += 1
    return added


def is_source_line(text: str) -> bool:
    trimmed = text.strip()
    if not trimmed or trimmed.startswith(("//", "#", "/*", "*", "*/", "<!--")):
        return False
    # Strongly suppress common comment-only strings. A lexical analyzer cannot
    # safely classify every comment, template, or string literal.
    if trimmed.startswith(("'", '"', "`")):
        return False
    return True


def safe_md(value: Any) -> str:
    s = str(value)
    s = "".join(c if c.isprintable() else " " for c in s)
    for ch in ("\\", "`", "[", "]", "(", ")", "<", ">", "|", "*", "_"):
        s = s.replace(ch, "\\" + ch)
    return s[:260]


def source_link(repo: str, head_sha: str, path: str, line: int) -> str:
    encoded = urllib.parse.quote(path, safe="/")
    return f"https://github.com/{repo}/blob/{head_sha}/{encoded}#L{line}"


def review_diff(repo: str, pr: dict[str, Any], changed: list[dict[str, Any]], *, pagination_complete=True) -> dict[str, Any]:
    sha = (pr.get("head") or {}).get("sha", "")
    if not isinstance(sha, str) or not COMMIT_SHA.fullmatch(sha):
        raise ValueError("PR head SHA missing or malformed")
    number = pr.get("number")
    if type(number) is not int or number <= 0:
        raise ValueError("PR number missing or malformed")

    findings: list[dict[str, Any]] = []
    gaps: list[str] = []
    if not pagination_complete:
        gaps.append("GitHub returned more changed-file pages than this bounded analyzer inspected.")
    reported_files = pr.get("changed_files")
    if type(reported_files) is int and reported_files != len(changed):
        gaps.append("Changed-file count differs from the GitHub PR metadata count.")
    analyzed_files = 0
    code_files = 0
    for item in changed:
        if not isinstance(item, dict):
            gaps.append("A GitHub changed-file entry had an invalid shape.")
            continue
        path = item.get("filename")
        if not isinstance(path, str) or not path or len(path) > 1024:
            gaps.append("A changed path was invalid or too long.")
            continue
        ext = Path(path).suffix.lower()
        if ext not in SUPPORTED:
            continue
        code_files += 1
        patch = item.get("patch")
        if not isinstance(patch, str) or not patch or len(patch) > MAX_PATCH_LENGTH:
            gaps.append("Patch missing or oversized for a supported source file; its changes were not analyzed.")
            continue
        additions = changed_lines(patch)
        claimed_additions = item.get("additions")
        if type(claimed_additions) is int and claimed_additions != len(additions):
            gaps.append("A GitHub diff hunk has incomplete added-line coverage.")
            continue
        analyzed_files += 1
        for line, text in additions:
            if not is_source_line(text):
                continue
            for name, matcher, points, detail in RULES:
                if matcher.search(text):
                    if len(findings) >= MAX_FINDINGS:
                        gaps.append("Finding cap reached; additional indicators were not reviewed.")
                        break
                    findings.append({
                        "id": f"F{len(findings)+1}",
                        "rule": name,
                        "path": path,
                        "line": line,
                        "points": points,
                        "basis": "regex_on_added_diff_line",
                        "confidence": "lexical_indicator_only",
                        "description": detail,
                        "url": source_link(repo, sha, path, line),
                    })
            if len(findings) >= MAX_FINDINGS:
                break
        if len(findings) >= MAX_FINDINGS:
            break

    unique_gaps = list(dict.fromkeys(gaps))
    unique_rules = {f["rule"]: f["points"] for f in findings}
    observed = min(100, sum(unique_rules.values()))
    if unique_gaps:
        score = None
        band = "incomplete_evidence"
        status = "incomplete_evidence"
    elif not unique_rules:
        score = None
        band = "insufficient_evidence"
        status = "insufficient_evidence"
    else:
        score = observed
        band = "routine" if score < 20 else "focused" if score < 40 else "elevated" if score < 70 else "intensive"
        status = "reviewed"

    return {
        "schema_version": 2,
        "status": status,
        "repository": repo,
        "pull_number": number,
        "head_sha": sha,
        "base_sha": (pr.get("base") or {}).get("sha"),
        "score": score,
        "band": band,
        "scoring_method": "hosted_added_line_lexical_triage_v1",
        "score_status": "incomplete_evidence" if unique_gaps else "bounded_changed_line_review",
        "risk_signals": [{"rule": n, "points": pts} for n, pts in unique_rules.items()],
        "findings": len(findings),
        "source_findings": findings,
        "changed_files": len(changed),
        "code_files": code_files,
        "analyzed_code_files": analyzed_files,
        "coverage_gaps": unique_gaps,
        "non_blocking": True,
        "runtime_verified": False,
        "full_codescope_engine": False,
        "ai_used": False,
        "interpretation": (
            "Changed-line lexical indicators only. Not the CodeScope indexed AST/call-graph analyzer,"
            " a defect probability, security audit, or merge decision. No tests were executed."
        ),
    }


def report_markdown(result: dict[str, Any]) -> str:
    repo = result.get("repository", "unknown")
    number = result.get("pull_number")
    link = f"https://github.com/{repo}/pull/{number}" if number else None
    lines = [
        "# CodeScope AI — Hosted PR diff review",
        "",
        f"**PR:** [#{number}]({link})" if link else "**PR:** Not verified",
        f"**Head SHA:** `{result.get('head_sha') or 'unavailable'}`",
        f"**Outcome:** `{result['status']}`",
        "**Review score:** " + (str(result["score"]) + "/100" if result.get("score") is not None else "Unavailable"),
        f"**Review band:** `{result['band']}`",
        f"**Coverage:** {result.get('analyzed_code_files', 0)} / {result.get('code_files', 0)} supported changed source files",
        "",
        "## Source-located candidate indicators",
        "",
    ]
    findings = result.get("source_findings", [])
    if findings:
        for f in findings:
            lines.append(
                f"- **{f['id']}** [{safe_md(f['path'])}:{f['line']}]({f['url']}) "
                f"— `{f['rule']}` ({f['basis']}). {f['description']}"
            )
    else:
        lines.append("No supported changed-line lexical indicators were found. This does not establish safety.")
    lines += ["", "## Score signals", ""]
    for item in result.get("risk_signals", []):
        lines.append(f"- `{item['rule']}`: +{item['points']} review points (once per indicator category)")
    if not result.get("risk_signals"):
        lines.append("None.")
    lines += ["", "## Coverage gaps", ""]
    if result.get("coverage_gaps"):
        lines += ["- " + v for v in result["coverage_gaps"]]
    else:
        lines.append("No missing patch hunks detected within the bounded changed-line scope.")
    lines += [
        "",
        "## Important limitations",
        "",
        "- This is a small **GitHub-hosted lexical PR-diff review**, not the full CodeScope AST, call-graph, Prisma attribution, or Ollama engine.",
        "- Only added lines in supported source files were checked; unchanged contexts, deleted code, runtime behavior, and dependencies were not analyzed.",
        "- An identifier or method-name match does **not** prove the receiver, security significance, or runtime side effect.",
        "- No PR code was executed, no tests were run, no comments were posted, and no merge decisions were made.",
        "- A numeric score is a bounded review-priority heuristic, **not** a defect probability or safety guarantee.",
        "",
    ]
    return "\n".join(lines)


def output_files(folder: Path, result: dict[str, Any]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "codescope-ci-status.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (folder / "codescope-pr-review.md").write_text(report_markdown(result), encoding="utf-8")


def execute(*, environment: dict[str, str] | None = None, fetcher=fetch_json) -> dict[str, Any]:
    env = dict(os.environ if environment is None else environment)
    dest = Path(env.get("CODESCOPE_OUTPUT_DIR") or "codescope-ci-output")
    repo = env.get("GITHUB_REPOSITORY", "")
    number_str = env.get("CODESCOPE_PR_NUMBER", "")
    token = env.get("GH_TOKEN", "")
    result: dict[str, Any] = {
        "schema_version": 2, "status": "not_analyzed", "repository": repo,
        "pull_number": None, "score": None, "band": "not_analyzed",
        "score_status": "metadata_not_verified", "findings": 0, "source_findings": [],
        "risk_signals": [], "coverage_gaps": [], "non_blocking": True,
        "runtime_verified": False, "full_codescope_engine": False, "ai_used": False,
        "message": "GitHub PR metadata was not retrieved; CodeScope review did not run.",
    }
    try:
        if not GITHUB_REPO.fullmatch(repo) or not PR_NUMBER.fullmatch(number_str):
            raise ValueError("Invalid trusted repository/PR input")
        result["pull_number"] = int(number_str)
        if not token:
            raise ValueError("GitHub API token missing")
        api = "https://api.github.com/repos/" + repo
        pr = fetcher(api + f"/pulls/{number_str}", token)
        if not isinstance(pr, dict) or pr.get("number") != int(number_str):
            raise ValueError("GitHub PR identity mismatch")
        changed = []
        has_extra = False
        for page in range(1, MAX_PAGES + 2):
            url = api + f"/pulls/{number_str}/files?per_page={PER_PAGE}&page={page}"
            items = fetcher(url, token)
            if not isinstance(items, list):
                raise ValueError("Unexpected GitHub changed-file response")
            if page == MAX_PAGES + 1:
                has_extra = bool(items)
                break
            changed.extend(items)
            if len(items) < PER_PAGE:
                break
        result = review_diff(repo, pr, changed, pagination_complete=not has_extra)
    except Exception:
        # Do not expose secrets or raw GitHub API payloads via public Actions logs.
        result["message"] = "GitHub PR metadata unavailable or could not be analyzed; see coverage limitations."
        result["coverage_gaps"] = ["PR metadata or patch retrieval failed; no risk score was produced."]
    output_files(dest, result)
    if env.get("GITHUB_STEP_SUMMARY"):
        try:
            with open(env["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
                f.write(report_markdown(result))
        except OSError:
            print("Warning: could not write GitHub step summary.", file=sys.stderr)
    print(f"CodeScope hosted PR review: {result['status']}; PR #{result.get('pull_number')}; "
          f"findings {result['findings']}; score {result.get('score')}; full_engine=False")
    return result


def main() -> int:
    execute()
    return 0  # Always non-blocking: reports explain unavailable/incomplete evidence.


if __name__ == "__main__":
    raise SystemExit(main())
