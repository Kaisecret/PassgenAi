import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generatePasswordWithGemini } from '../services/geminiService';
import { GeneratedPassword, AppRoutes, PasswordComplexity } from '../types';
import { MAX_GUEST_ATTEMPTS } from '../constants';
import Button from '../components/Button';
import Input from '../components/Input';

const Generator: React.FC = () => {
  const { hasAttemptsRemaining, incrementGuestUsage, guestUsageCount, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [word, setWord] = useState('');
  const [complexity, setComplexity] = useState<PasswordComplexity>('easy');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedPassword[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    if (!hasAttemptsRemaining) {
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const passwords = await generatePasswordWithGemini(word, complexity);
      setResults(passwords);
      incrementGuestUsage();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const complexityOptions: { id: PasswordComplexity; label: string; desc: string }[] = [
    { id: 'easy', label: 'Easy', desc: 'Easier to type & remember' },
    { id: 'cool', label: 'Cool', desc: 'Stylish & Leetspeak' },
    { id: 'hard', label: 'Hard', desc: 'Secure & Hard to crack' },
  ];

  if (!hasAttemptsRemaining) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Limit Reached</h2>
        <p className="text-slate-400 mb-8">
          You've used all {MAX_GUEST_ATTEMPTS} free guest attempts. Create a free account to generate unlimited passwords.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(AppRoutes.REGISTER)}>Create Free Account</Button>
          <Button variant="ghost" onClick={() => navigate(AppRoutes.LOGIN)}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
          Generate Secure Passwords
        </h1>
        <p className="text-slate-400">
          Enter a memorable word or phrase, and AI will transform it based on your style.
        </p>
        {!isAuthenticated && (
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
            Guest Attempts: {guestUsageCount} / {MAX_GUEST_ATTEMPTS}
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-sm shadow-2xl">
        <form onSubmit={handleGenerate} className="flex flex-col gap-6">
          
          <Input 
            label="Enter a word or phrase" 
            placeholder="e.g. 'purple dragon', 'summer2024'"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            disabled={loading}
            autoFocus
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {complexityOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setComplexity(opt.id)}
                  disabled={loading}
                  className={`
                    relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200
                    ${complexity === opt.id 
                      ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900'}
                  `}
                >
                  <span className={`font-bold text-sm mb-1 ${complexity === opt.id ? 'text-white' : 'text-slate-300'}`}>
                    {opt.label}
                  </span>
                  <span className={`text-xs ${complexity === opt.id ? 'text-brand-200' : 'text-slate-500'}`}>
                    {opt.desc}
                  </span>
                  {complexity === opt.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 shadow-sm shadow-brand-500/50"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={loading} disabled={!word.trim()} className="w-full mt-2">
            Generate
          </Button>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Generated Results</h3>
            {results.map((item, idx) => (
              <div key={idx} className="group bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-brand-500/50 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div className="font-mono text-xl text-white tracking-wide break-all selection:bg-brand-500/30">
                    {item.password}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`
                      text-xs font-bold px-2 py-1 rounded uppercase
                      ${item.strength === 'Strong' ? 'bg-green-500/20 text-green-400' : 
                        item.strength === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}
                    `}>
                      {item.strength}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.password, idx)}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === idx ? (
                         <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500">{item.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Generator;