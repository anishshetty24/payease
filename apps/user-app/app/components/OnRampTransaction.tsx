const STATUS_CONFIG = {
  Success: {
    label: "Success",
    color: "#34d399",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    dot: "#34d399",
  },
  Processing: {
    label: "Processing",
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
    dot: "#fbbf24",
  },
  Failure: {
    label: "Failed",
    color: "#f87171",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
    dot: "#f87171",
  },
};

export function OnRampTransactions({
  transactions,
}: {
  transactions: {
    time: Date;
    amount: number;
    status: string;
    provider: string;
  }[];
}) {
  if (!transactions.length) {
    return (
      <div
        style={{
          background: "rgba(15,15,26,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "24px",
          backdropFilter: "blur(20px)",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#f0f0ff",
            marginBottom: "24px",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Recent Transactions
        </h2>
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(154,154,176,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(154,154,176,0.7)" }}>
            No transactions yet
          </p>
          <p style={{ fontSize: "13px", color: "rgba(154,154,176,0.4)", marginTop: "4px" }}>
            Add money to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(15,15,26,0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "24px",
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#f0f0ff",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Recent Transactions
        </h2>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "3px 10px",
            background: "rgba(124,58,237,0.15)",
            color: "#a78bfa",
            borderRadius: "20px",
            border: "1px solid rgba(124,58,237,0.25)",
          }}
        >
          {transactions.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {transactions.map((t, i) => {
          const statusCfg =
            STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] ||
            STATUS_CONFIG.Processing;
          const formattedAmount = (t.amount / 100).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          });
          const date = new Date(t.time);
          const formattedDate = date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const formattedTime = date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 200ms ease",
                gap: "12px",
              }}
              className="txn-row"
            >
              {/* Left: Icon + Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))",
                    border: "1px solid rgba(16,185,129,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.provider}
                  </p>
                  <p style={{ fontSize: "12px", color: "rgba(154,154,176,0.6)", marginTop: "2px" }}>
                    {formattedDate} · {formattedTime}
                  </p>
                </div>
              </div>

              {/* Right: Amount + Status */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: "4px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#34d399" }}>
                  +₹{formattedAmount}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    border: `1px solid ${statusCfg.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: statusCfg.dot,
                      display: "inline-block",
                    }}
                  />
                  {statusCfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .txn-row:hover {
          background: rgba(255,255,255,0.055) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
      `}</style>
    </div>
  );
}