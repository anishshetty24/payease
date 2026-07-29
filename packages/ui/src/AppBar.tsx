"use client";

interface AppbarProps {
  user?: {
    name?: string | null;
  };
  onSignin: () => void;
  onSignout: () => void;
  name?: string | null;
  className?: string;
  onMenuToggle?: () => void;
}

export const Appbar = ({
  user,
  onSignin,
  onSignout,
  name,
  className,
  onMenuToggle,
}: AppbarProps) => {
  const initials = name
    ? name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav
      style={{
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
      }}
      suppressHydrationWarning
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 20px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Hamburger + Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Mobile hamburger */}
          {user && (
            <button
              onClick={onMenuToggle}
              aria-label="Toggle sidebar"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.8)",
                transition: "all 150ms ease",
              }}
              id="appbar-hamburger"
              className="appbar-hamburger"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "20px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.3px",
              }}
            >
              PayEase
            </span>
          </div>
        </div>

        {/* Right: User + Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Avatar bubble */}
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "white",
                  boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "rgba(240,240,255,0.8)",
                }}
                className="hide-mobile-name"
              >
                {(name ?? "User").split(" ")[0]}
              </span>
            </div>
          )}

          <button
            onClick={user ? onSignout : onSignin}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 200ms ease",
              border: "none",
              ...(user
                ? {
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                  }
                : {
                    background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                  }),
            }}
            id="appbar-auth-btn"
          >
            {user ? "Sign Out" : "Sign In"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .appbar-hamburger {
            display: flex !important;
          }
          .hide-mobile-name {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};
