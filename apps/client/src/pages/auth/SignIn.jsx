import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

const loginSchema = z.object({
  ecode: z
    .string()
    .trim()
    .min(1, 'Employee code is required.')
    .max(20, 'Employee code cannot exceed 20 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);

  // If already authenticated, redirect to the intended destination or overview
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/overview';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      ecode: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      await login({
        ecode: data.ecode.trim().toUpperCase(),
        password: data.password,
      });
      const destination = location.state?.from?.pathname || '/overview';
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Invalid employee code or password.');
    }
  };

  const handleDemoFill = () => {
    setValue('ecode', 'ADMIN001', { shouldValidate: true });
    setValue('password', 'Admin@Detector2026!', { shouldValidate: true });
    setApiError(null);
  };

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[420px]">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">
              Detector Platform
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant font-normal">
              Enterprise Process Management Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-on-surface">
                Sign In
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Enter your credentials to access the console
              </p>
            </div>

            {/* Error Callout */}
            {apiError && (
              <div 
                role="alert"
                className="mb-5 p-3 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{apiError}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Employee Code"
                id="ecode"
                type="text"
                autoComplete="username"
                placeholder="e.g. ADMIN001"
                startIcon={User}
                error={errors.ecode?.message}
                disabled={isSubmitting}
                {...register('ecode')}
              />

              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                startIcon={Lock}
                error={errors.password?.message}
                disabled={isSubmitting}
                endAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="p-1 text-outline hover:text-on-surface focus:outline-none transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                }
                {...register('password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </Button>
              </div>
            </form>

            {/* Subtle Demo Credentials Shortcut */}
            <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>Testing credentials?</span>
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-primary hover:underline font-medium focus:outline-none cursor-pointer"
              >
                Fill Admin Credentials
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="py-4 px-6 text-center text-[11px] text-on-surface-variant border-t border-outline-variant/20">
        Detector Enterprise Platform &copy; 2026 &bull; Regulated Operations
      </footer>
    </div>
  );
}

export default SignIn;
