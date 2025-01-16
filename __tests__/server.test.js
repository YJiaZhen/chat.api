const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  // 測試 health check 端點
  test('GET /health should return 200 with correct API key', async () => {
    const response = await request(app)
      .get('/health')
      .set('X-API-Keyf', 'iam-roy');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('我還活著');
  });

  // 測試未授權的訪問
  test('GET /health should return 401 with wrong API key', async () => {
    const response = await request(app)
      .get('/health')
      .set('X-API-Keyf', 'wrong-key');
    
    expect(response.status).toBe(401);
  });
});