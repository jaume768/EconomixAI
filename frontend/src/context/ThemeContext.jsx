import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Mantener el tema azul original 
  const mode = 'blue';

  // Asegurarnos de que no se aplique la clase dark-mode
  useEffect(() => {
    // Eliminar la clase dark-mode si existiera
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'blue'); // Guardar el tema azul
  }, []);

  const value = {
    mode
    // Ya no se proporciona toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
