import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/useAuth.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { SignIn } from './pages/auth/SignIn.jsx';
import { EmployeeDirectory } from './pages/directory/EmployeeDirectory.jsx';
import { ProcessRegistry } from './pages/registry/ProcessRegistry.jsx';
import { RegisterProcess } from './pages/registry/RegisterProcess.jsx';
import { ProcessDetail } from './pages/registry/ProcessDetail.jsx';
import { OperationalOverview } from './pages/overview/OperationalOverview.jsx';
import { ReviewQueue } from './pages/reviews/ReviewQueue.jsx';
import { PMHandovers } from './pages/handovers/PMHandovers.jsx';
import { ExcelImport } from './pages/import/ExcelImport.jsx';
import { MasterData } from './pages/master-data/MasterData.jsx';
import { AuditLedger } from './pages/audit/AuditLedger.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SignIn />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<ErrorBoundary><OperationalOverview /></ErrorBoundary>} />
          <Route path="directory" element={<ErrorBoundary><EmployeeDirectory /></ErrorBoundary>} />
          <Route path="employees" element={<Navigate to="/directory" replace />} />
          <Route path="registry" element={<ErrorBoundary><ProcessRegistry /></ErrorBoundary>} />
          <Route path="registry/new" element={<ErrorBoundary><RegisterProcess /></ErrorBoundary>} />
          <Route path="registry/:id" element={<ErrorBoundary><ProcessDetail /></ErrorBoundary>} />
          <Route path="processes" element={<Navigate to="/registry" replace />} />
          <Route path="processes/:id" element={<ErrorBoundary><ProcessDetail /></ErrorBoundary>} />
          <Route path="reviews" element={<ErrorBoundary><ReviewQueue /></ErrorBoundary>} />
          <Route path="handovers" element={<ErrorBoundary><PMHandovers /></ErrorBoundary>} />
          <Route path="import" element={<ErrorBoundary><ExcelImport /></ErrorBoundary>} />
          <Route path="master-data" element={<ErrorBoundary><MasterData /></ErrorBoundary>} />
          <Route path="audit" element={<ErrorBoundary><AuditLedger /></ErrorBoundary>} />
          {/* Future routes will be added here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
