import assert from 'assert';
import { computeFuelAverageFromLogs } from '../services/fuelStats.ts';

export function runFuelStatsTests() {
  const logs = [
    { odometer: 100000, liters: 50, is_full_tank: true },
    { odometer: 100500, liters: 40, is_full_tank: true },
  ];

  const avg = computeFuelAverageFromLogs(logs);
  assert.ok(avg !== null, 'Average should be computed with two full tank logs');
  assert.strictEqual(Number(avg?.toFixed(2)), Number((500 / 40).toFixed(2)), 'Average must exclude Arla 32 from liters');

  const insufficient = computeFuelAverageFromLogs([logs[0]]);
  assert.strictEqual(insufficient, null, 'Average requires at least two full tank logs');
}
