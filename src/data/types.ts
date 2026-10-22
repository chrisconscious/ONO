export interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocSection[];
}

export interface Document {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  status: 'Recorded' | 'Proposed' | 'Needs clarification' | 'Approved' | 'Updated';
  stage?: number;
  sections: DocSection[];
}

export interface Stage {
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  documents: Document[];
}

export interface Requirement {
  id: string;
  description: string;
  module: string;
  workflow: string;
  roles: string[];
  entities: string[];
  security: string;
  phases: number[];
  acceptance: string;
  status: 'Proposed' | 'Recorded' | 'Needs clarification' | 'Approved' | 'Implemented' | 'Verified';
}
