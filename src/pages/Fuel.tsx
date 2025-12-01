import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  LocalGasStation as GasIcon,
  Delete as DeleteIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { FuelLog } from '../../shared/types';

interface FuelFormData {
  liters: number;
  total_price: number;
  odometer: number;
  is_full_tank: boolean;
  arla_liters?: number;
}

export default function Fuel() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<FuelFormData>({
    liters: 0,
    total_price: 0,
    odometer: 0,
    is_full_tank: true,
    arla_liters: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [averageConsumption, setAverageConsumption] = useState<number | null>(null);

  useEffect(() => {
    loadFuelLogs();
  }, []);

  const loadFuelLogs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFuelLogs();
      setFuelLogs(data);
      
      // Calculate average consumption from full tank logs
      const fullTankLogs = data.filter(log => log.is_full_tank);
      if (fullTankLogs.length >= 2) {
        // Calculate average from the most recent full tank logs
        const recentLogs = fullTankLogs.slice(0, 10); // Last 10 full tank logs
        const totalKm = recentLogs.reduce((sum, log, index, array) => {
          if (index < array.length - 1) {
            return sum + (array[index].odometer - array[index + 1].odometer);
          }
          return sum;
        }, 0);
        const totalLiters = recentLogs.reduce((sum, log) => sum + log.liters, 0);
        
        if (totalKm > 0 && totalLiters > 0) {
          setAverageConsumption(totalKm / totalLiters);
        }
      }
    } catch (error) {
      console.error('Error loading fuel logs:', error);
      enqueueSnackbar('Erro ao carregar registros de combustível', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.liters || !formData.total_price || !formData.odometer) {
      enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      await apiClient.createFuelLog({
        liters: Number(formData.liters),
        total_price: Number(formData.total_price),
        odometer: Number(formData.odometer),
        is_full_tank: formData.is_full_tank,
        arla_liters: Number(formData.arla_liters) || 0,
      });

      enqueueSnackbar('Registro de combustível criado com sucesso!', { variant: 'success' });
      setOpenDialog(false);
      resetForm();
      loadFuelLogs();
    } catch (error) {
      console.error('Error creating fuel log:', error);
      enqueueSnackbar('Erro ao criar registro de combustível', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      liters: 0,
      total_price: 0,
      odometer: 0,
      is_full_tank: true,
      arla_liters: 0,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteFuelLog(id);
      enqueueSnackbar('Registro excluído com sucesso!', { variant: 'success' });
      loadFuelLogs();
    } catch (error) {
      console.error('Error deleting fuel log:', error);
      enqueueSnackbar('Erro ao excluir registro', { variant: 'error' });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getLastOdometer = () => {
    if (fuelLogs.length === 0) return 0;
    return Math.max(...fuelLogs.map(log => log.odometer));
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Abastecimento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Controle e análise de consumo de combustível
          </Typography>
        </Box>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent>
              <LinearProgress />
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {!loading && (
          <>
            <Stack spacing={2}>
              {averageConsumption && (
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack>
                        <Typography variant="h6" color="text.secondary">
                          Média de Consumo
                        </Typography>
                        <Typography variant="h4" color="info.main" fontWeight="bold">
                          {averageConsumption.toFixed(1)} km/L
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Baseado em tanques cheios
                        </Typography>
                      </Stack>
                      <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main' }} />
                    </Stack>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography variant="h6" color="text.secondary">
                        Total Abastecido (30 dias)
                      </Typography>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {fuelLogs
                          .filter(log => new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                          .reduce((sum, log) => sum + log.liters, 0).toFixed(0)} L
                      </Typography>
                    </Stack>
                    <GasIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography variant="h6" color="text.secondary">
                        Gasto Total (30 dias)
                      </Typography>
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        {formatCurrency(
                          fuelLogs
                            .filter(log => new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                            .reduce((sum, log) => sum + log.total_price, 0)
                        )}
                      </Typography>
                    </Stack>
                    <GasIcon sx={{ fontSize: 48, color: 'error.main' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* Fuel Logs List */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Últimos Abastecimentos
                </Typography>
                {fuelLogs.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Nenhum registro encontrado. Crie seu primeiro abastecimento!
                  </Alert>
                ) : (
                  <List>
                    {fuelLogs.slice(0, 10).map((log) => (
                      <ListItem key={log.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {formatCurrency(log.total_price)}
                              </Typography>
                              <Chip 
                                label={`${log.liters} L`} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                              />
                              {log.is_full_tank && (
                                <Chip 
                                  label="Tanque Cheio" 
                                  size="small" 
                                  color="success"
                                  variant="filled"
                                />
                              )}
                              {log.arla_liters && log.arla_liters > 0 && (
                                <Chip 
                                  label={`Arla 32: ${log.arla_liters}L`} 
                                  size="small" 
                                  color="info"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Stack>
                              <Stack direction="row" spacing={2}>
                                <Typography variant="body2" color="text.secondary">
                                  Hodômetro: {log.odometer.toLocaleString()} km
                                </Typography>
                                {/* Nome do posto não está no modelo atual */}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(log.created_at)}
                              </Typography>
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDelete(log.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Stack>

      {/* Add Fuel Log Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Novo Abastecimento
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Hodômetro (km)"
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) })}
              inputProps={{ min: getLastOdometer() }}
              helperText={`Último registro: ${getLastOdometer().toLocaleString()} km`}
              required
            />

            <TextField
              fullWidth
              label="Litros"
              type="number"
              value={formData.liters}
              onChange={(e) => setFormData({ ...formData, liters: parseFloat(e.target.value) })}
              inputProps={{ step: 0.01, min: 0 }}
              required
            />

            <TextField
              fullWidth
              label="Valor Total"
              type="number"
              value={formData.total_price}
              onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) })}
              inputProps={{ step: 0.01, min: 0 }}
              required
            />

            {/* Campo de nome do posto removido do modelo */}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_full_tank}
                  onChange={(e) => setFormData({ ...formData, is_full_tank: e.target.checked })}
                />
              }
              label="Tanque Cheio? (Importante para cálculo de média)"
            />

            <TextField
              fullWidth
              label="Litros de Arla 32 (Opcional)"
              type="number"
              value={formData.arla_liters}
              onChange={(e) => setFormData({ ...formData, arla_liters: parseFloat(e.target.value) })}
              inputProps={{ step: 0.01, min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <LinearProgress /> : null}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add-fuel"
        onClick={() => setOpenDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 1000,
          width: 70,
          height: 70,
        }}
      >
        <GasIcon sx={{ fontSize: 32 }} />
      </Fab>
    </Box>
  );
}
