import express from 'express';
import { genAI } from '../lib/clients.ts';
import { authenticateToken } from './auth.ts';
import { validateBody } from '../middleware/validation.ts';
import { aiProcessingSchema } from '../middleware/validation.ts';
import type { AIProcessingRequest, AIProcessingResponse, AIUnknownResponse, TransactionCategory, TransactionType } from '../../shared/types.ts';

const router: express.Router = express.Router();

// Process text or image with AI using Gemini 2.5 Flash Lite
router.post('/process', authenticateToken, validateBody(aiProcessingSchema), async (req: any, res) => {
  try {
    const { input_type, content, context }: AIProcessingRequest = req.body;

    // Usar Gemini 2.5 Flash Lite conforme especificado
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    let result: AIProcessingResponse;

    if (input_type === 'text') {
      // Process text for expense categorization with structured response
      const prompt = `Você é um assistente financeiro especializado em logística brasileira.
Analise o seguinte texto e extraia informações estruturadas para caminhoneiros:

Texto: "${content}"
${context ? `Contexto: ${context}` : ''}

IMPORTANTE: Responda APENAS com um objeto JSON válido no seguinte formato:
{
  "intent": "fuel" | "transaction" | "inventory" | "unknown",
  "confidence": 0.0-1.0,
  "data": {
    "category": "frete|adiantamento|saldo|diesel|arla|pedagio|chapa|diaria|quebra_caixa|manutencao",
    "amount": número com o valor em reais (se encontrado),
    "type": "income|expense",
    "description": "descrição curta da transação",
    "odometer": número do odômetro (se mencionado),
    "liters": quantidade de litros (para combustível),
    "total_price": valor total pago (para combustível),
    "is_full_tank": true/false (para combustível),
    "fuel_type": "diesel|arla32" (para combustível),
    "station_name": "nome do posto" (se mencionado),
    "items": ["item1", "item2"] (para inventário),
    "missing_suggestion": ["sugestão1", "sugestão2"] (para inventário)
  },
  "suggested_action": "create_fuel_record|create_transaction|update_inventory|manual_input"
}

Regras de classificação:
- "fuel": quando mencionar abastecimento, diesel, arla, litros, posto
- "transaction": quando mencionar dinheiro, pagamento, recebimento, despesa
- "inventory": quando mencionar itens, compras, alimentos, despensa
- "unknown": quando não conseguir identificar a intenção

Para valores monetários, procure por: R$ 850,50 ou 850,50 ou "mil reais"
Para odômetro, procure por: "125.430 km" ou "125430 km"
Para litros: "250 litros" ou "250L"

Se não conseguir identificar com alta confiança (>0.7), retorne "unknown".`;

      const aiResult = await model.generateContent(prompt);
      const response = await aiResult.response;
      const text = response.text();
      
      try {
        // Extract and parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = JSON.parse(text);
        }
        
        // Validate confidence and set unknown if too low
        if (!result.confidence || result.confidence < 0.7) {
          result = createUnknownResponse('Confiança insuficiente na classificação');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to manual parsing
        result = parseTextResponse(content);
      }

    } else if (input_type === 'image') {
      // Process image for visual inventory with structured response
      const imageData = content; // Base64 image data
      
      const prompt = `Você é um assistente de inventário para caminhoneiros.
Analise esta imagem e identifique itens relevantes para uma cozinha de caminhão ou despensa.

IMPORTANTE: Responda APENAS com um objeto JSON válido no seguinte formato:
{
  "intent": "inventory",
  "confidence": 0.0-1.0,
  "data": {
    "items": ["arroz", "feijão", "óleo", "sal", "café", "açúcar", "macarrão", "leite"],
    "missing_suggestion": ["item_faltante1", "item_faltante2"],
    "description": "descrição do que foi identificado na imagem"
  },
  "suggested_action": "update_inventory"
}

As tags devem ser itens comuns de cozinha brasileira.
Sugira itens essenciais que estão faltando baseado no que foi detectado.`;

      // Convert base64 to image for AI processing
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: 'image/jpeg'
        }
      };

      const aiResult = await model.generateContent([prompt, imagePart]);
      const response = await aiResult.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = JSON.parse(text);
        }
        
        // Validate confidence
        if (!result.confidence || result.confidence < 0.7) {
          result = createUnknownResponse('Confiança insuficiente no reconhecimento de imagem');
        }
      } catch (parseError) {
        console.error('Error parsing AI image response:', parseError);
        result = parseImageResponse(imageData);
      }
    } else {
      return res.status(400).json({ error: 'Invalid input_type. Must be "text" or "image"' });
    }

    // Add model version to response
    result.model_version = 'gemini-2.5-flash-lite';
    
    res.json(result);
  } catch (error) {
    console.error('AI processing error:', error);
    
    // Return structured error response
    const errorResponse: AIUnknownResponse = {
      intent: 'unknown',
      confidence: 0,
      data: {},
      suggested_action: 'manual_input',
      model_version: 'gemini-2.5-flash-lite',
      fallback_reason: 'Erro no processamento da IA'
    };
    
    res.status(500).json(errorResponse);
  }
});

