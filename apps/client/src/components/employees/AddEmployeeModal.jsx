import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employeeApi } from '../../lib/api.js';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

const addEmployeeSchema = z.object({
  ecode: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters.')
    .max(20, 'Code must not exceed 20 characters.')
    .transform((v) => v.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.'),
  email: z
    .string()
    .trim()
    .email('Invalid corporate email address.')
    .max(150, 'Email must not exceed 150 characters.')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password must not exceed 100 characters.')
    .default('Welcome@Detector2026!'),
});

export function AddEmployeeModal({ isOpen, onClose, onEmployeeAdded }) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      ecode: '',
      name: '',
      email: '',
      password: 'Welcome@Detector2026!',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await employeeApi.create(values);
      reset();
      onEmployeeAdded();
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to register employee.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Register New Employee
              </h3>
              <p className="text-[11px] text-slate-500">
                Create employee profile & corporate identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employee Code (ECODE)
            </label>
            <input
              type="text"
              placeholder="e.g. E1042"
              {...register('ecode')}
              className={`w-full px-3 py-2 text-xs bg-slate-50/70 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase ${
                errors.ecode ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.ecode && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.ecode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              placeholder="e.g. Elena Rostova"
              {...register('name')}
              className={`w-full px-3 py-2 text-xs bg-slate-50/70 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                errors.name ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corporate Email
            </label>
            <input
              type="email"
              placeholder="e.g. elena.r@detector.internal"
              {...register('email')}
              className={`w-full px-3 py-2 text-xs bg-slate-50/70 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                errors.email ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.email && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-3 py-2 text-xs bg-slate-50/70 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                errors.password ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.password && (
              <p className="mt-0.5 text-[10px] text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-[10px] text-slate-400">
              Default password if unchanged: Welcome@Detector2026!
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Employee</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
