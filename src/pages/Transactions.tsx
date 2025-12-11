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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Transaction, TransactionCategory, TransactionType } from '../../shared/types';

interface TransactionFormData {
  amount: number;
  category: TransactionCategory;
  description: string;
  type: TransactionType;
  proof_url?: string;
}

export default function Transactions() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: 0,
    category: 'diesel',
    description: '',
    type: 'expense',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiClient.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      enqueueSnackbar('Erro ao carregar lançamentos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) {
      enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await apiClient.uploadPhoto(photoFile);
      }

      await apiClient.createTransaction({
        ...formData,
        amount: Number(formData.amount),
        proof_url: photoUrl || undefined,
        status: 'pending',
        transaction_date: new Date().toISOString(),
      });

      enqueueSnackbar('Lançamento criado com sucesso!', { variant: 'success' });
      setOpenDialog(false);
      resetForm();
      loadTransactions();
    } catch (error) {
      console.error('Error creating transaction:', error);
      enqueueSnackbar('Erro ao criar lançamento', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      category: 'diesel',
      description: '',
      type: 'expense',
    });
    setPhotoFile(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteTransaction(id);
      enqueueSnackbar('Lançamento excluído com sucesso!', { variant: 'success' });
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      enqueueSnackbar('Erro ao excluir lançamento', { variant: 'error' });
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

  const getCategoryLabel = (category: TransactionCategory) => {
    const labels: Record<TransactionCategory, string> = {
      frete: 'Frete',
      adiantamento: 'Adiantamento',
      saldo: 'Saldo a Receber',
      diesel: 'Combustível',
      arla: 'Arla 32',
      pedagio: 'Pedágio',
      chapa: 'Chapa',
      diaria: 'Diária',
      quebra_caixa: 'Quebra de Caixa',
      manutencao: 'Manutenção',
    };
    return labels[category];
  };

  const getTypeColor = (type: TransactionType): 'success' | 'error' => {
    return type === 'income' ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Lançamentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Controle suas receitas e despesas
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
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography variant="h6" color="text.secondary">
                        Total de Receitas
                      </Typography>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
                      </Typography>
                    </Stack>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main' }} />
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography variant="h6" color="text.secondary">
                        Total de Despesas
                      </Typography>
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
                      </Typography>
                    </Stack>
                    <TrendingDownIcon sx={{ fontSize: 48, color: 'error.main' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* Transactions List */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Últimos Lançamentos
                </Typography>
                {transactions.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Nenhum lançamento encontrado. Crie seu primeiro lançamento!
                  </Alert>
                ) : (
                  <List>
                    {transactions.slice(0, 10).map((transaction) => (
                      <ListItem key={transaction.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {formatCurrency(transaction.amount)}
                              </Typography>
                              <Chip 
                                label={getCategoryLabel(transaction.category)} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={transaction.type === 'income' ? 'Receita' : 'Despesa'}
                                color={getTypeColor(transaction.type)}
                                size="small"
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack>
                              <Typography variant="body2" color="text.secondary">
                                {transaction.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(transaction.created_at)}
                              </Typography>
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDelete(transaction.id)}
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

      {/* Add Transaction Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Novo Lançamento
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                label="Tipo"
              >
                <MenuItem value="expense">Despesa</MenuItem>
                <MenuItem value="income">Receita</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
                label="Categoria"
              >
                {formData.type === 'expense' ? (
                  <>
                    <MenuItem value="diesel">Combustível</MenuItem>
                    <MenuItem value="arla">Arla 32</MenuItem>
                    <MenuItem value="pedagio">Pedágio</MenuItem>
                    <MenuItem value="manutencao">Manutenção</MenuItem>
                    <MenuItem value="chapa">Chapa</MenuItem>
                    <MenuItem value="quebra_caixa">Quebra de Caixa</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="frete">Frete</MenuItem>
                    <MenuItem value="adiantamento">Adiantamento</MenuItem>
                    <MenuItem value="saldo">Saldo</MenuItem>
                    <MenuItem value="diaria">Diária</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Valor"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              inputProps={{ step: 0.01, min: 0 }}
              required
            />

            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<CameraIcon />}
              fullWidth
              sx={{ height: 60 }}
            >
              {photoFile ? `Foto: ${photoFile.name}` : 'Adicionar Foto (Opcional)'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                hidden
              />
            </Button>
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
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add-transaction"
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
        <AddIcon sx={{ fontSize: 32 }} />
      </Fab>
    </Box>
  );
}
