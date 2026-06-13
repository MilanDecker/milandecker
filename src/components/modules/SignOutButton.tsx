"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(() => signOut())}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
