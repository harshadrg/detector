import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/useAuth.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { SignIn } from './pages/auth/SignIn.jsx';
import { EmployeeDirectory } from './pages/directory/EmployeeDirectory.jsx';
import { ProcessRegistry } from './pages/registry/ProcessRegistry.jsx';
import { ProcessDetail } from './pages/registry/ProcessDetail.jsx';

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

// Temporary placeholder until Step 7.4+
function OverviewPlaceholder() {
  return <div className="p-8 text-center text-on-surface">Overview Page (Placeholder)</div>;
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
          <Route path="overview" element={<OverviewPlaceholder />} />
          <Route path="directory" element={<EmployeeDirectory />} />
          <Route path="employees" element={<Navigate to="/directory" replace />} />
          <Route path="registry" element={<ProcessRegistry />} />
          <Route path="registry/:id" element={<ProcessDetail />} />
          <Route path="processes" element={<Navigate to="/registry" replace />} />
          <Route path="processes/:id" element={<ProcessDetail />} />
          {/* Future routes will be added here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
