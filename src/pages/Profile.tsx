import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
} from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/supabase';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  const getProfileTitle = () => {
    switch (user?.profile_type) {
      case 'TAC':
        return 'Motorista Autônomo';
      case 'CLT':
        return 'Motorista CLT';
      case 'COMISSIONADO':
        return 'Motorista Comissionado';
      default:
        return 'Motorista';
    }
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Suas informações de conta
          </Typography>
        </Box>

        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Profile Card */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {user?.email}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tipo de Perfil
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getProfileTitle()}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Data de Cadastro
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          disabled={loading}
          fullWidth
          sx={{ minHeight: 60 }}
        >
          {loading ? 'Saindo...' : 'Sair da Conta'}
        </Button>
      </Stack>
    </Box>
  );
}