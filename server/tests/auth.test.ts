import assert from 'assert';
import { authenticateToken } from '../routes/auth.ts';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.payload = undefined;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (obj: any) => { res.payload = obj; return res; };
  return res;
}

export function runAuthTests() {
  const reqNoToken: any = { headers: {} };
  const resNoToken = createMockRes();
  let nextCalled = false;
  authenticateToken(reqNoToken, resNoToken, () => { nextCalled = true; });
  assert.strictEqual(resNoToken.statusCode, 401, 'Missing token should return 401');
  assert.strictEqual(nextCalled, false, 'Next should not be called on missing token');
}
