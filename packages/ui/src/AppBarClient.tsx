"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Appbar } from "./AppBar";
import { useRouter } from "next/navigation";

export function AppBarClient({ className }: { className?: string }) {
  const session = useSession();
  const router = useRouter();

  const handleMenuToggle = () => {
    // Dispatch custom event that the sidebar can listen to
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  return (
    <Appbar
      className={className}
      name={session.data?.user?.name}
      onSignin={signIn}
      onSignout={async () => {
        await signOut();
        router.push("/api/auth/signin");
      }}
      user={session.data?.user}
      onMenuToggle={handleMenuToggle}
    />
  );
}