// Helper function to create unknown response
function createUnknownResponse(reason: string): AIUnknownResponse {
  return {
    intent: 'unknown',
    confidence: 0,
    data: {},
    suggested_action: 'manual_input',
    model_version: 'gemini-2.5-flash-lite',
    fallback_reason: reason
  };
}

// Enhanced helper function to parse text responses with structured format
function parseTextResponse(text: string): AIProcessingResponse {
  const lowerText = text.toLowerCase();
  
  // Determine intent with confidence
  let intent: AIProcessingResponse['intent'] = 'unknown';
  let confidence = 0.3;
  
  // Fuel-related keywords
  if (lowerText.match(/(diesel|arla|abastecimento|litros|posto|combustível)/)) {
    intent = 'fuel';
    confidence = 0.8;
  }
  // Transaction-related keywords  
  else if (lowerText.match(/(dinheiro|pagamento|recebimento|despesa|frete|adiantamento)/)) {
    intent = 'transaction';
    confidence = 0.8;
  }
  // Inventory-related keywords
  else if (lowerText.match(/(compra|alimento|despensa|cozinha|item)/)) {
    intent = 'inventory';
    confidence = 0.7;
  }
  
  const data: AIProcessingResponse['data'] = {};
  let suggested_action: AIProcessingResponse['suggested_action'] = 'manual_input';
  
  if (intent === 'fuel') {
    // Parse fuel-specific data
    const litersMatch = text.match(/(\d+(?:\.\d{3})*(?:,\d{1,2})?)\s*litros?/i);
    if (litersMatch) {
      data.liters = parseFloat(litersMatch[1].replace(/\./g, '').replace(',', '.'));
    }
    
    const priceMatch = text.match(/R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/);
    if (priceMatch) {
      data.total_price = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
    }
    
    const odometerMatch = text.match(/(\d+(?:\.\d{3})*)\s*km/i);
    if (odometerMatch) {
      data.odometer = parseInt(odometerMatch[1].replace(/\./g, ''));
    }
    
    data.fuel_type = lowerText.includes('arla') ? 'arla32' : 'diesel';
    data.is_full_tank = lowerText.includes('cheio') || lowerText.includes('completo');
    
    suggested_action = 'create_fuel_record';
  } else if (intent === 'transaction') {
    // Parse transaction-specific data
    const amountMatch = text.match(/R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/);
    if (amountMatch) {
      data.amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));
    }
    
    // Category detection
    if (lowerText.includes('frete')) data.category = 'frete';
    else if (lowerText.includes('adiantamento')) data.category = 'adiantamento';
    else if (lowerText.includes('diesel')) data.category = 'diesel';
    else if (lowerText.includes('pedágio') || lowerText.includes('pedagio')) data.category = 'pedagio';
    else if (lowerText.includes('chapa')) data.category = 'chapa';
    else if (lowerText.includes('diária') || lowerText.includes('diaria')) data.category = 'diaria';
    
    data.type = (lowerText.includes('recebi') || lowerText.includes('ganhei') || lowerText.includes('frete')) ? 'income' : 'expense';
    data.description = text.slice(0, 100);
    
    suggested_action = 'create_transaction';
  }
  
  return {
    intent,
    confidence,
    data,
    suggested_action,
    model_version: 'gemini-2.5-flash-lite'
  };
}

// Enhanced helper function to parse image responses
function parseImageResponse(imageData: string): AIProcessingResponse {
  // Fallback for image processing errors
  return {
    intent: 'inventory',
    confidence: 0.5,
    data: {
      items: ['item_detectado'],
      missing_suggestion: ['arroz', 'feijão', 'óleo', 'sal'],
      description: 'Imagem processada com fallback devido a erro de análise'
    },
    suggested_action: 'update_inventory',
    model_version: 'gemini-2.5-flash-lite'
  };
}

export default router;
