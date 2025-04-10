import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;