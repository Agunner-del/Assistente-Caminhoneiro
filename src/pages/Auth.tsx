import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalShipping,
  Business,
  TrendingUp,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { ProfileType } from '../../shared/types';
import { useSnackbar } from 'notistack';

interface ProfileTypeOption {
  type: ProfileType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const profileTypes: ProfileTypeOption[] = [
  {
    type: 'TAC',
    title: 'Sou Autônomo',
    description: 'Trabalho por conta própria, gerencio meus fretes e despesas',
    icon: <LocalShipping sx={{ fontSize: 64 }} />,
  },
  {
    type: 'CLT',
    title: 'Sou Funcionário',
    description: 'Trabalho com carteira assinada, recebo diárias e reembolsos',
    icon: <Business sx={{ fontSize: 64 }} />,
  },
  {
    type: 'COMISSIONADO',
    title: 'Trabalho com Comissão',
    description: 'Recebo comissão sobre os fretes que realizo',
    icon: <TrendingUp sx={{ fontSize: 64 }} />,
  },
];

export default function Auth() {
  const { enqueueSnackbar } = useSnackbar();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType>('TAC');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login, register, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [isLogin, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!isLogin && password !== confirmPassword) {
      enqueueSnackbar('As senhas não coincidem', { variant: 'warning' });
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, selectedProfileType);
      }
    } catch (error) {
      // Error is handled by the store
      console.error('Auth error:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: '16px' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Box textAlign="center">
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Copiloto de Estrada
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {!isLogin && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Escolha seu perfil:
                    </Typography>
                    <Stack spacing={2}>
                      {profileTypes.map((profile) => (
                        <Card
                          key={profile.type}
                          onClick={() => setSelectedProfileType(profile.type)}
                          sx={{
                            cursor: 'pointer',
                            border: selectedProfileType === profile.type 
                              ? '2px solid #FFC107' 
                              : '1px solid rgba(255, 193, 7, 0.3)',
                            backgroundColor: selectedProfileType === profile.type
                              ? 'rgba(255, 193, 7, 0.1)'
                              : 'transparent',
                            p: 2,
                            borderRadius: '12px',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 193, 7, 0.05)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box color="primary.main">{profile.icon}</Box>
                            <Box flex={1}>
                              <Typography variant="h6" fontSize="1.1rem">
                                {profile.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {profile.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}

                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="seu@email.com"
                />

                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Mínimo 6 caracteres"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isLoading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {!isLogin && (
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirmar Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Repita sua senha"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  endIcon={isLoading ? <CircularProgress size={20} /> : undefined}
                >
                  {isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 2 }} />

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              </Typography>
              <Button
                onClick={() => setIsLogin(!isLogin)}
                variant="text"
                color="primary"
                disabled={isLoading}
                sx={{ mt: 1 }}
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
