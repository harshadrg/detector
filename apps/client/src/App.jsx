import { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import { LoginForm } from './components/auth/LoginForm.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { CapabilityPreview } from './components/auth/CapabilityPreview.jsx';
import { Loader2 } from 'lucide-react';

import { EmployeeDirectory } from './components/employees/EmployeeDirectory.jsx';
import { AuditLedger } from './components/audit/AuditLedger.jsx';
import { MasterDataManager } from './components/masters/MasterDataManager.jsx';

function Shell() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar currentTab={currentTab} onTabSelect={setCurrentTab} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {currentTab === 'employees' ? (
              <EmployeeDirectory />
            ) : currentTab === 'audit' ? (
              <AuditLedger />
            ) : currentTab === 'masters' ? (
              <MasterDataManager />
            ) : (
              <CapabilityPreview />
            )}
          </div>
        </main>
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
          <span>Hydrating capability-driven session...</span>
        </div>
      </main>
    );
  }

  return isAuthenticated ? (
    <Shell />
  ) : (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
      <LoginForm />
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
