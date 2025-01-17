const request = require('supertest');
const { app, server } = require('../server');

describe('API Tests', () => {
 // 添加關閉服務器
 afterAll(done => {
   server.close(done);
 });

 // 測試成功訪問 health 端點
 test('GET /health should return 200 with correct API key', async () => {
   const response = await request(app)
     .get('/health')
     .set('X-API-Keyf', 'iam-roy');
   
   expect(response.status).toBe(200);
   expect(response.text).toBe('我還活著');
 });

 // 測試未授權訪問 health 端點
 test('GET /health should return 401 with wrong API key', async () => {
   const response = await request(app)
     .get('/health')
     .set('X-API-Keyf', 'wrong-key');
   
   expect(response.status).toBe(401);
   expect(response.body).toEqual({ error: '未經授權的訪問' });
 });

 // 測試缺少 API key
 test('GET /health should return 401 without API key', async () => {
   const response = await request(app)
     .get('/health');
   
   expect(response.status).toBe(401);
 });
});