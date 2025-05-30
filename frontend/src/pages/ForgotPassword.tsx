// frontend/src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
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
import { Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Por favor, informe seu e-mail');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, informe um e-mail válido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação:', error);
      const message = error.response?.data?.message || 'Erro ao enviar e-mail de recuperação';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2
        }}
      >
        <Container component="main" maxWidth="sm">
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                E-mail enviado!
              </Typography>

              <Alert severity="success" sx={{ mb: 3 }}>
                Instruções para recuperar sua senha foram enviadas para <strong>{email}</strong>
              </Alert>

              <Typography variant="body1" sx={{ mb: 3 }}>
                Verifique sua caixa de entrada e spam. O link de recuperação expira em 1 hora.
              </Typography>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
              >
                Voltar ao Login
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Return principal
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" fontWeight="bold">
              {t('auth.forgotPassword')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Informe seu e-mail para receber instruções de recuperação
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
              id="email"
              label={t('auth.email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleChange}
              disabled={loading}
              placeholder="seu@email.com"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !email}
              size="large"
            >
              {loading ? t('common.loading') : 'Enviar instruções'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Lembrou da senha?{' '}
                <Link component={RouterLink} to="/login">
                  {t('auth.login')}
                </Link>
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2">
                Não tem conta?{' '}
                <Link component={RouterLink} to="/register">
                  {t('auth.register')}
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;