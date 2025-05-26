import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay un token en localStorage al cargar
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Configurar el token en el header de todas las solicitudes
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Obtener los datos del usuario
          const response = await axios.get(`/api/auth/profile`);
          
          if (response.data.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Guardar token en localStorage
        localStorage.setItem('token', token);
        
        // Configurar el token en el header de todas las solicitudes
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.data.message || 'Error de autenticación');
        return false;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`/api/auth/register`, userData);

      if (response.data.success) {
        return true;
      } else {
        setError(response.data.message || 'Error en el registro');
        return false;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
      return false;
    }
  };

  const logout = () => {
    // Eliminar token del localStorage
    localStorage.removeItem('token');
    
    // Eliminar token de los headers de axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Resetear estado
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/${user.id}`, userData);

      if (response.data.success) {
        setUser({...user, ...userData});
        return true;
      } else {
        setError(response.data.message || 'Error actualizando perfil');
        return false;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
