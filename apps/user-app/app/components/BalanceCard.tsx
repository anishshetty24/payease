export function BalanceCard({
  amount,
  locked,
}: {
  amount: number;
  locked: number;
}) {
  const unlocked = amount / 100;
  const lockedAmt = locked / 100;
  const total = (amount + locked) / 100;

  const formatINR = (val: number) =>
    val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      style={{
        background: "rgba(15,15,26,0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "24px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, #10b981, #06b6d4)",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif" }}>
            Wallet Balance
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(154,154,176,0.7)", marginTop: "1px" }}>
            Your current funds
          </p>
        </div>
      </div>

      {/* Total Balance Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: "14px",
          padding: "18px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(52,211,153,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          Total Balance
        </p>
        <p
          style={{
            fontSize: "32px",
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            background: "linear-gradient(135deg, #34d399, #22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.5px",
          }}
        >
          ₹{formatINR(total)}
        </p>
      </div>

      {/* Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 8px rgba(52,211,153,0.5)",
              }}
            />
            <span style={{ fontSize: "14px", color: "rgba(154,154,176,0.9)" }}>Available</span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#34d399" }}>
            ₹{formatINR(unlocked)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#fbbf24",
                boxShadow: "0 0 8px rgba(251,191,36,0.4)",
              }}
            />
            <span style={{ fontSize: "14px", color: "rgba(154,154,176,0.9)" }}>Locked</span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24" }}>
            ₹{formatINR(lockedAmt)}
          </span>
        </div>
      </div>
    </div>
  );
}