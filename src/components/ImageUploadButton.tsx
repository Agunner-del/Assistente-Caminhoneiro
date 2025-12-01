import React, { useRef, useState } from 'react';
import {
  Fab,
  Box,
  Typography,
  Zoom,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardMedia,
  Fade
} from '@mui/material';
import {
  CameraAlt,
  Close
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import PulseAnimation from './PulseAnimation';

interface ImageUploadButtonProps {
  onImageSelected: (imageData: string) => void;
  disabled?: boolean;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageSelected,
  disabled = false
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor, selecione uma imagem válida', { variant: 'error' });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Imagem muito grande. Máximo 5MB', { variant: 'error' });
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
      setPreviewOpen(true);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      enqueueSnackbar('Erro ao processar imagem', { variant: 'error' });
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmImage = () => {
    if (previewImage) {
      onImageSelected(previewImage);
      setPreviewOpen(false);
      setPreviewImage(null);
      enqueueSnackbar('Imagem selecionada com sucesso!', { variant: 'success' });
    }
  };

  const handleCancelImage = () => {
    setPreviewOpen(false);
    setPreviewImage(null);
    // Limpar inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 184, // Above AIInputButton (96px + 72px + 16px)
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        <Zoom in={true}>
          <Box display="flex" gap={2}>
            {/* Botão de Câmera */}
            <PulseAnimation isActive={isProcessing} color="#4CAF50" size={64}>
              <Fab
                onClick={openCamera}
                disabled={disabled || isProcessing}
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#4CAF50',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#45a049',
                  },
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.4)',
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <CameraAlt sx={{ fontSize: 28 }} />
                )}
              </Fab>
            </PulseAnimation>

            {/* Botão de Galeria */}
            <Fab
              onClick={openGallery}
              disabled={disabled || isProcessing}
              sx={{
                width: 64,
                height: 64,
                backgroundColor: '#2196F3',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#1976D2',
                },
                boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
              }}
            >
              <CameraAlt sx={{ fontSize: 28 }} />
            </Fab>
          </Box>
        </Zoom>
      </Box>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Input de câmera oculto */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Modal de Preview */}
      <Dialog
        open={previewOpen}
        onClose={handleCancelImage}
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Confirmar Imagem</Typography>
            <Button
              onClick={handleCancelImage}
              sx={{ color: '#B0B0B0', minWidth: 'auto' }}
            >
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {previewImage && (
            <Card sx={{ backgroundColor: '#121212' }}>
              <CardMedia
                component="img"
                image={previewImage}
                alt="Preview"
                sx={{
                  maxHeight: 300,
                  objectFit: 'contain',
                  backgroundColor: '#121212'
                }}
              />
            </Card>
          )}
          
          <Typography variant="body2" color="#B0B0B0" sx={{ mt: 2, textAlign: 'center' }}>
            A IA analisará esta imagem para identificar itens de inventário
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCancelImage}
            sx={{ color: '#B0B0B0' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmImage}
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#45a049'
              }
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageUploadButton;