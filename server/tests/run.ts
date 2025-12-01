import { runFuelStatsTests } from './fuelStats.test.ts';
import { runAuthTests } from './auth.test.ts';

function runAll() {
  const results: { name: string; success: boolean; error?: unknown }[] = [];

  const tests: { name: string; fn: () => void }[] = [
    { name: 'Fuel stats average excludes Arla 32', fn: runFuelStatsTests },
    { name: 'Auth middleware rejects missing token', fn: runAuthTests },
  ];

  for (const t of tests) {
    try {
      t.fn();
      results.push({ name: t.name, success: true });
    } catch (e) {
      results.push({ name: t.name, success: false, error: e });
    }
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  console.log(JSON.stringify({ passed, failed, results }, null, 2));
  if (failed > 0) process.exit(1);
}

runAll();
