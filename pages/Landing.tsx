import React from 'react';
import { Link } from 'react-router-dom';
import { AppRoutes } from '../types';
import Button from '../components/Button';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-8">
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
        Powered by Gemini AI
      </div>

      {/* Hero Title */}
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
        Passwords that are <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-500">
          Secure & Memorable
        </span>
      </h1>

      <p className="max-w-2xl text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
        Stop using "Password123". Our AI transforms your favorite words into 
        cryptographically strong passwords that you can actually remember.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md sm:w-auto">
        <Link to={AppRoutes.GENERATOR} className="w-full sm:w-auto">
          <Button className="w-full h-14 text-lg">Try It Now</Button>
        </Link>
        <Link to={AppRoutes.REGISTER} className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full h-14 text-lg">Create Account</Button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full max-w-5xl">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:bg-slate-800/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Smart Logic</h3>
          <p className="text-slate-400">Uses AI to apply intelligent substitutions like Leetspeak and pattern insertion rather than random noise.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:bg-slate-800/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Instant & Fast</h3>
          <p className="text-slate-400">Generate multiple variations in milliseconds. Copy to clipboard with a single click.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:bg-slate-800/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Free for Everyone</h3>
          <p className="text-slate-400">Try it as a guest (3 attempts) or sign up for a free account to get unlimited access.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;