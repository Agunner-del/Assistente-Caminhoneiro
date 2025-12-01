import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// Configuração do Helmet para headers de segurança
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.supabase.io", "https://*.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Desabilitado para permitir imagens de diferentes origens
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting para prevenir ataques DDoS e brute force
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: {
    error: 'Muitas requisições',
    message: 'Por favor, aguarde antes de fazer novas requisições'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Rate limiting mais estrito para endpoints de autenticação
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login',
    message: 'Por segurança, aguarde antes de tentar novamente'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Não contar requisições bem-sucedidas
});

// Rate limiting para API de IA (mais restritivo devido aos custos)
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requisições por minuto
  message: {
    error: 'Limite de IA excedido',
    message: 'Aguarde um momento antes de usar a IA novamente'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware para validar Content-Type
export function validateContentType(req: Request, res: Response, next: Function) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'Content-Type deve ser application/json'
      });
    }
  }
  next();
}

// Middleware para sanitização básica de entrada
export function sanitizeInput(req: Request, res: Response, next: Function) {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remover caracteres potencialmente perigosos
        req.body[key] = req.body[key].replace(/[<>\"'&]/g, '');
      }
    });
  }
  next();
}