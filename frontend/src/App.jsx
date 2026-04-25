import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import FieldDetail from './pages/FieldDetail';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/fields/:id"
          element={
            <PrivateRoute>
              <FieldDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
