export type FuelLogLike = {
  odometer: number;
  liters: number;
  is_full_tank: boolean;
  total_price?: number;
  fuel_type?: 'diesel' | 'arla32';
  created_at?: string;
};

export interface FuelStats {
  average_consumption: number | null;
  total_liters: number;
  total_spent: number;
  last_full_tank_odometer: number | null;
  last_full_tank_date: string | null;
  partial_fill_count: number;
  full_tank_count: number;
  average_price_per_liter: number | null;
}

export function computeFuelAverageFromLogs(fullTankLogs: FuelLogLike[]): number | null {
  if (fullTankLogs.length < 2) return null;
  const firstLog = fullTankLogs[0];
  const lastLog = fullTankLogs[fullTankLogs.length - 1];
  const distance = lastLog.odometer - firstLog.odometer;
  const totalFuelConsumed = fullTankLogs.slice(1).reduce((sum, log) => sum + Number(log.liters), 0);
  if (distance > 0 && totalFuelConsumed > 0) return distance / totalFuelConsumed;
  return null;
}

/**
 * Calcula estatísticas completas de combustível baseadas nos logs
 * Implementa a Regra do Tanque Cheio: só calcula média entre tanques cheios
 */
export function calculateFuelStats(logs: FuelLogLike[]): FuelStats {
  if (!logs || logs.length === 0) {
    return {
      average_consumption: null,
      total_liters: 0,
      total_spent: 0,
      last_full_tank_odometer: null,
      last_full_tank_date: null,
      partial_fill_count: 0,
      full_tank_count: 0,
      average_price_per_liter: null
    };
  }

  // Ordenar logs por odômetro (mais antigo primeiro)
  const sortedLogs = [...logs].sort((a, b) => a.odometer - b.odometer);
  
  // Separar logs por tipo
  const fullTankLogs = sortedLogs.filter(log => log.is_full_tank === true);
  const partialLogs = sortedLogs.filter(log => log.is_full_tank === false);
  
  // Calcular média de consumo (Regra do Tanque Cheio)
  const averageConsumption = computeFuelAverageFromLogs(fullTankLogs);
  
  // Calcular total de litros e valor gasto
  const totalLiters = sortedLogs.reduce((sum, log) => sum + log.liters, 0);
  const totalSpent = sortedLogs.reduce((sum, log) => sum + (log.total_price || 0), 0);
  
  // Último tanque cheio
  const lastFullTank = fullTankLogs[fullTankLogs.length - 1];
  const lastFullTankOdometer = lastFullTank?.odometer || null;
  const lastFullTankDate = lastFullTank?.created_at || null;
  
  // Contadores
  const partialFillCount = partialLogs.length;
  const fullTankCount = fullTankLogs.length;
  
  // Média de preço por litro
  const averagePricePerLiter = totalLiters > 0 ? totalSpent / totalLiters : null;
  
  return {
    average_consumption: averageConsumption,
    total_liters: totalLiters,
    total_spent: totalSpent,
    last_full_tank_odometer: lastFullTankOdometer,
    last_full_tank_date: lastFullTankDate,
    partial_fill_count: partialFillCount,
    full_tank_count: fullTankCount,
    average_price_per_liter: averagePricePerLiter
  };
}

/**
 * Valida se um novo log de combustível é válido para cálculo de média
 * Retorna true se for tanque cheio e odômetro maior que o anterior
 */
export function isValidForAverageCalculation(
  newLog: FuelLogLike,
  previousLogs: FuelLogLike[]
): boolean {
  if (!newLog.is_full_tank) {
    return false; // Só tanques cheios são válidos para cálculo de média
  }
  
  const lastLog = previousLogs[previousLogs.length - 1];
  if (!lastLog) {
    return true; // Primeiro log sempre é válido
  }
  
  // Odômetro deve ser maior que o anterior
  return newLog.odometer > lastLog.odometer;
}

/**
 * Sugere quando é hora de fazer um tanque cheio baseado nos últimos logs
 */
export function shouldSuggestFullTank(logs: FuelLogLike[]): boolean {
  const recentLogs = logs.slice(-5); // Últimos 5 logs
  const recentPartialFills = recentLogs.filter(log => !log.is_full_tank);
  
  // Se todos os últimos 3 abastecimentos foram parciais, sugerir tanque cheio
  return recentPartialFills.length >= 3;
}

