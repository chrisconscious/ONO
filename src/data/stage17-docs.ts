import { Document } from './types';

export const stage17Doc1: Document = {
  id: 'documentation-audit-report',
  number: 1,
  title: 'Stage 17 Documentation Audit Report',
  shortTitle: 'Audit Report',
  description: 'Comprehensive audit of all 156 documents across 16 stages, verifying completeness, consistency, and implementation readiness.',
  status: 'Recorded',
  stage: 17,
  sections: [
    {
      id: '17.1.1',
      title: 'Audit Summary',
      content: `**Audit Scope:** 156 documents across 16 stages

**Key Findings:**
- ✅ Documentation Completeness: 100% (16 of 16 stages documented)
- ✅ Consistency: 98% (no conflicts identified)
- ✅ Traceability: 100% (25 of 25 requirements traced)
- ⚠️ Unresolved Decisions: 12 decisions require approval
- ⚠️ Legal Review Required: Tanzania PDPA compliance needs qualified counsel
- ✅ Security Architecture: Comprehensive and consistent
- ✅ AI Governance: Clear boundaries and oversight
- ✅ Data Governance: Framework established

**Overall Assessment:** Conditionally Ready for Limited First Phase

**Critical Actions Required:**
1. Engage legal counsel for Tanzania PDPA compliance
2. Resolve 4 critical decisions (auth provider, cloud provider, payment provider, PDPA registration)
3. Complete penetration testing for tenant isolation
4. Establish monitoring and alerting infrastructure`
    }
  ]
};

export const stage17Doc2: Document = {
  id: 'requirements-traceability-matrix',
  number: 2,
  title: 'Master Requirements Traceability Matrix',
  shortTitle: 'Traceability Matrix',
  description: 'Complete traceability from 25 original requirements to supporting specifications across all stages.',
  status: 'Recorded',
  stage: 17,
  sections: [
    {
      id: '17.2.1',
      title: 'Traceability Coverage',
      content: `**Total Requirements:** 25 (15 functional + 10 non-functional)
**Traced to Specifications:** 25 of 25 (100%)

**Implementation Status:**
- ✅ Verified (MVP): 10 requirements (40%)
- ✅ Verified (Deferred): 13 requirements (52%)
- ⚠️ Requires Legal Review: 1 requirement (4%)
- ⚠️ Requires Decision: 1 requirement (4%)

**Priority Distribution:**
- Critical: 4 requirements (16%)
- High: 10 requirements (40%)
- Medium: 9 requirements (36%)
- Low: 2 requirements (8%)

**Key Traceability Findings:**
- All requirements have corresponding implementation specifications
- All specifications trace back to original requirements
- No orphaned requirements or specifications
- No duplicate requirements
- No contradictory requirements

**Dependencies Map:**
- Stage 1 (Requirements): No dependencies (foundational)
- Stage 2 (Architecture): Depends on Stage 1
- Stage 3 (Infrastructure): Depends on Stage 2
- Stage 4 (UI/UX): Depends on Stage 1, 2
- Stage 5 (Data Model): Depends on Stage 1, 2
- Stage 6 (Workflows): Depends on Stage 5
- Stage 7 (Security): Depends on Stage 2, 5
- Stage 8 (BI/Analytics): Depends on Stage 5, 6, 7
- Stage 9 (AI/ML): Depends on Stage 7, 8
- Stage 10 (Integration): Depends on Stage 2, 7
- Stage 11 (Testing): Depends on all previous stages
- Stage 12 (Deployment): Depends on Stage 2, 3, 11
- Stage 13 (Product Strategy): Depends on all previous stages
- Stage 14 (SaaS Operations): Depends on Stage 5, 7, 13
- Stage 15 (Design Handoff): Depends on Stage 4, 13
- Stage 16 (Data Governance): Depends on Stage 5, 7, 9`
    }
  ]
};

export const stage17Docs: Document[] = [
  stage17Doc1,
  stage17Doc2
];
