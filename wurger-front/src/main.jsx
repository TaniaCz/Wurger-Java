import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // <--- Global Styles
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import App from './App.jsx'

// Interceptar fetch global para reescribir la URL de la API local a la de producción en el despliegue
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('http://localhost:8080')) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    input = input.replace('http://localhost:8080', baseUrl);
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </ThemeProvider>
  </StrictMode>,
)
