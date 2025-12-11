import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import {
  Add as AddIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Inventory as InventoryIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiClient } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { VisualInventoryItem } from '../../shared/types';

interface InventoryFormData {
  item_name: string;
  quantity: number;
  category: string;
  description?: string;
  photo_url?: string;
  ai_tags?: string[];
}

export default function VisualInventory() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();
  const [inventoryItems, setInventoryItems] = useState<VisualInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const [formData, setFormData] = useState<InventoryFormData>({
    item_name: '',
    quantity: 1,
    category: 'TOOLS',
    description: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiClient.getVisualInventoryItems();
      setInventoryItems(data);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      enqueueSnackbar('Erro ao carregar itens do inventário', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      processWithAI(file);
    }
  };

  const processWithAI = async (file: File) => {
    try {
      setAiProcessing(true);
      const aiResult = await apiClient.processImageWithAI(file);
      
      if (aiResult.item_name) {
        setFormData(prev => ({
          ...prev,
          item_name: aiResult.item_name,
          category: aiResult.category || 'TOOLS',
          description: aiResult.description || '',
          ai_tags: aiResult.tags || [],
        }));
        enqueueSnackbar('IA analisou a imagem com sucesso!', { variant: 'success' });
      } else {
        enqueueSnackbar('IA não conseguiu identificar o item. Por favor, preencha manualmente.', { variant: 'warning' });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      enqueueSnackbar('Erro ao processar imagem com IA', { variant: 'error' });
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.item_name || formData.quantity <= 0) {
      enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await apiClient.uploadPhoto(photoFile);
      }

      await apiClient.createVisualInventoryItem({
        ...formData,
        photo_url: photoUrl || undefined,
        ai_tags: formData.ai_tags || [],
      });

      enqueueSnackbar('Item criado com sucesso!', { variant: 'success' });
      setOpenDialog(false);
      resetForm();
      loadInventoryItems();
    } catch (error) {
      console.error('Error creating inventory item:', error);
      enqueueSnackbar('Erro ao criar item', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      quantity: 1,
      category: 'TOOLS',
      description: '',
      ai_tags: [],
    });
    setPhotoFile(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteVisualInventoryItem(id);
      enqueueSnackbar('Item excluído com sucesso!', { variant: 'success' });
      loadInventoryItems();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      enqueueSnackbar('Erro ao excluir item', { variant: 'error' });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      TOOLS: 'Ferramentas',
      SPARE_PARTS: 'Peças',
      SAFETY: 'Segurança',
      DOCUMENTS: 'Documentos',
      PERSONAL: 'Pessoal',
      FOOD: 'Alimentos',
      ELECTRONICS: 'Eletrônicos',
      OTHER: 'Outros',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string): ChipProps['color'] => {
    const colors: Record<string, ChipProps['color']> = {
      TOOLS: 'primary',
      SPARE_PARTS: 'secondary',
      SAFETY: 'error',
      DOCUMENTS: 'warning',
      PERSONAL: 'info',
      FOOD: 'success',
      ELECTRONICS: 'default',
      OTHER: 'default',
    };
    return colors[category] ?? 'default';
  };

  return (
    <Box sx={{ p: 3, pb: 12 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Inventário Visual
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registre itens com fotos e IA para identificação
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
                        Total de Itens
                      </Typography>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {inventoryItems.length}
                      </Typography>
                    </Stack>
                    <InventoryIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack>
                      <Typography variant="h6" color="text.secondary">
                        Itens com IA
                      </Typography>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {inventoryItems.filter(item => item.ai_tags && item.ai_tags.length > 0).length}
                      </Typography>
                    </Stack>
                    <TagIcon sx={{ fontSize: 48, color: 'info.main' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* Inventory Items List */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Itens Registrados
                </Typography>
                {inventoryItems.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Nenhum item encontrado. Registre seu primeiro item com foto!
                  </Alert>
                ) : (
                  <List>
                    {inventoryItems.map((item) => (
                      <ListItem key={item.id} divider>
                        <Avatar
                          src={item.photo_url}
                          alt={item.item_name}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          {!item.photo_url && <PhotoCameraIcon />}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {item.item_name}
                              </Typography>
                              <Chip 
                                label={getCategoryLabel(item.category)} 
                                size="small" 
                                color={getCategoryColor(item.category)}
                                variant="outlined"
                              />
                              <Chip 
                                label={`Qtd: ${item.quantity}`} 
                                size="small" 
                                variant="filled"
                                color="primary"
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack>
                              {item.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {item.description}
                                </Typography>
                              )}
                              {item.ai_tags && item.ai_tags.length > 0 && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {item.ai_tags.map((tag, index) => (
                                    <Chip 
                                      key={index}
                                      label={tag} 
                                      size="small" 
                                      variant="outlined"
                                      color="info"
                                      sx={{ mt: 0.5 }}
                                    />
                                  ))}
                                </Stack>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item.created_at).toLocaleDateString('pt-BR')}
                              </Typography>
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDelete(item.id)}
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

      {/* Add Item Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Registrar Novo Item
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CameraIcon />}
              fullWidth
              sx={{ height: 60 }}
              disabled={aiProcessing}
            >
              {photoFile ? `Foto: ${photoFile.name}` : 'Tirar Foto (Recomendado)'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                hidden
              />
            </Button>

            {aiProcessing && (
              <Alert severity="info">
                IA está analisando a imagem...
              </Alert>
            )}

            <TextField
              fullWidth
              label="Nome do Item"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Categoria"
              >
                <MenuItem value="TOOLS">Ferramentas</MenuItem>
                <MenuItem value="SPARE_PARTS">Peças</MenuItem>
                <MenuItem value="SAFETY">Segurança</MenuItem>
                <MenuItem value="DOCUMENTS">Documentos</MenuItem>
                <MenuItem value="PERSONAL">Pessoal</MenuItem>
                <MenuItem value="FOOD">Alimentos</MenuItem>
                <MenuItem value="ELECTRONICS">Eletrônicos</MenuItem>
                <MenuItem value="OTHER">Outros</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Quantidade"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
              required
            />

            <TextField
              fullWidth
              label="Descrição (Opcional)"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting || aiProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting || aiProcessing}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add-inventory"
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
