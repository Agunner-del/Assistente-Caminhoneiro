import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { LocalGasStation, AttachMoney, Kitchen, CheckCircle } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import type { AIProcessingResponse, TransactionCategory, TransactionType } from '../../shared/types';

interface AIConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  aiResponse: AIProcessingResponse | null;
  onConfirm: (data: any) => void;
  isProcessing?: boolean;
}

const AIConfirmationModal: React.FC<AIConfirmationModalProps> = ({
  open,
  onClose,
  aiResponse,
  onConfirm,
  isProcessing = false
}) => {
  const [formData, setFormData] = useState<any>({});
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (aiResponse?.data) {
      setFormData(aiResponse.data);
    }
  }, [aiResponse]);

  if (!aiResponse) return null;

  const getIntentIcon = () => {
    switch (aiResponse.intent) {
      case 'fuel':
        return <LocalGasStation color="primary" />;
      case 'transaction':
        return <AttachMoney color="primary" />;
      case 'inventory':
        return <Kitchen color="primary" />;
      default:
        return <CheckCircle color="primary" />;
    }
  };

  const getIntentTitle = () => {
    switch (aiResponse.intent) {
      case 'fuel':
        return 'Confirmar Abastecimento';
      case 'transaction':
        return 'Confirmar Transação';
      case 'inventory':
        return 'Confirmar Inventário';
      default:
        return 'Confirmar Dados';
    }
  };

  const handleConfirm = () => {
    if (!formData || Object.keys(formData).length === 0) {
      enqueueSnackbar('Por favor, preencha os dados', { variant: 'error' });
      return;
    }

    onConfirm({
      ...formData,
      intent: aiResponse.intent,
      confidence: aiResponse.confidence
    });
  };

  const renderFuelForm = () => (
    <Stack spacing={3}>
      <Alert severity="info" icon={<LocalGasStation />}>
        IA detectou um abastecimento com {aiResponse.confidence}% de confiança
      </Alert>
      
      <TextField
        label="Odômetro (km)"
        type="number"
        value={formData.odometer || ''}
        onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
        fullWidth
        required
        InputProps={{ inputProps: { min: 0 } }}
      />
      
      <TextField
        label="Litros"
        type="number"
        value={formData.liters || ''}
        onChange={(e) => setFormData({ ...formData, liters: parseFloat(e.target.value) || 0 })}
        fullWidth
        required
        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
      />
      
      <TextField
        label="Valor Total (R$)"
        type="number"
        value={formData.total_price || ''}
        onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
        fullWidth
        required
        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
      />
      
      <FormControl fullWidth>
        <InputLabel>Tipo de Combustível</InputLabel>
        <Select
          value={formData.fuel_type || 'diesel'}
          onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
        >
          <MenuItem value="diesel">Diesel</MenuItem>
          <MenuItem value="arla32">Arla 32</MenuItem>
        </Select>
      </FormControl>
      
      <FormControl fullWidth>
        <InputLabel>Tanque Cheio?</InputLabel>
        <Select
          value={(formData.is_full_tank ? 'true' : 'false')}
          onChange={(e) => setFormData({ ...formData, is_full_tank: String(e.target.value) === 'true' })}
        >
          <MenuItem value={'true'}>Sim</MenuItem>
          <MenuItem value={'false'}>Não</MenuItem>
        </Select>
      </FormControl>
      
      <TextField
        label="Nome do Posto"
        value={formData.station_name || ''}
        onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
        fullWidth
      />
    </Stack>
  );

  const renderTransactionForm = () => (
    <Stack spacing={3}>
      <Alert severity="info" icon={<AttachMoney />}>
        IA detectou uma transação com {aiResponse.confidence}% de confiança
      </Alert>
      
      <TextField
        label="Valor (R$)"
        type="number"
        value={formData.amount || ''}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
        fullWidth
        required
        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
      />
      
      <FormControl fullWidth required>
        <InputLabel>Categoria</InputLabel>
        <Select
          value={formData.category || ''}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <MenuItem value="frete">Frete</MenuItem>
          <MenuItem value="adiantamento">Adiantamento</MenuItem>
          <MenuItem value="diesel">Diesel</MenuItem>
          <MenuItem value="arla">Arla 32</MenuItem>
          <MenuItem value="pedagio">Pedágio</MenuItem>
          <MenuItem value="chapa">Chapa</MenuItem>
          <MenuItem value="diaria">Diária</MenuItem>
          <MenuItem value="manutencao">Manutenção</MenuItem>
          <MenuItem value="quebra_caixa">Quebra de Caixa</MenuItem>
        </Select>
      </FormControl>
      
      <FormControl fullWidth required>
        <InputLabel>Tipo</InputLabel>
        <Select
          value={formData.type || ''}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <MenuItem value="income">Receita</MenuItem>
          <MenuItem value="expense">Despesa</MenuItem>
        </Select>
      </FormControl>
      
      <TextField
        label="Descrição"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        fullWidth
        multiline
        rows={2}
      />
    </Stack>
  );

  const renderInventoryForm = () => (
    <Stack spacing={3}>
      <Alert severity="info" icon={<Kitchen />}>
        IA detectou itens de inventário com {aiResponse.confidence}% de confiança
      </Alert>
      
      <Typography variant="subtitle1" gutterBottom>
        Itens detectados:
      </Typography>
      
      <Box>
        {formData.items?.map((item: string, index: number) => (
          <Chip
            key={index}
            label={item}
            sx={{ mr: 1, mb: 1 }}
            color="primary"
          />
        ))}
      </Box>
      
      {formData.missing_suggestion && formData.missing_suggestion.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Sugestões de itens faltantes:
          </Typography>
          <Box>
            {formData.missing_suggestion.map((item: string, index: number) => (
              <Chip
                key={index}
                label={item}
                sx={{ mr: 1, mb: 1 }}
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        </>
      )}
      
      <TextField
        label="Descrição adicional"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        fullWidth
        multiline
        rows={2}
      />
    </Stack>
  );

  const renderUnknownForm = () => (
    <Stack spacing={3}>
      <Alert severity="warning">
        IA não conseguiu identificar a intenção com segurança
      </Alert>
      
      <Typography variant="body1" gutterBottom>
        Por favor, descreva o que você gostaria de registrar:
      </Typography>
      
      <TextField
        label="Descrição"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        fullWidth
        multiline
        rows={3}
      />
    </Stack>
  );

  const renderForm = () => {
    switch (aiResponse.intent) {
      case 'fuel':
        return renderFuelForm();
      case 'transaction':
        return renderTransactionForm();
      case 'inventory':
        return renderInventoryForm();
      default:
        return renderUnknownForm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1E1E1E',
          color: '#FFFFFF'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {getIntentIcon()}
          <Typography variant="h6">{getIntentTitle()}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {renderForm()}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isProcessing}
          sx={{ color: '#B0B0B0' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={isProcessing || !formData || Object.keys(formData).length === 0}
          startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckCircle />}
          sx={{
            backgroundColor: '#ffc107',
            color: '#000',
            '&:hover': {
              backgroundColor: '#ffb300'
            }
          }}
        >
          {isProcessing ? 'Processando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIConfirmationModal;
