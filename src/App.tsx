import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PublicJobs from './pages/PublicJobs';
import ApplicantDashboard from './pages/applicant/Dashboard';
import ThemeToggle from './components/ThemeToggle';

function PrivateRoute({ children, role }: { children: React.ReactNode, role: 'hr' | 'applicant' }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  const isAuthorized = user && (
    (role === 'hr' && user.email?.includes('hr@')) || 
    (role === 'applicant' && !user.email?.includes('hr@'))
  );
  
  return isAuthorized ? children : <Navigate to="/login" />;
}

function App() {
  const { isDarkMode } = useThemeStore();

  return (
    <Router>
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-gray-900`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Routes>
          <Route path="/jobs" element={<PublicJobs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute role="hr">
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/applicant/*"
            element={
              <PrivateRoute role="applicant">
                <ApplicantDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/jobs" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;