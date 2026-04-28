'use client';
import { useState } from 'react';
import { uploadDocument } from '../../lib/api';

interface Props { onClose: () => void; }

const TOPICS = ['SQL vs NoSQL', 'REST vs GraphQL', 'Monolithic vs Microservices', 'SSR vs CSR', 'WebSockets vs HTTP Polling'];

export default function UploadModal({ onClose }: Props) {
  const [form, setForm] = useState({ title: '', topic: TOPICS[0], content: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setStatus('loading');
    try {
      await uploadDocument(form);
      setStatus('success');
      setTimeout(onClose, 1200);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Document title"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-800"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Topic</label>
            <select
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-800"
            >
              {TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Content</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Paste your document content here (200-500 words recommended)..."
              rows={6}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none text-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {status === 'loading' ? 'Uploading...' : status === 'success' ? '✓ Uploaded!' : 'Upload'}
          </button>
          {status === 'error' && <p className="text-red-500 text-xs text-center">Upload failed. Check backend connection.</p>}
        </form>
      </div>
    </div>
  );
}
