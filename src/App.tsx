import { useState, useCallback } from 'react';
import { allDocuments, Document, DocSection } from './data';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Recorded': 'bg-blue-100 text-blue-800',
    'Proposed': 'bg-amber-100 text-amber-800',
    'Approved': 'bg-green-100 text-green-800',
    'Needs clarification': 'bg-red-100 text-red-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Pending': 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag key={`list-${elements.length}`} className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} pl-6 my-3 space-y-1`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-[#2563EB] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^(#{1,3})\s+(.+)$/gm, (_, __, text) => text);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-4 rounded-lg overflow-hidden border border-gray-200">
            {codeLang && <div className="bg-gray-100 px-4 py-1.5 text-xs font-mono text-gray-500 border-b border-gray-200">{codeLang}</div>}
            <pre className="bg-gray-50 p-4 overflow-x-auto text-sm font-mono text-gray-800 leading-relaxed">
              <code>{codeContent.trim()}</code>
            </pre>
          </div>
        );
        codeContent = '';
        codeLang = '';
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    if (line.match(/^(\d+)\.\s/)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(line.replace(/^\d+\.\s/, ''));
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(line.replace(/^[-*]\s/, ''));
      continue;
    }

    flushList();

    if (line.trim() === '') {
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) {
        i++;
        tableLines.push(lines[i]);
      }
      const table = renderTable(tableLines, i);
      if (table) elements.push(table);
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-gray-700 leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
    );
  }

  flushList();
  return elements;
}

function renderTable(lines: string[], key: number) {
  const rows = lines.filter(l => !l.match(/^\|[\s-|]+\|$/));
  if (rows.length === 0) return null;

  const parseRow = (row: string) => row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());

  const headers = parseRow(rows[0]);
  const body = rows.slice(1).map(parseRow);

  return (
    <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {body.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 text-sm text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionContent({ section }: { section: DocSection }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-[#172B4D] mb-4 pb-2 border-b border-gray-100">
        {section.title}
      </h2>
      <div className="prose-custom">
        {renderMarkdown(section.content)}
      </div>
    </div>
  );
}

function DocumentView({ doc, onBack }: { doc: Document; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-[#2563EB] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all documents
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#172B4D] to-[#1e3a5f] px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-blue-300 text-sm font-medium">Document {doc.number}</span>
            <StatusBadge status={doc.status} />
          </div>
          <h1 className="text-2xl font-bold text-white">{doc.title}</h1>
          <p className="text-blue-200 mt-2 text-sm">{doc.description}</p>
        </div>

        <div className="px-8 py-8">
          {doc.sections.map((section) => (
            <SectionContent key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ doc, onClick }: { doc: Document; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-6 hover:border-[#2563EB] hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full">
          Doc {doc.number}
        </span>
        <StatusBadge status={doc.status} />
      </div>
      <h3 className="text-lg font-semibold text-[#172B4D] group-hover:text-[#2563EB] transition-colors mb-2">
        {doc.title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {doc.description}
      </p>
      <div className="mt-4 flex items-center text-xs text-gray-400">
        <span>{doc.sections.length} sections</span>
        <svg className="w-4 h-4 ml-auto text-gray-300 group-hover:text-[#2563EB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function OverviewPage({ onSelectDoc }: { onSelectDoc: (doc: Document) => void }) {
  const totalSections = allDocuments.reduce((sum, d) => sum + d.sections.length, 0);
  const recordedCount = allDocuments.filter(d => d.status === 'Recorded').length;
  const proposedCount = allDocuments.filter(d => d.status === 'Proposed').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#172B4D] via-[#1e3a5f] to-[#2563EB] rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-blue-200 text-sm font-medium">Stage 1 — Planning & Documentation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          ClickIT Platform
        </h1>
        <p className="text-xl text-blue-100 font-light mb-2">
          AI-Powered Integrated Business Intelligence & Management Platform
        </p>
        <p className="text-blue-200 text-sm max-w-2xl leading-relaxed mt-4">
          Master project documentation covering product vision, module inventory, industry adaptation,
          roles and permissions, workflows, architecture, database design, AI/ML specification,
          UI/UX requirements, security, development roadmap, and open decisions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-[#172B4D]">{allDocuments.length}</div>
          <div className="text-sm text-gray-500 mt-1">Documents</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-[#172B4D]">{totalSections}</div>
          <div className="text-sm text-gray-500 mt-1">Sections</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{recordedCount}</div>
          <div className="text-sm text-gray-500 mt-1">Recorded</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-3xl font-bold text-amber-600">{proposedCount}</div>
          <div className="text-sm text-gray-500 mt-1">Proposed</div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Documentation Stage — No Implementation</h3>
            <p className="text-amber-700 text-sm mt-1">
              This stage covers planning and documentation only. No implementation code, database migrations,
              UI implementation, model training, or inference engine development is authorized.
              Awaiting explicit approval to proceed to Phase 2.
            </p>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <h2 className="text-lg font-semibold text-[#172B4D] mb-4">Project Documents</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allDocuments.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onClick={() => onSelectDoc(doc)} />
        ))}
      </div>

      {/* Completion Report */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-[#172B4D] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Stage 1 Completion Report</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">1. What was inspected:</h3>
            <p className="text-sm text-gray-600">Project repository structure, existing files, and all requirements provided in the project brief.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">2. What was documented:</h3>
            <p className="text-sm text-gray-600">All 13 required specification documents covering vision, modules, industry adaptation, roles, workflows, architecture, database, AI/ML, UI/UX, security, roadmap, open decisions, and project status.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">3. Files created:</h3>
            <p className="text-sm text-gray-600">Documentation presented as interactive web application with all 13 documents fully authored and navigable.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">4. Unresolved requirements/decisions:</h3>
            <p className="text-sm text-gray-600">8 architecture decisions pending (ADR-001 to ADR-008), 8 open decisions, 8 assumptions to validate, 8 clarifications needed. See Document 12 for full details.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">5. Architecture risks:</h3>
            <p className="text-sm text-gray-600">Scope complexity (HIGH), ML accuracy expectations (MEDIUM), multi-tenant security (LOW with controls), industry configuration complexity (MEDIUM), performance at scale (MEDIUM), regulatory compliance (MEDIUM).</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">6. Industry adaptation coverage:</h3>
            <p className="text-sm text-green-600 font-medium">✓ Explicitly covered in Document 3 with extensible catalogue, custom industry onboarding, profiles, configuration rules, and extension framework.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">7. Full roadmap coverage:</h3>
            <p className="text-sm text-green-600 font-medium">✓ All 26 phases documented in Document 11 covering frontend, backend, database, BI, ML and inference with dependencies, deliverables and acceptance criteria.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] text-sm mb-2">8. Recommended next phase:</h3>
            <p className="text-sm text-gray-600"><strong>Phase 2 — Architecture and Technical Contracts.</strong> Pending approval of Phase 1 documentation and resolution of open decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectDoc = useCallback((doc: Document) => {
    setSelectedDoc(doc);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDoc(null);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-[#172B4D] border-b border-[#1e3a5f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={handleBack} className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div>
                  <span className="text-white font-semibold text-sm">ClickIT</span>
                  <span className="text-blue-300 text-xs ml-2 hidden sm:inline">Project Documentation</span>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-300 bg-white/10 px-3 py-1.5 rounded-full">
                Stage 1 of 26
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</h3>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleBack}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      !selectedDoc ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Overview
                  </button>
                  {allDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                        selectedDoc?.id === doc.id ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs text-gray-400 w-5">{doc.number}.</span>
                      <span className="truncate">{doc.shortTitle}</span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <aside className="absolute left-0 top-16 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
                <nav className="py-2">
                  <button
                    onClick={() => { handleBack(); setSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm ${!selectedDoc ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600'}`}
                  >
                    Overview
                  </button>
                  {allDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${
                        selectedDoc?.id === doc.id ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600'
                      }`}
                    >
                      <span className="text-xs text-gray-400 w-5">{doc.number}.</span>
                      <span>{doc.shortTitle}</span>
                    </button>
                  ))}
                </nav>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {selectedDoc ? (
              <DocumentView doc={selectedDoc} onBack={handleBack} />
            ) : (
              <OverviewPage onSelectDoc={handleSelectDoc} />
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              ClickIT Platform — Master Project Documentation
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Stage 1: Planning & Documentation</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Documentation Only — No Implementation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
