import { getServerSession } from "next-auth";
import { OnRampTransactions } from "../../components/OnRampTransaction";
import { authOptions } from "../../lib/auth";
import { PrismaClient } from "@repo/db/client";

const prisma = new PrismaClient();

async function getDashboardData() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  const [balance, onRampTxns, p2pSent, p2pReceived] = await Promise.all([
    prisma.balance.findFirst({ where: { userId } }),
    prisma.onRampTransaction.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: 5,
    }),
    prisma.p2pTransfer.aggregate({
      where: { fromUserId: userId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.p2pTransfer.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const successTxns = onRampTxns.filter((t: any) => t.status === "Success");
  const totalAdded = successTxns.reduce((acc: number, t: any) => acc + t.amount, 0);

  return {
    balance: balance?.amount || 0,
    locked: balance?.locked || 0,
    totalAdded,
    sentCount: p2pSent._count,
    sentAmount: p2pSent._sum?.amount || 0,
    receivedCount: p2pReceived._count,
    receivedAmount: p2pReceived._sum?.amount || 0,
    recentTxns: onRampTxns.map((t: any) => ({
      time: t.startTime,
      amount: t.amount,
      status: t.status,
      provider: t.provider,
    })),
    userName: session?.user?.name,
  };
}

function StatCard({
  label,
  value,
  sub,
  icon,
  gradient,
  iconBg,
  iconBorder,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconBorder: string;
}) {
  return (
    <div
      style={{
        background: "rgba(15,15,26,0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "20px",
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
        transition: "all 200ms ease",
      }}
      className="stat-card"
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: gradient }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(154,154,176,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            {label}
          </p>
          <p style={{ fontSize: "24px", fontWeight: 800, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: "12px", color: "rgba(154,154,176,0.5)", marginTop: "4px" }}>
              {sub}
            </p>
          )}
        </div>
        <div
          style={{
            width: "44px",
            height: "44px",
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const formatINR = (paise: number) =>
    "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
          {greeting}, {(data.userName || "User").split(" ")[0]}! 👋
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(154,154,176,0.7)" }}>
          Here&apos;s an overview of your wallet activity
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <StatCard
          label="Available Balance"
          value={formatINR(data.balance)}
          sub="Ready to use"
          gradient="linear-gradient(90deg, #10b981, #06b6d4)"
          iconBg="rgba(16,185,129,0.12)"
          iconBorder="rgba(16,185,129,0.25)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Total Added"
          value={formatINR(data.totalAdded)}
          sub="Via Razorpay"
          gradient="linear-gradient(90deg, #7c3aed, #06b6d4)"
          iconBg="rgba(124,58,237,0.12)"
          iconBorder="rgba(124,58,237,0.25)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          }
        />
        <StatCard
          label="Money Sent"
          value={formatINR(data.sentAmount)}
          sub={`${data.sentCount} transfers`}
          gradient="linear-gradient(90deg, #f59e0b, #ef4444)"
          iconBg="rgba(245,158,11,0.12)"
          iconBorder="rgba(245,158,11,0.25)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          }
        />
        <StatCard
          label="Money Received"
          value={formatINR(data.receivedAmount)}
          sub={`${data.receivedCount} transfers`}
          gradient="linear-gradient(90deg, #06b6d4, #10b981)"
          iconBg="rgba(6,182,212,0.12)"
          iconBorder="rgba(6,182,212,0.25)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 8 22 12 18 12" /><path d="M20.94 13A9 9 0 0 1 4 13M3.06 11A9 9 0 0 1 20 11" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.07))",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "28px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif", marginBottom: "4px" }}>
            Quick Actions
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(154,154,176,0.6)" }}>
            Manage your money effortlessly
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a
            href="/transfer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              color: "white",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
              transition: "all 200ms ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Money
          </a>
          <a
            href="/p2p"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(240,240,255,0.9)",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              transition: "all 200ms ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send Money
          </a>
        </div>
      </div>

      {/* Recent Transactions */}
      <OnRampTransactions transactions={data.recentTxns} />

      <style>{`
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
}
