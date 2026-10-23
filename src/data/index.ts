import { Document, Stage } from './types';
import { doc1, doc2, doc3, doc4 } from './documents-1';
import { doc5, doc6, doc7, doc8 } from './documents-2';
import { doc9, doc10, doc11, doc12, doc13 } from './documents-3';
import { archDoc1, archDoc2, archDoc3 } from './stage2-docs-1';
import { archDoc4, archDoc5, archDoc6, archDoc7, archDoc8 } from './stage2-docs-2';
import { archDoc9, archDoc10, archDoc11, archDoc12, archDoc13 } from './stage2-docs-3';
import { stage3Doc1, stage3Doc2 } from './stage3-docs-1';
import { stage3Doc3, stage3Doc4 } from './stage3-docs-2';
import { stage3Doc5, stage3Doc6 } from './stage3-docs-3';
import { stage3Doc7, stage3Doc8 } from './stage3-docs-4';
import { stage3Doc9, stage3Doc10, stage3Doc11, stage3Doc12 } from './stage3-docs-5';
import { stage4Doc1, stage4Doc2 } from './stage4-docs-1';
import { stage4Doc3, stage4Doc4, stage4Doc5 } from './stage4-docs-2';
import { stage4Doc6, stage4Doc7, stage4Doc8 } from './stage4-docs-3';
import { stage4Doc9, stage4Doc10, stage4Doc11, stage4Doc12 } from './stage4-docs-4';
import { stage4Doc13, stage4Doc14 } from './stage4-docs-5';
import { stage5Doc1 } from './stage5-docs-1';
import { stage5Doc2, stage5Doc3 } from './stage5-docs-2';
import { stage5Doc4, stage5Doc5 } from './stage5-docs-3';
import { stage5Doc6, stage5Doc7 } from './stage5-docs-4';
import { stage6Doc1 } from './stage6-doc1-workflow-catalog';
import { stage6Doc2 } from './stage6-doc2-business-rules';
import { stage6Doc3 } from './stage6-doc3-cross-department';
import { stage6Doc4 } from './stage6-doc4-approval-framework';
import { stage6Doc5, stage6Doc6 } from './stage6-doc5-automation-kpi';
import { stage6Doc7, stage6Doc8, stage6Doc9 } from './stage6-docs-remaining';
import { stage7Doc13, stage7Doc14 } from './stage7-docs-final';
import { 
  stage8Doc1, stage8Doc2, stage8Doc3, stage8Doc4, stage8Doc5,
  stage8Doc6, stage8Doc7, stage8Doc8, stage8Doc9, stage8Doc10, stage8Doc11
} from './stage8-docs';

import { stage9Docs } from './stage9-docs';
import { stage11Docs } from './stage11-docs';
import { stage12Doc1 } from './stage12-doc1';
import { stage12Doc2 } from './stage12-doc2';
import { stage12Doc3 } from './stage12-doc3';
import { stage12Doc4, stage12Doc5, stage12Doc6, stage12Doc7 } from './stage12-doc4-7';
import { stage12Doc8, stage12Doc9, stage12Doc10, stage12Doc11, stage12Doc12 } from './stage12-doc8-12';
import { stage13Docs } from './stage13-docs';
import { stage14Docs } from './stage14-docs';
import { stage15Docs } from './stage15-docs';
import { stage15DocsExtended } from './stage15-docs-extended';
import { stage15DocsFinal } from './stage15-docs-final';
import { stage16Docs } from './stage16-docs';

// Stage 1 documents
const stage1Docs: Document[] = [
  { ...doc1, stage: 1 },
  { ...doc2, stage: 1 },
  { ...doc3, stage: 1 },
  { ...doc4, stage: 1 },
  { ...doc5, stage: 1 },
  { ...doc6, stage: 1 },
  { ...doc7, stage: 1 },
  { ...doc8, stage: 1 },
  { ...doc9, stage: 1 },
  { ...doc10, stage: 1 },
  { ...doc11, stage: 1 },
  { ...doc12, stage: 1 },
  { ...doc13, stage: 1 },
];

// Stage 2 documents
const stage2Docs: Document[] = [
  archDoc1, archDoc2, archDoc3, archDoc4, archDoc5,
  archDoc6, archDoc7, archDoc8, archDoc9, archDoc10,
  archDoc11, archDoc12, archDoc13
];

// Stage 3 documents
const stage3Docs: Document[] = [
  stage3Doc1, stage3Doc2, stage3Doc3, stage3Doc4, stage3Doc5,
  stage3Doc6, stage3Doc7, stage3Doc8, stage3Doc9, stage3Doc10,
  stage3Doc11, stage3Doc12
];

