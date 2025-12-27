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
  const [isLoading, setIsLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Attempt to register
      const result = await register(name, email, password);
      
      if (result.success) {
        // 2. If session is returned immediately (Email Confirm OFF), go to App
        if (result.session) {
          navigate(AppRoutes.GENERATOR);
          return;
        } 
        
        // 3. Fallback: If no session, try explicit login (Handles some edge cases)
        const loginResult = await login(email, password);
        
        if (loginResult.success) {
          navigate(AppRoutes.GENERATOR);
        } else {
          // 4. Only if both fail (likely need email confirm or rate limit)
          setError(loginResult.error || 'Account created. Please check if you need to verify your email, then login.');
          setIsLoading(false);
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

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to={AppRoutes.LOGIN} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;