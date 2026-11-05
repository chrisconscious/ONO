"use client";

import { CheckIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { passwordRules } from "@/lib/auth/validation";

/**
 * Live feedback for the password policy. It mirrors the server schema; the
 * server remains the authority on every submission.
 */
export function PasswordChecklist({
  value,
  className,
  id,
}: {
  value: string;
  className?: string;
  id?: string;
}) {
  return (
    <ul id={id} className={cn("grid gap-1.5 text-xs sm:grid-cols-2", className)}>
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        const Icon = met ? CheckIcon : CircleIcon;

        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5",
              met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3 shrink-0" aria-hidden="true" />
            <span>{rule.label}</span>
            <span className="sr-only">{met ? "met" : "not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
