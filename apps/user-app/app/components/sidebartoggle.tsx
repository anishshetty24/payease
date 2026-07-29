"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SidebarItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

function SidebarNavItem({ href, title, icon, onClick }: SidebarItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const selected = pathname === href;

  return (
    <button
      onClick={() => {
        router.push(href);
        onClick?.();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "11px 14px",
        borderRadius: "12px",
        cursor: "pointer",
        border: "none",
        textAlign: "left",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        background: selected
          ? "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.12) 100%)"
          : "transparent",
        color: selected ? "#a78bfa" : "rgba(154, 154, 176, 0.9)",
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
        fontWeight: selected ? 600 : 500,
      }}
      className={`sidebar-item ${selected ? "sidebar-item--active" : ""}`}
    >
      {/* Active indicator bar */}
      {selected && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "60%",
            background: "linear-gradient(180deg, #7c3aed, #06b6d4)",
            borderRadius: "0 4px 4px 0",
          }}
        />
      )}
      
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "9px",
          flexShrink: 0,
          background: selected
            ? "linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(6,182,212,0.2) 100%)"
            : "rgba(255,255,255,0.05)",
          border: selected ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.06)",
          transition: "all 200ms ease",
        }}
      >
        {icon}
      </div>
      <span>{title}</span>
    </button>
  );
}

export default function SidebarWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: "64px",
          left: 0,
          height: "calc(100vh - 64px)",
          width: "260px",
          background: "rgba(10, 10, 15, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "4px 0 30px rgba(0,0,0,0.3)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
      >
        {/* Sidebar gradient top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(6,182,212,0.4), transparent)",
          }}
        />

        {/* Navigation section */}
        <div style={{ padding: "20px 12px 12px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(154,154,176,0.5)",
              paddingLeft: "14px",
              marginBottom: "8px",
            }}
          >
            MAIN MENU
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <SidebarNavItem
              href="/dashboard"
              icon={<HomeIcon />}
              title="Dashboard"
              onClick={() => setIsOpen(false)}
            />
            <SidebarNavItem
              href="/transfer"
              icon={<TransferIcon />}
              title="Add Money"
              onClick={() => setIsOpen(false)}
            />
            <SidebarNavItem
              href="/transactions"
              icon={<TransactionsIcon />}
              title="Transactions"
              onClick={() => setIsOpen(false)}
            />
            <SidebarNavItem
              href="/p2p"
              icon={<P2PIcon />}
              title="Send Money"
              onClick={() => setIsOpen(false)}
            />
          </nav>
        </div>

        {/* Bottom section */}
        <div
          style={{
            marginTop: "auto",
            padding: "16px 12px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              padding: "14px",
              background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 100%)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#a78bfa", marginBottom: "4px" }}>
              PayEase v1.0
            </div>
            <div style={{ fontSize: "11px", color: "rgba(154,154,176,0.6)" }}>
              Secure & Fast Payments
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 89,
            backdropFilter: "blur(4px)",
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Desktop spacer */}
      <div className="sidebar-spacer" style={{ width: "260px", flexShrink: 0 }} />

      <style>{`
        .sidebar-item:hover {
          background: rgba(255,255,255,0.06) !important;
          color: rgba(240,240,255,0.9) !important;
        }
        .sidebar-item--active:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%) !important;
          color: #a78bfa !important;
        }
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar--open {
            transform: translateX(0) !important;
          }
          .sidebar-spacer {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function P2PIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
