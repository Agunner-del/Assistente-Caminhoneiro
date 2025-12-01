import express from 'express';
import { supabase } from '../lib/clients.ts';
import { authenticateToken } from './auth.ts';
import { validateBody } from '../middleware/validation.ts';
import { fuelLogSchema } from '../middleware/validation.ts';
import { calculateFuelStats, shouldSuggestFullTank } from '../services/fuelStats.ts';
import type { FuelLog } from '../../shared/types.ts';

const router: express.Router = express.Router();

// Get all fuel logs for authenticated user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fuel logs:', error);
      return res.status(500).json({ error: 'Failed to fetch fuel logs' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching fuel logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new fuel log
router.post('/', authenticateToken, validateBody(fuelLogSchema), async (req: any, res) => {
  try {
    const { odometer, liters, total_price, is_full_tank, arla_liters, fuel_type, station_name } = req.body;

    const { data, error } = await supabase
      .from('fuel_logs')
      .insert([{
        user_id: req.user.userId,
        odometer,
        liters,
        total_price,
        is_full_tank,
        arla_liters,
        fuel_type,
        station_name
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating fuel log:', error);
      return res.status(500).json({ error: 'Failed to create fuel log' });
    }

    // Calculate fuel statistics if this is a full tank
    let fuelStats = null;
    if (is_full_tank) {
      fuelStats = await calculateFuelAverage(req.user.userId);
    }

    res.status(201).json({
      ...data,
      fuel_stats: fuelStats
    });
  } catch (error) {
    console.error('Error creating fuel log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate fuel average and statistics
export async function calculateFuelAverage(userId: string) {
  try {
    // Get all fuel logs for the user
    const { data: fuelLogs, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !fuelLogs || fuelLogs.length === 0) {
      console.log('No fuel logs found for user');
      return null;
    }

    // Calculate comprehensive fuel statistics
    const stats = calculateFuelStats(fuelLogs);
    
    // Log the calculated average
    if (stats.average_consumption) {
      console.log(`Fuel average calculated: ${stats.average_consumption.toFixed(2)} km/l`);
    }
    
    // Check if we should suggest a full tank
    if (shouldSuggestFullTank(fuelLogs)) {
      console.log('Suggestion: Time for a full tank for accurate average calculation');
    }
    
    return stats;
  } catch (error) {
    console.error('Error calculating fuel average:', error);
    return null;
  }
}

export function computeFuelAverageFromLogs(fullTankLogs: FuelLog[]): number | null {
  if (fullTankLogs.length < 2) return null;
  const firstLog = fullTankLogs[0];
  const lastLog = fullTankLogs[fullTankLogs.length - 1];
  const distance = lastLog.odometer - firstLog.odometer;
  const totalFuelConsumed = fullTankLogs.slice(1).reduce((sum, log) => sum + parseFloat(String(log.liters)), 0);
  if (distance > 0 && totalFuelConsumed > 0) return distance / totalFuelConsumed;
  return null;
}

// Get fuel statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get all fuel logs for the current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data: fuelLogs, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-31`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching fuel stats:', error);
      return res.status(500).json({ error: 'Failed to fetch fuel statistics' });
    }

    // Calculate comprehensive fuel statistics using the new service
    const stats = calculateFuelStats(fuelLogs);
    
    // Check if we should suggest a full tank
    const suggestFullTank = shouldSuggestFullTank(fuelLogs);

    res.json({
      ...stats,
      logs_count: fuelLogs.length,
      suggest_full_tank: suggestFullTank,
      period: currentMonth
    });
  } catch (error) {
    console.error('Error calculating fuel stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
