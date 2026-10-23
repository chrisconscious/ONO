# Phase Build Prompts Directory

This directory contains standalone build prompts for each implementation phase.

Each prompt is designed to be given to an AI coding assistant to implement a specific phase of the ClickIT platform.

## Phase Prompts

- `PHASE_0_READINESS.md` - Readiness and authorization
- `PHASE_1_FOUNDATION.md` - Repository foundation and application shell
- `PHASE_2_IDENTITY.md` - Identity, organizations, tenant isolation, and authorization
- `PHASE_3_DOMAIN.md` - Core domain foundation and auditability
- `PHASE_4_ORGANIZATION.md` - Organization setup and industry configuration
- `PHASE_5_CRM.md` - CRM and customer workflows
- `PHASE_6_SALES_INVENTORY.md` - Sales, products, inventory, and purchasing
- `PHASE_7_FINANCE_TASKS.md` - Finance, invoicing, and task management
- `PHASE_8_ANALYTICS.md` - Business intelligence and reporting foundations
- `PHASE_9_HARDENING.md` - Production hardening and release preparation
- `PHASE_10_PILOT.md` - Controlled pilot and measured improvement

## How to Use These Prompts

1. **Review the prompt** for the phase you want to implement
2. **Verify prerequisites** are complete (previous phases approved)
3. **Give the prompt** to your AI coding assistant
4. **Review the implementation** against the acceptance criteria
5. **Pass through all 8 acceptance gates** before proceeding
6. **Get owner approval** before moving to the next phase

## Important Notes

- Each prompt is self-contained and references authoritative documents
- Prompts include explicit exclusions to prevent scope creep
- Prompts require inspection of existing code before changes
- Prompts mandate comprehensive testing and documentation
- Prompts include stop conditions to prevent unauthorized work

## Phase Dependencies

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10
```

Each phase depends on the successful completion of all previous phases.
