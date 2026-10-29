"use client";

import { useMemo, useState } from "react";
import {
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, InlineAlert, SectionCard } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { formatRelative, humanise } from "@/lib/format";
import {
  AUTOMATION_ACTION_LABELS,
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_FIELDS,
  AUTOMATION_CONDITION_LABELS,
  AUTOMATION_NUMERIC_FIELDS,
  AUTOMATION_OPERATORS,
  AUTOMATION_OPERATOR_LABELS,
  AUTOMATION_TEMPLATES,
  AUTOMATION_TRIGGER_LABELS,
  AUTOMATION_TRIGGERS,
  describeAutomationAction,
  describeAutomationCondition,
  type AutomationAction,
  type AutomationActionType,
  type AutomationCondition,
  type AutomationConditionField,
  type AutomationOperator,
  type AutomationTrigger,
} from "@/lib/crm/automation";

type MemberOption = { value: string; label: string };

type WorkflowRun = {
  id: string;
  status: string;
  trigger: string;
  attempts: number;
  summary: unknown;
  error: string | null;
  startedAt: string | Date;
  finishedAt: string | Date | null;
};

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: unknown;
  actions: unknown;
  isActive: boolean;
  lastRunAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  runs: WorkflowRun[];
  _count: { runs: number };
};

type FormState = {
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
};

const defaultAction = (type: AutomationActionType): AutomationAction => {
  switch (type) {
    case "CREATE_TASK":
      return {
        type,
        params: {
          title: "",
          dueInDays: "2",
          assignee: "record_owner",
          priority: "MEDIUM",
        },
      };
    case "ASSIGN_LEAD_OWNER":
      return { type, params: { ownerId: "" } };
    case "UPDATE_LEAD_STATUS":
      return { type, params: { status: "CONTACTED" } };
    case "CREATE_NOTIFICATION":
      return {
        type,
        params: {
          title: "",
          body: "",
          audience: "record_owner",
        },
      };
    case "SET_OPPORTUNITY_NEXT_STEP":
      return { type, params: { nextStep: "" } };
    default:
      return { type: "CREATE_TASK", params: { title: "" } };
  }
};

const blankForm: FormState = {
  name: "",
  description: "",
  trigger: "LEAD_CREATED",
  conditions: [],
  actions: [
    {
      type: "CREATE_TASK",
      params: {
        title: "Follow up with the new lead",
        dueInDays: "1",
        assignee: "record_owner",
        priority: "HIGH",
      },
    },
  ],
  isActive: false,
};

function leadTrigger(trigger: AutomationTrigger) {
  return trigger.startsWith("LEAD_");
}

function opportunityTrigger(trigger: AutomationTrigger) {
  return trigger.startsWith("OPPORTUNITY_");
}

/** Actions the server permits for a trigger. */
function allowedActions(trigger: AutomationTrigger): AutomationActionType[] {
  const generic: AutomationActionType[] = [
    "CREATE_TASK",
    "CREATE_NOTIFICATION",
  ];
  if (leadTrigger(trigger)) {
    return [...generic, "ASSIGN_LEAD_OWNER", "UPDATE_LEAD_STATUS"];
  }
  if (opportunityTrigger(trigger)) {
    return [...generic, "SET_OPPORTUNITY_NEXT_STEP"];
  }
  return generic;
}

function toConditions(value: unknown): AutomationCondition[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      field: String(item.field ?? "source") as AutomationConditionField,
      operator: String(item.operator ?? "equals") as AutomationOperator,
      value: String(item.value ?? ""),
    }));
}

function toActions(value: unknown): AutomationAction[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      type: String(item.type ?? "CREATE_TASK") as AutomationActionType,
      params:
        typeof item.params === "object" && item.params !== null
          ? Object.fromEntries(
              Object.entries(item.params as Record<string, unknown>).map(
                ([key, entry]) => [key, String(entry ?? "")],
              ),
            )
          : {},
    }));
}

type AutomationManagerProps = {
  initialWorkflows: Workflow[];
  members: MemberOption[];
  permissions: { create: boolean; update: boolean; delete: boolean };
};

/**
 * Full automation console.
 *
 * Every mutation goes through the tenant API where the definition is validated
 * again, actions run inside a transaction, runs are idempotent and failures are
 * retained. Activations and manual runs are explicit; nothing runs silently in
 * the browser.
 */
