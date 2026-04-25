import React from 'react';

import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';

import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
