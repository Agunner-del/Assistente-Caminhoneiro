import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import type { AIProcessingResponse } from '../../shared/types';

interface UseAIProcessingOptions {
  onSuccess?: (response: AIProcessingResponse) => void;
  onError?: (error: string) => void;
}

interface UseAIProcessingReturn {
  processText: (text: string, context?: string) => Promise<AIProcessingResponse | null>;
  processImage: (imageData: string, context?: string) => Promise<AIProcessingResponse | null>;
  isProcessing: boolean;
  error: string | null;
}

export const useAIProcessing = (options: UseAIProcessingOptions = {}): UseAIProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const processRequest = useCallback(async (
    inputType: 'text' | 'image',
    content: string,
    context?: string
  ): Promise<AIProcessingResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input_type: inputType,
          content,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao processar com IA');
      }

      const result: AIProcessingResponse = await response.json();
      
      // Validar confiança mínima
      if (result.confidence < 0.7) {
        enqueueSnackbar('IA não conseguiu identificar com segurança. Verifique os dados.', { variant: 'warning' });
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar com IA';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [enqueueSnackbar, options]);

  const processText = useCallback(async (text: string, context?: string): Promise<AIProcessingResponse | null> => {
    return processRequest('text', text, context);
  }, [processRequest]);

  const processImage = useCallback(async (imageData: string, context?: string): Promise<AIProcessingResponse | null> => {
    return processRequest('image', imageData, context);
  }, [processRequest]);

  return {
    processText,
    processImage,
    isProcessing,
    error
  };
};
