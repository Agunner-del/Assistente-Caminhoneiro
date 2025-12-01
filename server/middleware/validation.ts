import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// Schemas de validação para as rotas

export const fuelLogSchema = z.object({
  odometer: z.number().positive('Odômetro deve ser maior que zero'),
  liters: z.number().positive('Litros devem ser maior que zero'),
  total_price: z.number().positive('Preço total deve ser maior que zero'),
  is_full_tank: z.boolean().default(false),
  arla_liters: z.number().min(0).default(0),
  fuel_type: z.enum(['diesel', 'arla32']).default('diesel'),
  station_name: z.string().optional()
});

export const transactionSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  category: z.enum([
    'frete', 'adiantamento', 'saldo', 'diesel', 'arla', 'pedagio', 
    'chapa', 'diaria', 'quebra_caixa', 'manutencao'
  ]),
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  proof_url: z.string().url().optional(),
  status: z.enum(['pending', 'paid']).default('pending'),
  transaction_date: z.string().datetime().optional()
});

export const aiProcessingSchema = z.object({
  input_type: z.enum(['text', 'image']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  context: z.string().optional()
});

export const authLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export const authRegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  profile_type: z.enum(['TAC', 'CLT', 'COMISSIONADO'])
});

// Middleware de validação genérico
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

// Middleware de validação de query params
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

// Middleware de validação de parâmetros de rota
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}