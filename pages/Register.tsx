import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppRoutes } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const result = await register(name, email, password);
      
      if (result.success) {
        // SCENARIO 1: Session returned immediately (Email Confirmation is DISABLED in Supabase)
        if (result.session) {
          navigate(AppRoutes.GENERATOR);
          return;
        } 
        
        // SCENARIO 2: No session returned. 
        // Could mean confirmation is required OR "Allow Unverified Logins" is enabled but session wasn't passed back.
        // We attempt a manual login to check.
        const loginResult = await login(email, password);
        
        if (loginResult.success) {
          // If login works, we are good to go!
          navigate(AppRoutes.GENERATOR);
        } else {
          // SCENARIO 3: Login failed. This implies Email Confirmation IS REQUIRED and still pending.
          setIsLoading(false);
          setSuccessMsg('Account created! Please check your email to confirm your account.');
          setPassword('');
        }
      } else {
        setError(result.error || 'Failed to create account.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] relative">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-2xl relative">
        <div className="absolute top-4 left-4">
          <Link to={AppRoutes.HOME} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back
          </Link>
        </div>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-slate-400 mt-2">Get unlimited access to AI password generation</p>
        </div>

        {successMsg ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Check Your Email</h3>
            <p className="text-slate-300 text-sm mb-6">{successMsg}</p>
            <Link to={AppRoutes.LOGIN}>
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Full Name" 
              type="text" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error}
              disabled={isLoading}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          </form>
        )}

        {!successMsg && (
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to={AppRoutes.LOGIN} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;