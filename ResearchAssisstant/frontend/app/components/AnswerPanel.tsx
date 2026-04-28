'use client';

interface Props {
  answer: string;
  queryId: string;
}

export default function AnswerPanel({ answer, queryId }: Props) {
  const lines = answer.split('\n');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Final Answer</h2>
        <span className="text-xs text-gray-400 font-mono">id: {queryId.slice(-8)}</span>
      </div>
      <div className="prose prose-sm max-w-none overflow-y-auto max-h-[60vh]">
        {lines.map((line, i) => {
          if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-2">{line.slice(3)}</h2>;
          if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-indigo-600 mt-3 mb-1">{line.slice(4)}</h3>;
          if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-800">{line.slice(2, -2)}</p>;
          if (line.startsWith('- ')) return <li key={i} className="text-gray-600 ml-4 list-disc">{line.slice(2)}</li>;
          if (line.startsWith('⚠️')) return <p key={i} className="text-yellow-600 font-medium">{line}</p>;
          if (line.trim() === '') return <div key={i} className="h-2" />;
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i} className="text-gray-600 text-sm leading-relaxed">
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={j} className="text-gray-800">{part.slice(2, -2)}</strong>
                  : part
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
