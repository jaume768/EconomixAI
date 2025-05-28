import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Goals from './pages/Goals';
import Challenges from './pages/Challenges';
import Achievements from './pages/Achievements';
import LandingPage from './pages/LandingPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { mode } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  
  useEffect(() => {
    // La aplicación está lista cuando la autenticación ha terminado de cargar
    if (!loading) {
      setAppReady(true);
    }
  }, [loading]);
  
  if (!appReady) {
    return <div>Cargando aplicación...</div>;
  }
  
  return (
    <div className={mode === 'dark' ? 'dark-mode' : 'light-mode'}>
      <Routes>
        {/* Mostrar la landing page cuando el usuario no está autenticado */}
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />

        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="goals" element={<Goals />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="achievements" element={<Achievements />} />
        </Route>
        
        <Route path="*" element={<div style={{padding: '2rem', textAlign: 'center'}}>
          <h1>404 - Página no encontrada</h1>
          <p>La página que buscas no existe o está en construcción.</p>
        </div>} />
      </Routes>
    </div>
  );
}

export default App;
