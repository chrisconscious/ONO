import { useState, useCallback } from 'react';
import { allDocuments, stages, Document, DocSection, Stage } from './data';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Recorded': 'bg-blue-100 text-blue-800',
    'Proposed': 'bg-amber-100 text-amber-800',
    'Approved': 'bg-green-100 text-green-800',
    'Needs clarification': 'bg-red-100 text-red-800',
    'Updated': 'bg-purple-100 text-purple-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Pending': 'bg-gray-100 text-gray-600',
    'Completed': 'bg-green-100 text-green-800',
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
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-[#2563EB] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
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

    if (line.trim() === '') continue;

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
      <div>{renderMarkdown(section.content)}</div>
    </div>
  );
}

function DocumentView({ doc, onBack }: { doc: Document; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-[#2563EB] transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to documents
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#172B4D] to-[#1e3a5f] px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-blue-300 text-sm font-medium">Stage {doc.stage} · Document {doc.number}</span>
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
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#2563EB] hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
          Doc {doc.number}
        </span>
        <StatusBadge status={doc.status} />
      </div>
      <h3 className="text-base font-semibold text-[#172B4D] group-hover:text-[#2563EB] transition-colors mb-1.5">
        {doc.title}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{doc.description}</p>
      <div className="mt-3 flex items-center text-xs text-gray-400">
        <span>{doc.sections.length} sections</span>
        <svg className="w-4 h-4 ml-auto text-gray-300 group-hover:text-[#2563EB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function StageOverview({ stage, onSelectDoc }: { stage: Stage; onSelectDoc: (doc: Document) => void }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${stage.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`}>
          {stage.number}
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">{stage.title}</h2>
          <p className="text-xs text-gray-500">{stage.description}</p>
        </div>
        <StatusBadge status={stage.status} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stage.documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onClick={() => onSelectDoc(doc)} />
        ))}
      </div>
    </div>
  );
}

