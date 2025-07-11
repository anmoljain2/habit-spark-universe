import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import Relationship from './pages/Relationship'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
