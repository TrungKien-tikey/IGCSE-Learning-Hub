const assert = require('assert');

Feature('AI Service - Kiem tra suc khoe dich vu');

Scenario('GET /api/ai/health phai tra ve trang thai UP', async ({ I }) => {
  const response = await I.sendGetRequest('/api/ai/health');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.status, 'UP');
});
