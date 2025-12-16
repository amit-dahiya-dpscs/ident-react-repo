import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom'; 
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { setupInterceptors } from './services/api';
import './App.css';

const GlobalLoader = () => ( <div className="global-loader" /> );

function App() {
  const { isInitializing, logout } = useAuth();

  useEffect(() => {
    setupInterceptors(logout);
  }, [logout]);

  if (isInitializing) {
    return <GlobalLoader />;
  }

  return (
    <div className="app-container">
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- THIS IS THE CORRECTED PROTECTED ROUTE STRUCTURE --- */}
        {/* This parent Route uses ProtectedRoute as its element.
            If authenticated, it will render an <Outlet /> which allows
            the nested child routes to render. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/search" element={<SearchPage />} />
          {/* You can add more protected routes here, e.g.: */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        </Route>
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/search" />} />
      </Routes>
    </div>
  );
}

export default App;