import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import { LoginForm } from './components/auth/LoginForm.jsx';
import {
  ShieldCheck,
  LogOut,
  User,
  KeyRound,
  Shield,
  Layers,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

function AuthenticatedView() {
  const { user, roles, permissions, logout, isLoading } = useAuth();

  return (
    <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Detector Platform
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Authenticated Session Active
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User Identity Card */}
      <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-700 mt-0.5">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{user.name}</h2>
              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {user.ecode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Assigned Roles */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2.5">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Assigned Roles ({roles.length})
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <span
              key={role.role_code}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                role.role_category === 'PLATFORM_ADMIN'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : role.role_category === 'MODULE_ADMIN'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {role.role_name || role.role_code}
              <span className="ml-1.5 text-[10px] opacity-60">
                ({role.role_category})
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Effective Capabilities Count */}
      <div className="mb-6 p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <KeyRound className="w-4 h-4 text-indigo-500" />
          <div>
            <span className="text-xs font-semibold text-slate-800">
              Effective Permissions
            </span>
            <span className="block text-[11px] text-slate-500">
              Resolved from assigned role grants
            </span>
          </div>
        </div>
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800">
          {permissions.length} granted
        </span>
      </div>

      {/* Security Status Footnote */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5 text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium">HttpOnly Session Active</span>
        </div>
        <div className="flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Phase 2 Verified</span>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="flex items-center space-x-2.5 text-slate-500 text-xs font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Verifying secure session...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
      {isAuthenticated ? <AuthenticatedView /> : <LoginForm />}
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
