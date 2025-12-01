import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  LocalGasStation,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Kitchen,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AIInputButton, { AIInputButtonHandle } from '../components/AIInputButton';
import ActionModalButton from '../components/ActionModalButton';
import AIConfirmationModal from '../components/AIConfirmationModal';
import FuelStatsCard from '../components/FuelStatsCard';
import { useAIProcessing } from '../hooks/useAIProcessing';
import type { AIProcessingResponse, DashboardStats } from '../../shared/types';

const Dashboard: React.FC = () => {
  const storedUser = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();
  const userProfile = {
    id: storedUser?.id || 'unknown',
    profile_type: (storedUser?.profile_type as 'TAC' | 'CLT' | 'COMISSIONADO') || 'TAC',
    name: storedUser?.email || 'Motorista',
  };
  const [isRecording, setIsRecording] = useState(false);
  const aiButtonRef = React.useRef<AIInputButtonHandle>(null);
  const [aiResponse, setAiResponse] = useState<AIProcessingResponse | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  const { enqueueSnackbar } = useSnackbar();
  
  const { processText, processImage, isProcessing: aiIsProcessing } = useAIProcessing({
    onSuccess: (response) => {
      setAiResponse(response);
      setShowConfirmation(true);
      enqueueSnackbar('IA processou sua entrada com sucesso!', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(`Erro na IA: ${error}`, { variant: 'error' });
    }
  });

  const handleTranscriptionComplete = useCallback(async (text: string) => {
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      await processText(text, `Perfil do usuário: ${userProfile.profile_type}`);
    } catch (error) {
      console.error('Error processing transcription:', error);
      enqueueSnackbar('Erro ao processar transcrição', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [processText, userProfile.profile_type, enqueueSnackbar]);

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    enqueueSnackbar('Gravação iniciada... Fale agora!', { variant: 'info' });
  }, [enqueueSnackbar]);

  const handleRecordingStop = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleImageSelected = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      await processImage(imageData, `Perfil do usuário: ${userProfile.profile_type}`);
    } catch (error) {
      console.error('Error processing image:', error);
      enqueueSnackbar('Erro ao processar imagem', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [processImage, userProfile.profile_type, enqueueSnackbar]);

  const handleConfirmAI = useCallback(async (data: any) => {
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      let endpoint = '';
      let payload = {};

      switch (data.intent) {
        case 'fuel':
          endpoint = '/api/fuel-logs';
          payload = {
            odometer: data.odometer,
            liters: data.liters,
            total_price: data.total_price,
            is_full_tank: data.is_full_tank,
            arla_liters: data.arla_liters || 0,
            fuel_type: data.fuel_type || 'diesel',
            station_name: data.station_name || ''
          };
          break;

        case 'transaction':
          endpoint = '/api/transactions';
          payload = {
            amount: data.amount,
            category: data.category,
            type: data.type,
            description: data.description || '',
            status: 'pending'
          };
          break;

        default:
          enqueueSnackbar('Tipo de dado não suportado ainda', { variant: 'warning' });
          setShowConfirmation(false);
          setIsProcessing(false);
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar dados');
      }

      const result = await response.json();
      
      setShowConfirmation(false);
      setAiResponse(null);
      
      enqueueSnackbar('Dados salvos com sucesso!', { variant: 'success' });
      
      // Recarregar estatísticas
      loadDashboardStats();

    } catch (error) {
      console.error('Error confirming AI data:', error);
      enqueueSnackbar('Erro ao salvar dados', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [enqueueSnackbar]);

  const loadDashboardStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/transactions/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }, []);

  // Carregar estatísticas ao montar o componente
  useState(() => {
    loadDashboardStats();
  });

  const getProfileLabel = () => {
    switch (userProfile.profile_type) {
      case 'TAC':
        return 'Transportador Autônomo';
      case 'CLT':
        return 'Motorista CLT';
      case 'COMISSIONADO':
        return 'Motorista Comissionado';
      default:
        return 'Motorista';
    }
  };

  const renderTACMetrics = () => (
    <>
      <Grid item xs={12} md={6}>
        <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Saldo a Receber</Typography>
            </Box>
            <Typography variant="h4" color="#FFC107">
              R$ {stats?.balance_receivable?.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Lucro do Mês</Typography>
            </Box>
            <Typography variant="h4" color={stats?.profit >= 0 ? '#4CAF50' : '#F44336'}>
              R$ {stats?.profit?.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </>
  );

  const renderCLTMetrics = () => (
    <>
      <Grid item xs={12} md={6}>
        <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Diária Disponível</Typography>
            </Box>
            <Typography variant="h4" color="#FFC107">
              R$ {stats?.daily_allowance_available?.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingDown color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Diária Utilizada</Typography>
            </Box>
            <Typography variant="h4" color="#F44336">
              R$ {stats?.daily_allowance_used?.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </>
  );

  const renderComissionadoMetrics = () => (
    <>
      <Grid item xs={12} md={6}>
        <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AttachMoney color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Base de Comissão</Typography>
            </Box>
            <Typography variant="h4" color="#FFC107">
              R$ {stats?.commission_base?.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Lucro do Mês</Typography>
            </Box>
            <Typography variant="h4" color={stats?.profit >= 0 ? '#4CAF50' : '#F44336'}>
              R$ {stats?.profit?.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom color="#FFFFFF">
          Olá, {userProfile.name}!
        </Typography>
        <Typography variant="subtitle1" color="#B0B0B0">
          {getProfileLabel()}
        </Typography>
      </Box>

      {/* Métricas do Dashboard */}
      <Grid container spacing={3} mb={4}>
        {/* Métricas gerais */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total de Receitas</Typography>
              </Box>
              <Typography variant="h4" color="#4CAF50">
                R$ {stats?.total_income?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingDown color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Total de Despesas</Typography>
              </Box>
              <Typography variant="h4" color="#F44336">
                R$ {stats?.total_expenses?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Métricas específicas por perfil */}
        {userProfile.profile_type === 'TAC' && renderTACMetrics()}
        {userProfile.profile_type === 'CLT' && renderCLTMetrics()}
        {userProfile.profile_type === 'COMISSIONADO' && renderComissionadoMetrics()}
      </Grid>

      {/* Estatísticas de Combustível */}
      <Box mb={4}>
        <FuelStatsCard userId={userProfile.id} />
      </Box>

      {/* Lista de ações rápidas */}
      <Card sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ações Rápidas
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <LocalGasStation color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Registrar Abastecimento"
                secondary="Use o botão de microfone e diga: 'Abasteci 250 litros de diesel'"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AttachMoney color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Registrar Despesa"
                secondary="Diga: 'Paguei R$ 150 de pedágio'"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Kitchen color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Atualizar Inventário"
                secondary="Tire uma foto da sua despensa"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <AIInputButton
        ref={aiButtonRef}
        onTranscriptionComplete={handleTranscriptionComplete}
        onRecordingStart={handleRecordingStart}
        onRecordingStop={handleRecordingStop}
        disabled={isProcessing || aiIsProcessing}
        showButton={false}
      />

      <ActionModalButton
        onImageSelected={handleImageSelected}
        onStartRecording={() => aiButtonRef.current?.start()}
        onStopRecording={() => aiButtonRef.current?.stop()}
        disabled={isProcessing || aiIsProcessing}
      />

      {/* AI Confirmation Modal */}
      <AIConfirmationModal
        open={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setAiResponse(null);
        }}
        aiResponse={aiResponse}
        onConfirm={handleConfirmAI}
        isProcessing={isProcessing}
      />
    </Container>
  );
};

export default Dashboard;
