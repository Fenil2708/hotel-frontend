import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { TableSessionProvider } from './context/TableSessionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TableSessionProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </TableSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
