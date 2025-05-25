// frontend/src/pages/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar se tem token
  useEffect(() => {
    if (!token) {
      setError('Token de recuperação inválido');
    }
  }, [token]);

  const handleChange = (field: 'password' | 'confirmPassword') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Token de recuperação inválido');
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await authService.resetPassword(token, formData.password);
      setSuccess(true);

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      const message = error.response?.data?.message || 'Erro ao redefinir senha';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                Senha redefinida!
              </Typography>

              <Alert severity="success" sx={{ mb: 3 }}>
                Sua senha foi alterada com sucesso.
              </Alert>

              <Typography variant="body1" sx={{ mb: 3 }}>
                Você será redirecionado para o login em alguns segundos...
              </Typography>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
              >
                Ir para Login
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" fontWeight="bold">
              {t('auth.resetPassword')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Digite sua nova senha
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Nova senha"
              type="password"
              id="password"
              autoComplete="new-password"
              autoFocus
              value={formData.password}
              onChange={handleChange('password')}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar nova senha"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !formData.password || !formData.confirmPassword}
              size="large"
            >
              {loading ? t('common.loading') : 'Redefinir senha'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Lembrou da senha?{' '}
                <Link component={RouterLink} to="/login">
                  {t('auth.login')}
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;