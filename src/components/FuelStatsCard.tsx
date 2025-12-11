import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  LocalGasStation,
  TrendingUp,
  AttachMoney,
  Speed
} from '@mui/icons-material';

interface FuelStats {
  average_consumption: number | null;
  total_liters: number;
  total_spent: number;
  last_full_tank_odometer: number | null;
  last_full_tank_date: string | null;
  partial_fill_count: number;
  full_tank_count: number;
  average_price_per_liter: number | null;
}

interface FuelStatsCardProps {
  userId: string;
}

const FuelStatsCard: React.FC<FuelStatsCardProps> = ({ userId }) => {
  const [stats, setStats] = useState<FuelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestFullTank, setSuggestFullTank] = useState(false);

  useEffect(() => {
    loadFuelStats();
  }, [userId]);

  const loadFuelStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Faça login para ver as estatísticas de combustível');
        return;
      }

      const response = await fetch('/api/fuel-logs/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setStats(data);
      setSuggestFullTank(data.suggest_full_tank || false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF', p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress color="primary" />
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
        <CardContent>
          <Alert severity="error" sx={{ backgroundColor: 'transparent', color: '#FFFFFF' }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <LocalGasStation color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Estatísticas de Combustível</Typography>
        </Box>

        {/* Alerta para tanque cheio */}
        {suggestFullTank && (
          <Alert 
            severity="info" 
            sx={{ mb: 2, backgroundColor: 'rgba(25, 118, 210, 0.1)', color: '#FFFFFF' }}
            icon={<Speed />}
          >
            💡 Sugestão: Hora de fazer um tanque cheio para calcular a média com precisão!
          </Alert>
        )}

        <Stack spacing={2}>
          {/* Média de Consumo */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Média de Consumo</Typography>
            </Box>
            <Typography variant="h6" color="#4CAF50">
              {stats.average_consumption ? `${stats.average_consumption.toFixed(2)} km/l` : '—'}
            </Typography>
          </Box>

          {/* Total de Litros */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <LocalGasStation color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Total de Litros</Typography>
            </Box>
            <Typography variant="h6" color="#FFC107">
              {stats.total_liters.toFixed(1)} L
            </Typography>
          </Box>

          {/* Total Gasto */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Total Gasto</Typography>
            </Box>
            <Typography variant="h6" color="#FFC107">
              R$ {stats.total_spent.toFixed(2)}
            </Typography>
          </Box>

          {/* Preço Médio por Litro */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Preço Médio/Litro</Typography>
            </Box>
            <Typography variant="h6" color="#B0B0B0">
              {stats.average_price_per_liter ? `R$ ${stats.average_price_per_liter.toFixed(3)}` : '—'}
            </Typography>
          </Box>

          {/* Contadores */}
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Chip 
              label={`${stats.full_tank_count} Tanques Cheios`}
              color="success"
              size="small"
              sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}
            />
            <Chip 
              label={`${stats.partial_fill_count} Parciais`}
              color="info"
              size="small"
              sx={{ backgroundColor: 'rgba(25, 118, 210, 0.2)' }}
            />
          </Box>

          {/* Último Tanque Cheio */}
          {stats.last_full_tank_odometer && (
            <Box mt={2} p={1} sx={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 1 }}>
              <Typography variant="caption" color="#B0B0B0">
                Último tanque cheio: {stats.last_full_tank_odometer.toLocaleString()} km
                {stats.last_full_tank_date && ` em ${new Date(stats.last_full_tank_date).toLocaleDateString('pt-BR')}`}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default FuelStatsCard;
