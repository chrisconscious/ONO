"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Ends the current database session and returns to the sign-in screen. */
export function SignOutButton({
  variant = "outline",
  className,
}: {
  variant?: "default" | "outline" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setIsSigningOut(false);
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      disabled={isSigningOut}
      onClick={() => void signOut()}
    >
      {isSigningOut ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : (
        <LogOutIcon aria-hidden="true" />
      )}
      {isSigningOut ? "Signing out…" : "Sign out"}
    </Button>
  );
}
