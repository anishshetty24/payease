import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@repo/db/client";

const prisma = new PrismaClient();

const STATUS_CONFIG = {
  Success: { label: "Success", color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  Processing: { label: "Processing", color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  Failure: { label: "Failed", color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

async function getAllTransactions() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  const [onRampTxns, p2pSent, p2pReceived] = await Promise.all([
    prisma.onRampTransaction.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
    }),
    prisma.p2pTransfer.findMany({
      where: { fromUserId: userId },
      orderBy: { timestamp: "desc" },
      include: { toUser: { select: { name: true, number: true } } },
    }),
    prisma.p2pTransfer.findMany({
      where: { toUserId: userId },
      orderBy: { timestamp: "desc" },
      include: { fromUser: { select: { name: true, number: true } } },
    }),
  ]);

  return { onRampTxns, p2pSent, p2pReceived };
}

export default async function TransactionsPage() {
  const { onRampTxns, p2pSent, p2pReceived } = await getAllTransactions();

  const formatINR = (paise: number) =>
    (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalOnRamp = onRampTxns
    .filter((t: any) => t.status === "Success")
    .reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalSent = p2pSent.reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalReceived = p2pReceived.reduce((acc: number, t: any) => acc + t.amount, 0);

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
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
          Transaction History
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(154,154,176,0.7)" }}>
          All your wallet activity in one place
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "28px",
        }}
        className="txn-summary-grid"
      >
        {[
          {
            label: "Total Added",
            value: `₹${formatINR(totalOnRamp)}`,
            color: "#a78bfa",
            gradient: "linear-gradient(90deg, #7c3aed, #06b6d4)",
            iconColor: "#a78bfa",
            iconBg: "rgba(124,58,237,0.12)",
            iconBorder: "rgba(124,58,237,0.25)",
          },
          {
            label: "Total Sent",
            value: `₹${formatINR(totalSent)}`,
            color: "#f87171",
            gradient: "linear-gradient(90deg, #ef4444, #f59e0b)",
            iconColor: "#f87171",
            iconBg: "rgba(239,68,68,0.12)",
            iconBorder: "rgba(239,68,68,0.25)",
          },
          {
            label: "Total Received",
            value: `₹${formatINR(totalReceived)}`,
            color: "#34d399",
            gradient: "linear-gradient(90deg, #10b981, #06b6d4)",
            iconColor: "#34d399",
            iconBg: "rgba(16,185,129,0.12)",
            iconBorder: "rgba(16,185,129,0.25)",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "rgba(15,15,26,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "16px",
              backdropFilter: "blur(20px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: card.gradient }} />
            <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(154,154,176,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              {card.label}
            </p>
            <p style={{ fontSize: "20px", fontWeight: 800, color: card.color, fontFamily: "'Outfit', sans-serif" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* OnRamp Transactions */}
      <Section
        title="Add Money Transactions"
        count={onRampTxns.length}
        accentColor="#a78bfa"
        emptyText="No add-money transactions yet"
      >
        {onRampTxns.map((t: any, i: number) => {
          const cfg = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.Processing;
          return (
            <TxnRow
              key={i}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              }
              iconBg="rgba(124,58,237,0.12)"
              iconBorder="rgba(124,58,237,0.2)"
              title={t.provider}
              subtitle={`${formatDate(t.startTime)} · ${formatTime(t.startTime)}`}
              amount={`+₹${formatINR(t.amount)}`}
              amountColor="#a78bfa"
              badge={cfg}
            />
          );
        })}
      </Section>

      {/* P2P Sent */}
      <div style={{ marginTop: "20px" }}>
        <Section
          title="Money Sent"
          count={p2pSent.length}
          accentColor="#f87171"
          emptyText="No money sent yet"
        >
          {p2pSent.map((t: any, i: number) => (
            <TxnRow
              key={i}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              }
              iconBg="rgba(239,68,68,0.1)"
              iconBorder="rgba(239,68,68,0.2)"
              title={`To: ${t.toUser?.name || t.toUser?.number || "Unknown"}`}
              subtitle={`${formatDate(t.timestamp)} · ${formatTime(t.timestamp)}`}
              amount={`-₹${formatINR(t.amount)}`}
              amountColor="#f87171"
              badge={{ label: "Sent", color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" }}
            />
          ))}
        </Section>
      </div>

      {/* P2P Received */}
      <div style={{ marginTop: "20px" }}>
        <Section
          title="Money Received"
          count={p2pReceived.length}
          accentColor="#34d399"
          emptyText="No money received yet"
        >
          {p2pReceived.map((t: any, i: number) => (
            <TxnRow
              key={i}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
              }
              iconBg="rgba(16,185,129,0.1)"
              iconBorder="rgba(16,185,129,0.2)"
              title={`From: ${(t as any).fromUser?.name || (t as any).fromUser?.number || "Unknown"}`}
              subtitle={`${formatDate(t.timestamp)} · ${formatTime(t.timestamp)}`}
              amount={`+₹${formatINR(t.amount)}`}
              amountColor="#34d399"
              badge={{ label: "Received", color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" }}
            />
          ))}
        </Section>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .txn-summary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  count,
  accentColor,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  accentColor: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(15,15,26,0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "20px",
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </h2>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "2px 9px",
            background: `${accentColor}20`,
            color: accentColor,
            borderRadius: "20px",
            border: `1px solid ${accentColor}40`,
          }}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "rgba(154,154,176,0.4)", fontSize: "14px" }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TxnRow({
  icon,
  iconBg,
  iconBorder,
  title,
  subtitle,
  amount,
  amountColor,
  badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  title: string;
  subtitle: string;
  amount: string;
  amountColor: string;
  badge: { label: string; color: string; bg: string; border: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.05)",
        gap: "12px",
        transition: "all 150ms ease",
      }}
      className="txn-row"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </p>
          <p style={{ fontSize: "12px", color: "rgba(154,154,176,0.5)", marginTop: "1px" }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: amountColor }}>
          {amount}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: "20px",
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}