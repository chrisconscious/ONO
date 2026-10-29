"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CompassIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Workspace onboarding is a client-only UI preference. There is no user
 * preference table in the approved schema, so dismissal is stored in the
 * browser and never treated as authorization or business data.
 */
const STORAGE_KEY = "ono.onboarding.workspace.v1";
const CHANGE_EVENT = "ono:onboarding-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked by browser privacy settings. Hide the optional
    // tour rather than failing or repeatedly showing it.
    return "dismissed";
  }
}

function getServerPreference() {
  return "dismissed";
}

function writePreference(value: "completed" | "dismissed") {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The preference is optional; ignoring a denied write keeps the app usable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const tourSteps = [
  {
    title: "Move between business areas",
    description:
      "Use the sidebar to move between CRM, sales, finance, inventory and delivery. On a phone, open the navigation from the menu button. Only modules your role permits are shown.",
  },
  {
    title: "Work with real records",
    description:
      "Each module has the same pattern: search and filter the list, open a record, then use the actions your role permits. Empty and error states explain the next step without hiding data.",
  },
  {
    title: "Let the server calculate money",
    description:
      "On quotations, orders, purchase orders and invoices, add line items from the detail page. Quantity, price, tax and balances are recalculated on the server after each change.",
  },
  {
    title: "Keep the workspace governed",
    description:
      "Sensitive actions are written to the tenant audit trail. Workspace administrators manage members and roles in settings; the platform console stays separate from tenant data.",
  },
] as const;

type GettingStartedProps = {
  showCrm: boolean;
  showSales: boolean;
  showAnalytics: boolean;
};

/**
 * Compact first-run guidance for the workspace overview. It is deliberately
 * limited to one dismissible card and an optional tour so business data stays
 * the main focus.
 */
export function GettingStarted({
  showCrm,
  showSales,
  showAnalytics,
}: GettingStartedProps) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    getServerPreference,
  );
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  if (preference) return null;

  type Step = {
    href: string;
    label: string;
    description: string;
    icon: typeof UsersIcon;
  };

  const steps: Step[] = [];
  if (showCrm) {
    steps.push({
      href: "/app/leads",
      label: "Capture demand",
      description: "Add or qualify the first lead.",
      icon: UsersIcon,
    });
  }
  if (showSales) {
    steps.push({
      href: "/app/invoices",
      label: "Bill the work",
      description: "Create an invoice and add line items.",
      icon: ReceiptTextIcon,
    });
  }
  if (showAnalytics) {
    steps.push({
      href: "/app/analytics",
      label: "Read the numbers",
      description: "Review pipeline, revenue and delivery.",
      icon: BarChart3Icon,
    });
  }

  function dismiss() {
    writePreference("dismissed");
    setTourOpen(false);
  }

  function finishTour() {
    writePreference("completed");
    setTourOpen(false);
  }

  const currentStep = tourSteps[stepIndex];
  const isLastStep = stepIndex === tourSteps.length - 1;

  return (
    <>
      <section
        aria-labelledby="getting-started-title"
        className="rounded-xl border border-border bg-card shadow-xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CompassIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                id="getting-started-title"
                className="text-sm font-semibold text-foreground"
              >
                Getting started
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                A short path through the workspace. Dismiss this card when you no
                longer need it.
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          {steps.length > 0 ? (
            <ol className="grid gap-3 sm:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.href}>
                    <Link
                      href={step.href}
                      className="group flex h-full flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.7rem] tabular">
                          {index + 1}
                        </span>
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {step.label}
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStepIndex(0);
                setTourOpen(true);
              }}
            >
              Take the optional tour
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {tourSteps.length} short steps. You can leave at any time.
            </span>
          </div>
        </div>
      </section>

      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Workspace tour
            </p>
            <DialogTitle>{currentStep.title}</DialogTitle>
            <DialogDescription>{currentStep.description}</DialogDescription>
          </DialogHeader>

          <p className="text-xs text-muted-foreground tabular" aria-live="polite">
            Step {stepIndex + 1} of {tourSteps.length}
          </p>

          <DialogFooter className="flex-row items-center justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Skip tour
            </Button>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
              >
                Back
              </Button>
              {isLastStep ? (
                <Button size="sm" onClick={finishTour}>
                  Finish
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() =>
                    setStepIndex((value) =>
                      Math.min(tourSteps.length - 1, value + 1),
                    )
                  }
                >
                  Next
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
