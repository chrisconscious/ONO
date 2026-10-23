import { Document } from './types';

export const stage16Doc1: Document = {
  id: 'data-governance-framework',
  number: 1,
  title: 'Data Governance Framework',
  shortTitle: 'Governance Framework',
  description: 'Comprehensive data governance framework with 16 principles, roles, processes, and metrics for responsible data management.',
  status: 'Recorded',
  stage: 16,
  sections: [
    {
      id: '16.1.1',
      title: '1. Governance Principles',
      content: `**16 Core Principles:**
1. Purpose limitation - Data used only for stated purposes
2. Data minimization - Collect only what is necessary
3. Lawful processing - Establish legal basis for all processing
4. Transparency - Clear communication with data subjects
5. Accuracy - Maintain accurate and up-to-date data
6. Confidentiality - Protect data according to classification
7. Integrity - Ensure data is not improperly altered
8. Availability - Ensure data is accessible when needed
9. Accountability - Document and audit all data processing
10. Least privilege - Minimum necessary access
11. Retention limitation - Delete data when no longer needed
12. Secure deletion - Ensure data cannot be recovered
13. Data portability - Support data export where required
14. Tenant separation - Strict isolation between organizations
15. Responsible secondary use - Explicit approval for new uses
16. Human oversight - Human review of consequential AI decisions

**Implementation:**
- Each principle has detailed implementation requirements
- Approval processes for new data uses
- Regular review and audit procedures
- Metrics for measuring compliance`
    }
  ]
};

export const stage16Docs: Document[] = [
  stage16Doc1
];