// Stage 4 documents
const stage4Docs: Document[] = [
  stage4Doc1, stage4Doc2, stage4Doc3, stage4Doc4, stage4Doc5,
  stage4Doc6, stage4Doc7, stage4Doc8, stage4Doc9, stage4Doc10,
  stage4Doc11, stage4Doc12, stage4Doc13, stage4Doc14
];

// Stage 5 documents
const stage5Docs: Document[] = [
  stage5Doc1, stage5Doc2, stage5Doc3, stage5Doc4, stage5Doc5,
  stage5Doc6, stage5Doc7
];

// Stage 6 documents
const stage6Docs: Document[] = [
  stage6Doc1, stage6Doc2, stage6Doc3, stage6Doc4, stage6Doc5,
  stage6Doc6, stage6Doc7, stage6Doc8, stage6Doc9
];

// Stage 7 documents
const stage7Docs: Document[] = [
  stage7Doc13, stage7Doc14
];

// Stage 8 documents
const stage8Docs: Document[] = [
  stage8Doc1, stage8Doc2, stage8Doc3, stage8Doc4, stage8Doc5,
  stage8Doc6, stage8Doc7, stage8Doc8, stage8Doc9, stage8Doc10, stage8Doc11
];

// Stage 9 documents
const stage9DocsArray: Document[] = stage9Docs;

// Stage 11 documents
const stage11DocsArray: Document[] = stage11Docs;

// Stage 12 documents
const stage12Docs: Document[] = [
  stage12Doc1,
  stage12Doc2,
  stage12Doc3,
  stage12Doc4,
  stage12Doc5,
  stage12Doc6,
  stage12Doc7,
  stage12Doc8,
  stage12Doc9,
  stage12Doc10,
  stage12Doc11,
  stage12Doc12
];

// Stage 13 documents
const stage13DocsArray: Document[] = stage13Docs;

// Stage 14 documents
const stage14DocsArray: Document[] = stage14Docs;

// Stage 15 documents
const stage15DocsArray: Document[] = [...stage15Docs, ...stage15DocsExtended, ...stage15DocsFinal];

// Stage 16 documents
const stage16DocsArray: Document[] = stage16Docs;

// All documents combined
export const allDocuments: Document[] = [
  ...stage1Docs,
  ...stage2Docs,
  ...stage3Docs,
  ...stage4Docs,
  ...stage5Docs,
  ...stage6Docs,
  ...stage7Docs,
  ...stage8Docs,
  ...stage9DocsArray,
  ...stage11DocsArray,
  ...stage12Docs,
  ...stage13DocsArray,
  ...stage14DocsArray,
  ...stage15DocsArray,
  ...stage16DocsArray
];

