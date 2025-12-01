import React, { useRef, useState } from 'react';
import { Fab, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Card, CardMedia, Zoom } from '@mui/material';
import { Add, CameraAlt, Mic } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface ActionModalButtonProps {
  onImageSelected: (imageData: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

const ActionModalButton: React.FC<ActionModalButtonProps> = ({
  onImageSelected,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor, selecione uma imagem válida', { variant: 'error' });
      return;
    }
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processImage(file);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openCamera = () => cameraInputRef.current?.click();
  const openGallery = () => fileInputRef.current?.click();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 96,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <Zoom in>
        <Fab
          sx={{
            width: 72,
            height: 72,
            backgroundColor: '#ffc107',
            color: '#000',
            '&:hover': { backgroundColor: '#ffb300' },
            boxShadow: '0 4px 20px rgba(255, 193, 7, 0.4)'
          }}
          onClick={() => setOpen(true)}
          disabled={disabled || isProcessing}
        >
          <Add sx={{ fontSize: 32 }} />
        </Fab>
      </Zoom>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', color: '#FFFFFF' } }}
      >
        <DialogTitle>Escolha uma ação</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CameraAlt />}
              onClick={openCamera}
              sx={{
                height: 60,
                backgroundColor: '#4CAF50',
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#45a049' }
              }}
            >
              Abrir câmera
            </Button>
            <Button
              variant="contained"
              startIcon={<CameraAlt />}
              onClick={openGallery}
              sx={{
                height: 60,
                backgroundColor: '#2196F3',
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#1976D2' }
              }}
            >
              Selecionar da galeria
            </Button>
            <Button
              variant="contained"
              startIcon={<Mic />}
              onClick={() => {
                setOpen(false);
                onStartRecording();
              }}
              sx={{
                height: 60,
                backgroundColor: '#f44336',
                color: '#FFFFFF',
                '&:hover': { backgroundColor: '#d32f2f' }
              }}
            >
              Gravar áudio
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: '#B0B0B0' }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Dialog
        open={previewOpen}
        onClose={handleCancelImage}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', color: '#FFFFFF' } }}
      >
        <DialogTitle>Confirmar Imagem</DialogTitle>
        <DialogContent>
          {previewImage && (
            <Card sx={{ backgroundColor: '#121212' }}>
              <CardMedia
                component="img"
                image={previewImage}
                alt="Preview"
                sx={{ maxHeight: 300, objectFit: 'contain', backgroundColor: '#121212' }}
              />
            </Card>
          )}
          <Typography variant="body2" color="#B0B0B0" sx={{ mt: 2, textAlign: 'center' }}>
            A IA analisará esta imagem para identificar itens de inventário
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImage} sx={{ color: '#B0B0B0' }}>Cancelar</Button>
          <Button
            onClick={handleConfirmImage}
            variant="contained"
            sx={{ backgroundColor: '#4CAF50', color: '#FFFFFF', '&:hover': { backgroundColor: '#45a049' } }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActionModalButton;
