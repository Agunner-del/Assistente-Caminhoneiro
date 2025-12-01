import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Fab, Box, Typography, CircularProgress, Zoom } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import PulseAnimation from './PulseAnimation';

interface AIInputButtonProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  showButton?: boolean;
}

export interface AIInputButtonHandle {
  start: () => void;
  stop: () => void;
}

const AIInputButton = forwardRef<AIInputButtonHandle, AIInputButtonProps>(({ 
  onTranscriptionComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  showButton = true
}, ref) => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Processar transcrição completa
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscriptionComplete(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, onTranscriptionComplete, resetTranscript]);

  // Mostrar mensagens de erro
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  const handleClick = () => {
    if (disabled || !isSupported) return;

    if (isListening) {
      stopListening();
      if (onRecordingStop) onRecordingStop();
    } else {
      resetTranscript();
      startListening();
      if (onRecordingStart) onRecordingStart();
      enqueueSnackbar('Gravando... Fale agora!', { variant: 'info' });
    }
  };

  useImperativeHandle(ref, () => ({
    start: () => {
      if (disabled || !isSupported) return;
      if (!isListening) {
        resetTranscript();
        startListening();
        if (onRecordingStart) onRecordingStart();
        enqueueSnackbar('Gravando... Fale agora!', { variant: 'info' });
      }
    },
    stop: () => {
      if (isListening) {
        stopListening();
        if (onRecordingStop) onRecordingStop();
      }
    }
  }));

  if (!showButton) {
    return null;
  }

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
      <Zoom in={true}>
        <PulseAnimation isActive={isListening} color="#f44336" size={72}>
          <Fab
            onClick={handleClick}
            disabled={disabled || !isSupported}
            sx={{
              width: 72,
              height: 72,
              backgroundColor: isListening ? '#f44336' : '#ffc107', // Vermelho quando gravando, âmbar quando parado
              color: '#000',
              '&:hover': {
                backgroundColor: isListening ? '#d32f2f' : '#ffb300',
              },
              boxShadow: isListening 
                ? '0 0 0 4px rgba(244, 67, 54, 0.3), 0 4px 20px rgba(244, 67, 54, 0.4)'
                : '0 4px 20px rgba(255, 193, 7, 0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            {isListening ? (
              <MicOff sx={{ fontSize: 32 }} />
            ) : (
              <Mic sx={{ fontSize: 32 }} />
            )}
          </Fab>
        </PulseAnimation>
      </Zoom>
      
      {isListening && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f44336',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 12,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            GRAVANDO
          </Typography>
        </Box>
      )}

      {/* Mostrar transcrição interina */}
      {interimTranscript && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            fontSize: '0.875rem',
            maxWidth: 300,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            {interimTranscript}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export default AIInputButton;