// Stages
export const stages: Stage[] = [
  {
    number: 1,
    title: 'Master Project Requirements, System Vision and Development Control',
    shortTitle: 'Requirements & Vision',
    description: 'Product specification, module inventory, industry adaptation, roles, workflows, architecture plan, database plan, AI/ML spec, UI/UX, security, roadmap, open decisions and project status.',
    status: 'Completed',
    documents: stage1Docs,
  },
  {
    number: 2,
    title: 'System Architecture and Technical Contracts',
    shortTitle: 'Architecture & Contracts',
    description: 'System architecture, ADRs, technology evaluation, module dependencies, API/event contracts, data architecture, tenancy/authorization, industry configuration, AI/ML architecture, reliability, implementation sequence, updated decisions and status.',
    status: 'Completed',
    documents: stage2Docs,
  },
  {
    number: 3,
    title: 'Repository and Development Infrastructure Planning',
    shortTitle: 'Dev Infrastructure',
    description: 'Repository structure, development environment, engineering standards, testing strategy, CI/CD pipeline, database migration workflow, security controls, AI/ML DevOps, observability, and implementation sequence.',
    status: 'Completed',
    documents: stage3Docs,
  },
  {
    number: 4,
    title: 'Complete UI/UX Design and Screen Specification',
    shortTitle: 'UI/UX Design',
    description: 'Design system, screen inventory, navigation, role-specific dashboards, authentication UX, onboarding, business intelligence UX, industry-adaptive UX, interactions, forms/tables, accessibility, and acceptance criteria.',
    status: 'Completed',
    documents: stage4Docs,
  },
  {
    number: 5,
    title: 'Data Domain, Database Schema, and Business Entity Design',
    shortTitle: 'Data Model',
    description: 'Data domain catalog, business entity specifications, logical data model, entity relationships, tenant ownership matrix, data integrity rules, and business invariants.',
    status: 'Completed',
    documents: stage5Docs,
  },
  {
    number: 6,
    title: 'Core Business Workflows and Business Rules Specification',
    shortTitle: 'Workflows & Rules',
    description: 'Comprehensive business workflow specifications, business rules catalog, cross-department workflows, approval framework, automation specification, KPI catalog, and industry workflow configuration.',
    status: 'Completed',
    documents: stage6Docs,
  },
  {
    number: 7,
    title: 'Security, Identity, Permissions, Privacy, and Audit Design',
    shortTitle: 'Security & Privacy',
    description: 'Comprehensive security specifications including threat modeling, authentication, authorization, tenant isolation, data protection, audit logging, AI security, incident response, and security testing.',
    status: 'Completed',
    documents: stage7Docs,
  },
  {
    number: 8,
    title: 'Business Intelligence, Analytics, KPI Definitions, and Data Quality Specification',
    shortTitle: 'BI & Analytics',
    description: 'Business intelligence architecture, metric registry, KPI formulas, data quality, lineage, dashboards, alerts, forecasting, AI insights, analytics security, and acceptance criteria.',
    status: 'Completed',
    documents: stage8Docs,
  },
  {
    number: 9,
    title: 'AI/ML, Inference Engine, Decision Intelligence, and Model Governance Specification',
    shortTitle: 'AI/ML & Intelligence',
    description: 'AI/ML inference architecture, task routing, inference engine, ML use cases, model training and evaluation, model lifecycle, decision intelligence, action boundaries, security controls, and acceptance criteria.',
    status: 'Completed',
    documents: stage9DocsArray,
  },
  {
    number: 11,
    title: 'Testing Strategy, Quality Assurance, Performance, Reliability, and Production Readiness',
    shortTitle: 'QA & Testing',
    description: 'Comprehensive testing strategy, requirements traceability, functional testing, security testing, database testing, analytics testing, AI/ML evaluation, integration testing, performance testing, reliability testing, UI/UX testing, test data management, CI/CD gates, and defect management.',
    status: 'Completed',
    documents: stage11DocsArray,
  },
  {
    number: 12,
    title: 'Deployment Architecture, Environments, DevOps, Monitoring, Backup, and Production Operations',
    shortTitle: 'Deployment & Operations',
    description: 'Deployment architecture, environment configuration, CI/CD strategy, infrastructure security, scaling and capacity, monitoring and observability, backup and disaster recovery, database migrations, production operations, incident management, maintenance procedures, and go-live readiness.',
    status: 'Completed',
    documents: stage12Docs,
  },
  {
    number: 13,
    title: 'Product Scope, MVP Boundaries, Feature Prioritization, and Phased Delivery',
    shortTitle: 'Product Strategy',
    description: 'Product capability catalog, MVP scope and acceptance criteria, feature prioritization matrix, phased delivery roadmap, module dependencies, success metrics, scope governance, industry expansion strategy, and delivery risk assessment.',
    status: 'Completed',
    documents: stage13DocsArray,
  },
  {
    number: 14,
    title: 'User Onboarding, Organization Setup, Tenant Provisioning, Subscriptions, Billing, and SaaS Administration',
    shortTitle: 'SaaS Operations',
    description: 'Customer lifecycle and onboarding, organization setup and industry configuration, tenant provisioning and lifecycle, user invitation and membership management, subscription plans and entitlement model.',
    status: 'Completed',
    documents: stage14DocsArray,
  },
  {
    number: 15,
    title: 'Design-to-Development Handoff, Complete Screen Specifications, Component Inventory, and Interaction Contracts',
    shortTitle: 'Design Handoff',
    description: 'Complete screen inventory and route map, screen-by-screen implementation specifications, design system and visual tokens, reusable component inventory, UI interaction contracts, navigation and routing, forms and tables patterns, loading and error states, role-aware UI, BI/AI interface, accessibility criteria, handoff process, and AI implementation governance.',
    status: 'Completed',
    documents: stage15DocsArray,
  },
  {
    number: 16,
    title: 'Data Governance, Legal and Regulatory Review, Data Retention, Consent, and Future Data Marketplace Controls',
    shortTitle: 'Data Governance',
    description: 'Comprehensive data governance framework with 16 principles, roles and responsibilities, governance processes, data classification, legal compliance (Tanzania PDPA), privacy protection, AI data governance, marketplace governance, data lifecycle management, and compliance metrics.',
    status: 'Completed',
    documents: stage16DocsArray,
  },
];

export { allDocuments as documents };
export type { Document, DocSection, Requirement, Stage } from './types';
