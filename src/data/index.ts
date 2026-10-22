import { Document } from './types';
import { doc1, doc2, doc3, doc4 } from './documents-1';
import { doc5, doc6, doc7, doc8 } from './documents-2';
import { doc9, doc10, doc11, doc12, doc13 } from './documents-3';

export const allDocuments: Document[] = [
  doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9, doc10, doc11, doc12, doc13
];

export { allDocuments as documents };
export type { Document, DocSection, Requirement } from './types';
