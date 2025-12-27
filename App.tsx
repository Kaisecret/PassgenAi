import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Generator from './pages/Generator';
import { AppRoutes } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path={AppRoutes.HOME} element={<Landing />} />
            <Route path={AppRoutes.LOGIN} element={<Login />} />
            <Route path={AppRoutes.REGISTER} element={<Register />} />
            <Route path={AppRoutes.GENERATOR} element={<Generator />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to={AppRoutes.HOME} replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;