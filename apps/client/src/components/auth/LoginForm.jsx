import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';

const loginFormSchema = z.object({
  ecode: z
    .string()
    .trim()
    .min(1, 'Employee code is required.')
    .max(20, 'Employee code must not exceed 20 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(100, 'Password must not exceed 100 characters.'),
});

export function LoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      ecode: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Detector Platform
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Corporate Identity & Access Governance
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="ecode"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Employee Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="ecode"
              type="text"
              placeholder="e.g. ADMIN001"
              autoComplete="username"
              {...register('ecode')}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                errors.ecode ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.ecode && (
            <p className="mt-1 text-[11px] text-red-600">{errors.ecode.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              {...register('password')}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                errors.password ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-xl shadow-sm shadow-indigo-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Detector</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Air-Gapped Enterprise SSO / Direct</span>
        <span className="font-mono">HttpOnly Session</span>
      </div>
    </div>
  );
}
