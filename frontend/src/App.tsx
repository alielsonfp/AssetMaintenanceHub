import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from './context/AppContext';
import { Box } from '@mui/material';

// Páginas de autenticação
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Páginas protegidas
import Assets from './pages/Assets';

// Componente de layout protegido
import ProtectedLayout from './components/layout/ProtectedLayout';

// Componentes temporários para páginas que não existem ainda
const ComingSoon = ({ pageName }: { pageName: string }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <h2>{pageName}</h2>
    <p>Esta página será implementada em breve...</p>
  </Box>
);

function App() {
  const { themeMode } = useContext(AppContext);

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
      }}
    >
      <Router>
        <Routes>
          {/* Rotas públicas de autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Rotas protegidas */}
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<ComingSoon pageName="Dashboard" />} />
            <Route path="assets" element={<Assets />} />
            <Route path="assets/:id" element={<ComingSoon pageName="Detalhes do Ativo" />} />
            <Route path="maintenance" element={<ComingSoon pageName="Manutenções" />} />
          </Route>

          {/* Rota padrão */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Box>
  );
}

export default App;