"use client";
import { useState } from "react";
import { p2pTransfer } from "../lib/actions/p2ptransfer";

type Step = "form" | "confirm" | "success" | "error";

export function SendCard() {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirm = () => {
    const parsedAmt = parseFloat(amount);
    if (!number || number.length < 10) {
      showToast("error", "Enter a valid 10-digit phone number");
      return;
    }
    if (!parsedAmt || parsedAmt <= 0) {
      showToast("error", "Enter a valid amount");
      return;
    }
    setStep("confirm");
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await p2pTransfer(number, Math.round(parseFloat(amount) * 100));
      if (result?.message === "Success") {
        setStep("success");
      } else {
        setMessage(result?.message || "Transfer failed");
        setStep("error");
      }
    } catch {
      setMessage("Something went wrong");
      setStep("error");
    }
    setLoading(false);
  };

  const reset = () => {
    setNumber("");
    setAmount("");
    setStep("form");
    setMessage("");
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
            color: "white",
            animation: "fadeIn 0.3s ease-out",
            backdropFilter: "blur(12px)",
            ...(toast.type === "success"
              ? { background: "rgba(16,185,129,0.9)", border: "1px solid rgba(16,185,129,0.5)" }
              : { background: "rgba(239,68,68,0.9)", border: "1px solid rgba(239,68,68,0.5)" }),
          }}
        >
          {toast.type === "success" ? "✅ " : "❌ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            background: "linear-gradient(135deg, #f0f0ff, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "6px",
          }}
        >
          Send Money
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(154,154,176,0.7)" }}>
          Instant peer-to-peer transfers
        </p>
      </div>

      <div
        style={{
          maxWidth: "480px",
        }}
      >
        {/* FORM STEP */}
        {step === "form" && (
          <div
            style={{
              background: "rgba(15,15,26,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "28px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))",
                  border: "1px solid rgba(124,58,237,0.3)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif" }}>
                  Transfer Details
                </h2>
                <p style={{ fontSize: "13px", color: "rgba(154,154,176,0.7)" }}>
                  Enter recipient&apos;s number and amount
                </p>
              </div>
            </div>

            {/* Phone Number Field */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(154,154,176,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Recipient Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(154,154,176,0.5)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  style={{
                    width: "100%",
                    padding: "13px 14px 13px 42px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    color: "#f0f0ff",
                    fontSize: "15px",
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                    transition: "all 200ms ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(124,58,237,0.5)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Amount Field */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(154,154,176,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Amount (₹)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", fontWeight: 600, color: "rgba(154,154,176,0.6)" }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  style={{
                    width: "100%",
                    padding: "13px 14px 13px 30px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    color: "#f0f0ff",
                    fontSize: "18px",
                    fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                    outline: "none",
                    transition: "all 200ms ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(124,58,237,0.5)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleConfirm}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                cursor: "pointer",
                border: "none",
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                transition: "all 250ms ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              id="p2p-review-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Review Transfer
            </button>

            <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(154,154,176,0.4)", marginTop: "12px" }}>
              Transfers are instant and cannot be reversed
            </p>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === "confirm" && (
          <div
            style={{
              background: "rgba(15,15,26,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "28px",
              backdropFilter: "blur(20px)",
              animation: "fadeIn 0.3s ease-out",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} />

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif", marginBottom: "6px" }}>
                Confirm Transfer
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(154,154,176,0.7)" }}>
                Please review before sending
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: "rgba(154,154,176,0.7)" }}>To</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0ff" }}>{number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "rgba(154,154,176,0.7)" }}>Amount</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#a78bfa", fontFamily: "'Outfit', sans-serif" }}>
                  ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setStep("form")}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(154,154,176,0.9)",
                  transition: "all 200ms ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "13px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none",
                  color: "white",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(239,68,68,0.3)",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                id="p2p-confirm-btn"
              >
                {loading ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Sending...
                  </>
                ) : (
                  "Confirm Send"
                )}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div
            style={{
              background: "rgba(15,15,26,0.9)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "20px",
              padding: "36px 28px",
              backdropFilter: "blur(20px)",
              animation: "bounceIn 0.5s ease-out",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #10b981, #06b6d4)" }} />
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#34d399", fontFamily: "'Outfit', sans-serif", marginBottom: "8px" }}>
              Transfer Successful!
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(154,154,176,0.7)", marginBottom: "6px" }}>
              ₹{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} sent to
            </p>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "#f0f0ff", marginBottom: "24px" }}>
              {number}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "12px 28px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                border: "none",
                color: "white",
                boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
              }}
            >
              Send Another
            </button>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div
            style={{
              background: "rgba(15,15,26,0.9)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "20px",
              padding: "36px 28px",
              backdropFilter: "blur(20px)",
              animation: "fadeIn 0.3s ease-out",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #ef4444, #f59e0b)" }} />
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#f87171", fontFamily: "'Outfit', sans-serif", marginBottom: "8px" }}>
              Transfer Failed
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(154,154,176,0.7)", marginBottom: "24px" }}>
              {message}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "12px 28px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(240,240,255,0.9)",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