export function AutomationManager({
  initialWorkflows,
  members,
  permissions,
}: AutomationManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [runWorkflow, setRunWorkflow] = useState<Workflow | null>(null);
  const [runRecordId, setRunRecordId] = useState("");
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runnableType = useMemo(() => {
    if (!runWorkflow) return null;
    if (runWorkflow.trigger.startsWith("LEAD_")) return "lead" as const;
    if (runWorkflow.trigger.startsWith("OPPORTUNITY_")) {
      return "opportunity" as const;
    }
    return null;
  }, [runWorkflow]);

  async function loadWorkflows() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tenant/crm/automations");
      const data = (await response.json().catch(() => ({}))) as {
        workflows?: Workflow[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Automations are unavailable.");
        return;
      }
      setWorkflows(Array.isArray(data.workflows) ? data.workflows : []);
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function makeAction(type: AutomationActionType): AutomationAction {
    const action = defaultAction(type);
    if (type === "ASSIGN_LEAD_OWNER" && members.length > 0) {
      action.params.ownerId = members[0].value;
    }
    return action;
  }

  function openCreate(template?: (typeof AUTOMATION_TEMPLATES)[number]) {
    if (template) {
      setForm({
        name: template.name,
        description: template.description,
        trigger: template.definition.trigger,
        conditions: template.definition.conditions.map((item) => ({ ...item })),
        actions: template.definition.actions.map((item) => ({
          type: item.type,
          params: { ...item.params },
        })),
        isActive: false,
      });
    } else {
      setForm({
        ...blankForm,
        conditions: [],
        actions: [
          {
            type: "CREATE_TASK",
            params: {
              title: "",
              dueInDays: "2",
              assignee: "record_owner",
              priority: "MEDIUM",
            },
          },
        ],
      });
    }
    setEditingId(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(workflow: Workflow) {
    setForm({
      name: workflow.name,
      description: workflow.description ?? "",
      trigger: workflow.trigger as AutomationTrigger,
      conditions: toConditions(workflow.conditions),
      actions: toActions(workflow.actions),
      isActive: workflow.isActive,
    });
    setEditingId(workflow.id);
    setFormError(null);
    setFormOpen(true);
  }

  function updateAction(index: number, next: AutomationAction) {
    setForm((current) => ({
      ...current,
      actions: current.actions.map((action, actionIndex) =>
        actionIndex === index ? next : action,
      ),
    }));
  }

  function setTrigger(trigger: AutomationTrigger) {
    const permitted = allowedActions(trigger);
    setForm((current) => ({
      ...current,
      trigger,
      actions: current.actions
        .map((action) =>
          permitted.includes(action.type)
            ? action
            : makeAction(permitted[0] ?? "CREATE_TASK"),
        )
        .slice(0, 5),
    }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      trigger: form.trigger,
      conditions: form.conditions,
      actions: form.actions,
      isActive: form.isActive,
    };

    try {
      const response = await fetch(
        editingId
          ? `/api/tenant/crm/automations/${editingId}`
          : "/api/tenant/crm/automations",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setFormError(data.error ?? "The workflow could not be saved.");
        return;
      }

      toast.success(
        form.isActive
          ? "Automation saved and activated."
          : "Automation saved as inactive.",
      );
      setFormOpen(false);
      await loadWorkflows();
    } catch {
      setFormError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(workflow: Workflow) {
    setBusyId(workflow.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/tenant/crm/automations/${workflow.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: workflow.name,
            description: workflow.description ?? undefined,
            trigger: workflow.trigger,
            conditions: toConditions(workflow.conditions),
            actions: toActions(workflow.actions),
            isActive: !workflow.isActive,
          }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "The automation could not be updated.");
        return;
      }
      toast.success(workflow.isActive ? "Automation paused." : "Automation activated.");
      await loadWorkflows();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(workflow: Workflow) {
    if (
      !window.confirm(
        `Delete "${workflow.name}" and its run history? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(workflow.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/tenant/crm/automations/${workflow.id}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "The automation could not be deleted.");
        return;
      }
      toast.success("Automation deleted.");
      await loadWorkflows();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function sweep() {
    setSweeping(true);
    setSweepResult(null);
    setError(null);
    try {
      const response = await fetch("/api/tenant/crm/automations/sweep", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        counters?: Record<string, number>;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Due automations could not be evaluated.");
        return;
      }
      const counters = data.counters ?? {};
      const label = Object.entries(counters)
        .map(([key, value]) => `${humanise(key)}: ${value}`)
        .join(", ");
      setSweepResult(label || "No due automations were found.");
      toast.success("Due automations evaluated.");
      await loadWorkflows();
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setSweeping(false);
    }
  }

  async function runManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!runWorkflow || !runnableType) return;
    if (!runRecordId.trim()) {
      setRunError("Enter the record identifier to test against.");
      return;
    }

    setRunning(true);
    setRunError(null);
    try {
      const response = await fetch(
        `/api/tenant/crm/automations/${runWorkflow.id}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordType: runnableType,
            recordId: runRecordId.trim(),
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };
      if (!response.ok) {
        setRunError(data.error ?? "The automation could not run.");
        return;
      }
      toast.success(`Run finished: ${data.status ?? "completed"}.`);
      setRunWorkflow(null);
      setRunRecordId("");
      await loadWorkflows();
    } catch {
      setRunError("We could not reach the server. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {permissions.create ? (
            <Button size="sm" onClick={() => openCreate()}>
              <PlusIcon aria-hidden="true" />
              New workflow
            </Button>
          ) : null}
          {permissions.update ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void sweep()}
              disabled={sweeping}
            >
              {sweeping ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCwIcon aria-hidden="true" />
              )}
              {sweeping ? "Checking" : "Run due checks"}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void loadWorkflows()}
            disabled={loading}
          >
            {loading ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCwIcon aria-hidden="true" />
            )}
            Refresh
          </Button>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Event-driven runs execute when a record changes. Time-based triggers
          need a trusted scheduler to call the protected sweep endpoint; no
          scheduler is bundled with this application.
        </p>
      </div>

      {sweepResult ? (
        <InlineAlert tone="success" title="Due-check result">
          {sweepResult}
        </InlineAlert>
      ) : null}

      {error ? (
        <InlineAlert tone="error" title="Automation error">
          {error}
        </InlineAlert>
      ) : null}

      {permissions.create ? (
        <SectionCard
          title="Start from a template"
          description="Templates are safe examples. Nothing becomes active until you review and save it."
          bodyClassName="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {AUTOMATION_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => openCreate(template)}
              className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="text-sm font-medium text-foreground">
                {template.name}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {template.description}
              </span>
            </button>
          ))}
        </SectionCard>
      ) : null}

      {workflows.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<WorkflowIcon aria-hidden="true" />}
            title="No automations yet"
            description="Create a workflow or start from a template. Automations only perform the safe, server-validated actions listed in the editor."
            action={
              permissions.create ? (
                <Button size="sm" onClick={() => openCreate()}>
                  <PlusIcon aria-hidden="true" />
                  New workflow
                </Button>
              ) : undefined
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {workflows.map((workflow) => {
            const trigger = workflow.trigger as AutomationTrigger;
            const conditions = toConditions(workflow.conditions);
            const actions = toActions(workflow.actions);
            const busy = busyId === workflow.id;
            return (
              <article
                key={workflow.id}
                className="flex flex-col rounded-xl border border-border bg-card shadow-xs"
              >
                <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">
                        {workflow.name}
                      </h2>
                      <StatusBadge
                        status={workflow.isActive ? "ACTIVE" : "PAUSED"}
                        label={workflow.isActive ? "Active" : "Paused"}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {AUTOMATION_TRIGGER_LABELS[trigger] ??
                        humanise(workflow.trigger)}
                      {" · "}
                      {workflow._count.runs} run
                      {workflow._count.runs === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {permissions.update ? (
                      <>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => openEdit(workflow)}
                          disabled={busy}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => void toggleActive(workflow)}
                          disabled={busy}
                        >
                          {workflow.isActive ? (
                            <PauseIcon aria-hidden="true" />
                          ) : (
                            <PlayIcon aria-hidden="true" />
                          )}
                          {workflow.isActive ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setRunWorkflow(workflow);
                            setRunRecordId("");
                            setRunError(null);
                          }}
                          disabled={busy}
                          title={
                            workflow.trigger === "TASK_OVERDUE"
                              ? "Task triggers are evaluated by the due-check sweep."
                              : "Run against one record"
                          }
                        >
                          <PlayIcon aria-hidden="true" />
                          Test
                        </Button>
                      </>
                    ) : null}
                    {permissions.delete ? (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Delete ${workflow.name}`}
                        onClick={() => void remove(workflow)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2Icon
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2Icon aria-hidden="true" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </header>

                <div className="flex flex-1 flex-col gap-3 px-4 py-3">
                  {workflow.description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {workflow.description}
                    </p>
                  ) : null}

                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      Conditions
                    </p>
                    {conditions.length === 0 ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Always runs when the trigger fires.
                      </p>
                    ) : (
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {conditions.map((condition) => (
                          <li
                            key={describeAutomationCondition(condition)}
                            className="text-xs text-foreground"
                          >
                            {describeAutomationCondition(condition)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      Actions
                    </p>
                    <ol className="mt-1 flex flex-col gap-0.5">
                      {actions.map((action, index) => (
                        <li
                          key={`${action.type}-${index}`}
                          className="text-xs text-foreground"
                        >
                          {index + 1}. {describeAutomationAction(action)}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-auto border-t border-border pt-2 text-[0.7rem] text-muted-foreground">
                    Last run:{" "}
                    {workflow.lastRunAt
                      ? formatRelative(workflow.lastRunAt)
                      : "never"}
                    {workflow.runs[0] ? (
                      <span className="ml-1.5">
                        ({humanise(workflow.runs[0].status)})
                      </span>
                    ) : null}
                  </div>

                  {workflow.runs.some((run) => run.status === "FAILED") ? (
                    <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-2.5 py-2">
                      <p className="text-[0.7rem] font-medium text-destructive">
                        Recent failure
                      </p>
                      <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
                        {workflow.runs.find((run) => run.status === "FAILED")?.error ??
                          "The run failed. Review the workflow conditions and actions."}
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit automation" : "New automation"}
            </DialogTitle>
            <DialogDescription>
              The server validates every definition. Actions run inside one
              transaction and are retried once on failure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="flex flex-col gap-4">
            {formError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="automation-name">Name</FieldLabel>
                  <Input
                    id="automation-name"
                    value={form.name}
                    maxLength={160}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    disabled={saving}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="automation-trigger">Trigger</FieldLabel>
                  <Select
                    value={form.trigger}
                    onValueChange={(value) => {
                      if (value) setTrigger(value as AutomationTrigger);
                    }}
                  >
                    <SelectTrigger
                      id="automation-trigger"
                      className="w-full"
                      aria-label="Automation trigger"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTOMATION_TRIGGERS.map((trigger) => (
                        <SelectItem key={trigger} value={trigger}>
                          {AUTOMATION_TRIGGER_LABELS[trigger]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="automation-description">
                  Description (optional)
                </FieldLabel>
                <Textarea
                  id="automation-description"
                  rows={2}
                  value={form.description}
                  maxLength={1000}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </Field>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Conditions ({form.conditions.length}/5)
                  </p>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={saving || form.conditions.length >= 5}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        conditions: [
                          ...current.conditions,
                          { field: "source", operator: "equals", value: "" },
                        ],
                      }))
                    }
                  >
                    <PlusIcon aria-hidden="true" />
                    Add condition
                  </Button>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  All conditions must match. An empty list always runs.
                </p>

                {form.conditions.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                    No conditions. The workflow runs whenever the trigger fires.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {form.conditions.map((condition, index) => {
                      const numeric = AUTOMATION_NUMERIC_FIELDS.has(
                        condition.field,
                      );
                      const valueless = ["is_set", "is_empty"].includes(
                        condition.operator,
                      );
                      return (
                        <div
                          key={`condition-${index}`}
                          className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                        >
                          <Select
                            value={condition.field}
                            onValueChange={(value) => {
                              if (!value) return;
                              setForm((current) => ({
                                ...current,
                                conditions: current.conditions.map(
                                  (entry, entryIndex) =>
                                    entryIndex === index
                                      ? {
                                          ...entry,
                                          field: value as AutomationConditionField,
                                        }
                                      : entry,
                                ),
                              }));
                            }}
                          >
                            <SelectTrigger
                              className="w-full"
                              aria-label={`Condition ${index + 1} field`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AUTOMATION_CONDITION_FIELDS.map((field) => (
                                <SelectItem key={field} value={field}>
                                  {AUTOMATION_CONDITION_LABELS[field]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={condition.operator}
                            onValueChange={(value) => {
                              if (!value) return;
                              setForm((current) => ({
                                ...current,
                                conditions: current.conditions.map(
                                  (entry, entryIndex) =>
                                    entryIndex === index
                                      ? {
                                          ...entry,
                                          operator: value as AutomationOperator,
                                        }
                                      : entry,
                                ),
                              }));
                            }}
                          >
                            <SelectTrigger
                              className="w-full"
                              aria-label={`Condition ${index + 1} operator`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AUTOMATION_OPERATORS.map((operator) => (
                                <SelectItem key={operator} value={operator}>
                                  {AUTOMATION_OPERATOR_LABELS[operator]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            value={condition.value}
                            type={numeric ? "number" : "text"}
                            inputMode={numeric ? "decimal" : undefined}
                            aria-label={`Condition ${index + 1} value`}
                            disabled={saving || valueless}
                            placeholder={valueless ? "Not used" : "Value"}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                conditions: current.conditions.map(
                                  (entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, value: event.target.value }
                                      : entry,
                                ),
                              }))
                            }
                          />

                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Remove condition ${index + 1}`}
                            disabled={saving}
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                conditions: current.conditions.filter(
                                  (_, entryIndex) => entryIndex !== index,
                                ),
                              }))
                            }
                          >
                            <XIcon aria-hidden="true" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Actions ({form.actions.length}/5)
                  </p>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={saving || form.actions.length >= 5}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        actions: [
                          ...current.actions,
                          makeAction(allowedActions(current.trigger)[0] ?? "CREATE_TASK"),
                        ],
                      }))
                    }
                  >
                    <PlusIcon aria-hidden="true" />
                    Add action
                  </Button>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Actions are limited to safe CRM updates and in-app notifications.
                  No email or message is sent.
                </p>

                <div className="mt-2 flex flex-col gap-2">
                  {form.actions.map((action, index) => (
                    <div
                      key={`action-${index}`}
                      className="rounded-lg border border-border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Select
                          value={action.type}
                          onValueChange={(value) => {
                            if (!value) return;
                            updateAction(
                              index,
                              defaultAction(value as AutomationActionType),
                            );
                          }}
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-label={`Action ${index + 1} type`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUTOMATION_ACTION_TYPES.filter((type) =>
                              allowedActions(form.trigger).includes(type),
                            ).map((type) => (
                              <SelectItem key={type} value={type}>
                                {AUTOMATION_ACTION_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Remove action ${index + 1}`}
                          disabled={saving}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              actions: current.actions.filter(
                                (_, entryIndex) => entryIndex !== index,
                              ),
                            }))
                          }
                        >
                          <XIcon aria-hidden="true" />
                        </Button>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {action.type === "CREATE_TASK" ? (
                          <>
                            <Input
                              value={action.params.title ?? ""}
                              placeholder="Task title"
                              aria-label={`Action ${index + 1} task title`}
                              onChange={(event) =>
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    title: event.target.value,
                                  },
                                })
                              }
                              disabled={saving}
                            />
                            <Input
                              value={action.params.dueInDays ?? "2"}
                              type="number"
                              min="0"
                              max="365"
                              aria-label={`Action ${index + 1} due in days`}
                              onChange={(event) =>
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    dueInDays: event.target.value,
                                  },
                                })
                              }
                              disabled={saving}
                            />
                            <Select
                              value={action.params.assignee ?? "record_owner"}
                              onValueChange={(value) => {
                                if (!value) return;
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    assignee: value,
                                  },
                                });
                              }}
                            >
                              <SelectTrigger
                                className="w-full"
                                aria-label={`Action ${index + 1} assignee`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="record_owner">
                                  Record owner
                                </SelectItem>
                                <SelectItem value="actor">
                                  Person who triggered it
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={action.params.priority ?? "MEDIUM"}
                              onValueChange={(value) => {
                                if (!value) return;
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    priority: value,
                                  },
                                });
                              }}
                            >
                              <SelectTrigger
                                className="w-full"
                                aria-label={`Action ${index + 1} priority`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["LOW", "MEDIUM", "HIGH", "URGENT"].map(
                                  (priority) => (
                                    <SelectItem key={priority} value={priority}>
                                      {humanise(priority)}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </>
                        ) : null}

                        {action.type === "ASSIGN_LEAD_OWNER" ? (
                          <Select
                            value={action.params.ownerId ?? ""}
                            onValueChange={(value) => {
                              updateAction(index, {
                                ...action,
                                params: {
                                  ...action.params,
                                  ownerId: value ?? "",
                                },
                              });
                            }}
                          >
                            <SelectTrigger
                              className="w-full"
                              aria-label={`Action ${index + 1} owner`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.value} value={member.value}>
                                  {member.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}

                        {action.type === "UPDATE_LEAD_STATUS" ? (
                          <Select
                            value={action.params.status ?? "CONTACTED"}
                            onValueChange={(value) => {
                              if (!value) return;
                              updateAction(index, {
                                ...action,
                                params: {
                                  ...action.params,
                                  status: value,
                                },
                              });
                            }}
                          >
                            <SelectTrigger
                              className="w-full"
                              aria-label={`Action ${index + 1} lead status`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["CONTACTED", "QUALIFIED", "UNQUALIFIED"].map(
                                (status) => (
                                  <SelectItem key={status} value={status}>
                                    {humanise(status)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        ) : null}

                        {action.type === "CREATE_NOTIFICATION" ? (
                          <>
                            <Input
                              value={action.params.title ?? ""}
                              placeholder="Notification title"
                              aria-label={`Action ${index + 1} notification title`}
                              onChange={(event) =>
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    title: event.target.value,
                                  },
                                })
                              }
                              disabled={saving}
                            />
                            <Select
                              value={action.params.audience ?? "record_owner"}
                              onValueChange={(value) => {
                                if (!value) return;
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    audience: value,
                                  },
                                });
                              }}
                            >
                              <SelectTrigger
                                className="w-full"
                                aria-label={`Action ${index + 1} notification audience`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="record_owner">
                                  Record owner
                                </SelectItem>
                                <SelectItem value="actor">
                                  Person who triggered it
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              className="sm:col-span-2"
                              rows={2}
                              value={action.params.body ?? ""}
                              placeholder="Notification body (optional)"
                              aria-label={`Action ${index + 1} notification body`}
                              onChange={(event) =>
                                updateAction(index, {
                                  ...action,
                                  params: {
                                    ...action.params,
                                    body: event.target.value,
                                  },
                                })
                              }
                              disabled={saving}
                            />
                          </>
                        ) : null}

                        {action.type === "SET_OPPORTUNITY_NEXT_STEP" ? (
                          <Input
                            className="sm:col-span-2"
                            value={action.params.nextStep ?? ""}
                            placeholder="Next step text"
                            aria-label={`Action ${index + 1} next step`}
                            onChange={(event) =>
                              updateAction(index, {
                                ...action,
                                params: {
                                  ...action.params,
                                  nextStep: event.target.value,
                                },
                              })
                            }
                            disabled={saving}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Field orientation="horizontal">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isActive: checked === true,
                    }))
                  }
                  disabled={saving}
                  aria-label="Activate this workflow"
                />
                <FieldLabel htmlFor="automation-active">
                  Activate immediately
                </FieldLabel>
                <FieldDescription>
                  Active workflows respond to new events in this workspace.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                {saving ? "Saving" : "Save workflow"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(runWorkflow)}
        onOpenChange={(open) => {
          if (!open) {
            setRunWorkflow(null);
            setRunRecordId("");
            setRunError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test run</DialogTitle>
            <DialogDescription>
              {runWorkflow
                ? runnableType
                  ? `Run "${runWorkflow.name}" against one ${runnableType}. The same validation, idempotency and action safeguards apply.`
                  : "Task-overdue workflows are evaluated by the due-check sweep and cannot be run manually."
                : null}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={runManual} className="flex flex-col gap-4">
            {runError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {runError}
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="run-record-id">
                {runnableType === "lead"
                  ? "Lead identifier"
                  : "Opportunity identifier"}
              </FieldLabel>
              <Input
                id="run-record-id"
                value={runRecordId}
                placeholder="Record id"
                onChange={(event) => setRunRecordId(event.target.value)}
                disabled={running || !runnableType}
              />
              <FieldDescription>
                Copy the identifier from the record URL. The API verifies it
                belongs to this workspace.
              </FieldDescription>
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRunWorkflow(null)}
                disabled={running}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={running || !runnableType}>
                {running ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : null}
                {running ? "Running" : "Run workflow"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
