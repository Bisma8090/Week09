'use client';
import { useState } from 'react';
import { askQuestion, AskResponse } from '../lib/api';
import TracePanel from './components/TracePanel';
import AnswerPanel from './components/AnswerPanel';
import UploadModal from './components/UploadModal';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await askQuestion(question);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to reach backend. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">R</div>
          <h1 className="text-lg font-semibold tracking-tight">Research Assistant</h1>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">AI Workflow</span>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          + Upload Doc
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm mb-3">Ask a research question and watch the AI team work through it step by step.</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="e.g. Compare SQL vs NoSQL databases"
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {/* Sample questions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['Compare SQL vs NoSQL databases', 'REST API vs GraphQL', 'WebSockets vs HTTP Polling', 'SSR vs CSR in Next.js'].map(q => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="text-xs text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex gap-2">
              {['Question Splitter', 'Doc Finder', 'Ranker', 'Summarizer', 'Cross-Checker', 'Answer Maker'].map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full bg-indigo-600 animate-pulse flex items-center justify-center text-xs font-bold text-white"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:block">{step.split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm">Running workflow pipeline...</p>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnswerPanel answer={result.finalAnswer} queryId={result.id} />
            <TracePanel trace={result.trace} />
          </div>
        )}
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
