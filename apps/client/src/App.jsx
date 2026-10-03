import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/useAuth.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { SignIn } from './pages/auth/SignIn.jsx';
import { EmployeeDirectory } from './pages/directory/EmployeeDirectory.jsx';
import { ProcessRegistry } from './pages/registry/ProcessRegistry.jsx';
import { ProcessDetail } from './pages/registry/ProcessDetail.jsx';
import { OperationalOverview } from './pages/overview/OperationalOverview.jsx';
import { ReviewQueue } from './pages/reviews/ReviewQueue.jsx';
import { PMHandovers } from './pages/handovers/PMHandovers.jsx';
import { ExcelImport } from './pages/import/ExcelImport.jsx';
import { MasterData } from './pages/master-data/MasterData.jsx';

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
          <Route path="overview" element={<OperationalOverview />} />
          <Route path="directory" element={<EmployeeDirectory />} />
          <Route path="employees" element={<Navigate to="/directory" replace />} />
          <Route path="registry" element={<ProcessRegistry />} />
          <Route path="registry/:id" element={<ProcessDetail />} />
          <Route path="processes" element={<Navigate to="/registry" replace />} />
          <Route path="processes/:id" element={<ProcessDetail />} />
          <Route path="reviews" element={<ReviewQueue />} />
          <Route path="handovers" element={<PMHandovers />} />
          <Route path="import" element={<ExcelImport />} />
          <Route path="master-data" element={<MasterData />} />
          {/* Future routes will be added here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
