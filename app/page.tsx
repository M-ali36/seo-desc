'use client';

import { useState, FormEvent } from 'react';

export default function Home() {
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputType, value }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResult(data.description);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Powered by Gemini 2.5 Flash
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI SEO Description Generator</h1>
          <p className="text-sm text-slate-400 mt-2">
            Turn any webpage URL or raw text into an optimized, high-CTR meta description instantly.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setInputType('text'); setValue(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              inputType === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Raw Text
          </button>
          <button
            type="button"
            onClick={() => { setInputType('url'); setValue(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              inputType === 'url' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Webpage URL
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {inputType === 'text' ? 'Paste your page content or article text:' : 'Enter webpage URL:'}
            </label>
            {inputType === 'text' ? (
              <textarea
                rows={5}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Paste article, product details, or summary here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                required
              />
            ) : (
              <input
                type="url"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="https://example.com/blog/post"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating SEO Meta...
              </>
            ) : (
              'Generate SEO Description'
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Result Container */}
        {result && (
          <div className="mt-6 p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Optimized Meta Description
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                result.length >= 130 && result.length <= 160 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {result.length} / 160 chars
              </span>
            </div>
            
            <p className="text-slate-200 text-sm leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              {result}
            </p>

            <button
              onClick={handleCopy}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}