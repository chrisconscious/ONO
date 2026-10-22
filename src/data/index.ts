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

// All documents combined
export const allDocuments: Document[] = [...stage1Docs, ...stage2Docs, ...stage3Docs, ...stage4Docs, ...stage5Docs];

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
];

export { allDocuments as documents };
export type { Document, DocSection, Requirement, Stage } from './types';
