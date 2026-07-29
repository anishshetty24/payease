import SidebarWrapper from "../components/sidebartoggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100vh - 64px)",
        position: "relative",
      }}
    >
      <SidebarWrapper />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 28px",
          position: "relative",
          zIndex: 1,
        }}
        className="dashboard-main"
      >
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-main {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}