function OverviewPage({ onSelectDoc }: { onSelectDoc: (doc: Document) => void }) {
  const totalDocs = allDocuments.length;
  const totalSections = allDocuments.reduce((sum, d) => sum + d.sections.length, 0);

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
          <span className="text-blue-200 text-sm font-medium">Planning & Architecture Documentation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">ClickIT Platform</h1>
        <p className="text-xl text-blue-100 font-light mb-2">AI-Powered Integrated Business Intelligence & Management Platform</p>
        <p className="text-blue-200 text-sm max-w-2xl leading-relaxed mt-4">
          Complete project documentation across 6 stages: Stage 1 covers product requirements and vision.
          Stage 2 covers system architecture and technical contracts. Stage 3 covers development infrastructure.
          Stage 4 covers complete UI/UX design. Stage 5 covers data domain and database schema.
          Stage 6 covers core business workflows and business rules specification.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#172B4D]">6</div>
          <div className="text-xs text-gray-500 mt-1">Stages</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#172B4D]">{totalDocs}</div>
          <div className="text-xs text-gray-500 mt-1">Documents</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#172B4D]">{totalSections}</div>
          <div className="text-xs text-gray-500 mt-1">Sections</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">2</div>
          <div className="text-xs text-gray-500 mt-1">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">20</div>
          <div className="text-xs text-gray-500 mt-1">Remaining Phases</div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Documentation Stages Complete — No Implementation Authorized</h3>
            <p className="text-amber-700 text-sm mt-1">
              Stages 1, 2, 3, 4, 5, and 6 are complete. No implementation code, database migrations, UI implementation,
              model training, or inference engine development is authorized. Awaiting explicit approval
              to proceed to Phase 7 (Shared Frontend Components) or Phase 9 (Backend APIs and Business Rules).
            </p>
          </div>
        </div>
      </div>

      {/* Stages */}
      {stages.map((stage) => (
        <StageOverview key={stage.number} stage={stage} onSelectDoc={onSelectDoc} />
      ))}

      {/* Completion Report */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-[#172B4D] px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Stage 6 Completion Report</h2>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">1. What was inspected:</h3>
            <p className="text-gray-600">All 59 documents from Stages 1-5, existing workflow catalog from Stage 1, module dependencies from Stage 2, data model from Stage 5, and UI/UX specifications from Stage 4.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">2. Documents created (Stage 6):</h3>
            <p className="text-gray-600">9 comprehensive documents: Core Business Workflow Catalog, Business Rules Catalog, Cross-Department Workflows, Approval and Delegation Framework, Workflow Automation Specification, Business KPI and Outcome Catalog, Industry Workflow Configuration, Workflow Acceptance Criteria, Updated Project Status.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">3. Key workflow decisions:</h3>
            <p className="text-gray-600">Comprehensive workflow specifications with clear status transitions, business rules, approval requirements, and audit trails. Cross-department workflows defined for lead-to-cash, demand-to-procurement, sale-to-delivery, and more.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">4. Business rules coverage:</h3>
            <p className="text-gray-600">Complete catalog of validation rules, workflow transition rules, authorization rules, financial control rules, and inventory control rules with enforcement mechanisms and exception handling.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">5. Approval framework:</h3>
            <p className="text-gray-600">Configurable approval policies with delegation support, escalation paths, expiration handling, and separation of duties enforcement. Complete audit trail for all approval decisions.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">6. Automation and AI:</h3>
            <p className="text-gray-600">Safe automation framework with risk-based approval levels, exception handling, and AI-assisted decision workflows. Clear distinction between facts, predictions, and recommendations.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">7. KPI framework:</h3>
            <p className="text-gray-600">Comprehensive KPI catalog for financial, sales, marketing, and operational metrics with clear definitions, data sources, calculation methods, and limitations.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">8. Conflicts with Stages 1-5:</h3>
            <p className="text-green-600 font-medium">None found. All workflows are consistent with previous requirements, architecture, data model, and UI/UX specifications.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">9. Recommended next stage:</h3>
            <p className="text-green-600 font-medium">Phase 7 (Shared Frontend Components) or Phase 9 (Backend APIs and Business Rules). Pending approval of all Stage 1-6 documentation and technology decisions.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[#172B4D] mb-1">10. Implementation status:</h3>
            <p className="text-amber-600 font-medium">No implementation files or infrastructure were created or modified. This stage is documentation-only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectDoc = useCallback((doc: Document) => {
    setSelectedDoc(doc);
    setActiveStage(doc.stage ?? null);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDoc(null);
    window.scrollTo(0, 0);
  }, []);

  const handleStageSelect = useCallback((stageNum: number | null) => {
    setActiveStage(stageNum);
    setSelectedDoc(null);
  }, []);

  const currentDocs = activeStage
    ? allDocuments.filter(d => d.stage === activeStage)
    : allDocuments;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-[#172B4D] border-b border-[#1e3a5f] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={() => { handleBack(); setActiveStage(null); }} className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <div>
                  <span className="text-white font-semibold text-sm">ClickIT</span>
                  <span className="text-blue-300 text-xs ml-2 hidden sm:inline">Project Documentation</span>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-300 bg-white/10 px-3 py-1 rounded-full">
                Stages 1-6 of 26
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stage Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <button
              onClick={() => handleStageSelect(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStage === null ? 'bg-[#172B4D] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({allDocuments.length})
            </button>
            {stages.map((stage) => (
              <button
                key={stage.number}
                onClick={() => handleStageSelect(stage.number)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeStage === stage.number ? 'bg-[#172B4D] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className={`w-5 h-5 rounded text-xs flex items-center justify-center ${
                  activeStage === stage.number ? 'bg-white/20' : 'bg-gray-200'
                }`}>{stage.number}</span>
                <span className="hidden sm:inline">{stage.shortTitle}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-32">
              <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden max-h-[calc(100vh-10rem)] overflow-y-auto">
                <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {activeStage ? `Stage ${activeStage} Documents` : 'All Documents'}
                  </h3>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleBack}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      !selectedDoc && !activeStage ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Overview
                  </button>
                  {currentDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-1.5 ${
                        selectedDoc?.id === doc.id ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-400 w-4 text-right">{doc.number}.</span>
                      <span className="truncate">{doc.shortTitle}</span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <aside className="absolute left-0 top-28 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
                <nav className="py-2">
                  <button onClick={() => { handleBack(); setActiveStage(null); setSidebarOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-600">Overview</button>
                  {currentDocs.map((doc) => (
                    <button key={doc.id} onClick={() => { handleSelectDoc(doc); setSidebarOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                        selectedDoc?.id === doc.id ? 'bg-blue-50 text-[#2563EB] font-medium' : 'text-gray-600'
                      }`}>
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
            ) : activeStage ? (
              <div>
                <button onClick={() => handleStageSelect(null)} className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-[#2563EB] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  All stages
                </button>
                <StageOverview stage={stages.find(s => s.number === activeStage)!} onSelectDoc={handleSelectDoc} />
              </div>
            ) : (
              <OverviewPage onSelectDoc={handleSelectDoc} />
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">ClickIT Platform — Master Project Documentation</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Stages 1-6 Complete</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Documentation Only — No Implementation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
