const assert = require('assert');
const { env, withAuth } = require('../support/env');

const authOnly = env.jwt ? Scenario : Scenario.skip;
const adminOnly = env.adminJwt ? Scenario : Scenario.skip;

Feature('AI Service - Bo 8 chuc nang can kiem thu');

Scenario('@F35 ingestContext phai tu choi payload rong', async ({ I }) => {
  const response = await I.sendPostRequest('/api/ai/ingest-context', []);
  assert.strictEqual(response.status, 400);
  assert.ok(response.data.error);
});

Scenario('@F35 ingestContext phai tu choi payload lon hon 100 ban ghi', async ({ I }) => {
  const largePayload = Array.from({ length: 101 }, (_, idx) => ({
    studentId: idx + 1,
    attempt_id: idx + 1000,
    answers: []
  }));

  const response = await I.sendPostRequest('/api/ai/ingest-context', largePayload);
  assert.strictEqual(response.status, 400);
  assert.ok(response.data.error);
});

Scenario('@F35 ingestContext phai tu choi khi thieu studentId', async ({ I }) => {
  const payload = [
    {
      attempt_id: 1001,
      answers: []
    }
  ];

  const response = await I.sendPostRequest('/api/ai/ingest-context', payload);
  assert.strictEqual(response.status, 400);
  assert.ok(response.data.error);
});

Scenario('@F36 getResult phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}`);
  assert.ok([401, 403].includes(response.status));
});

authOnly('@F36 getResult voi JWT phai tra ve du lieu hoac 404', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}`);
  assert.ok([200, 404].includes(response.status));
});

authOnly('@F36 getResult phai kiem tra attemptId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/result/-1');
  assert.ok([400, 404, 500].includes(response.status));
});

Scenario('@F37 getDetailedResult phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}/details`);
  assert.ok([401, 403].includes(response.status));
});

authOnly('@F37 getDetailedResult voi JWT phai tra ve chi tiet hoac 404', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}/details`);
  assert.ok([200, 404].includes(response.status));
});

authOnly('@F37 getDetailedResult phai kiem tra attemptId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/result/-1/details');
  assert.ok([400, 404, 500].includes(response.status));
});

Scenario('@F38 getStudentStatistics phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/statistics/student/${env.studentId}`);
  assert.ok([401, 403].includes(response.status));
});

authOnly('@F38 getStudentStatistics phai kiem tra studentId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/statistics/student/-1');
  assert.strictEqual(response.status, 400);
});

adminOnly('@F38 getStudentStatistics voi token admin khong duoc tra ve unauthorized', async ({ I }) => {
  withAuth(I, env.adminJwt);
  const response = await I.sendGetRequest(`/api/ai/statistics/student/${env.studentId}`);
  assert.ok([200, 404].includes(response.status));
});

Scenario('@F39 getClassStatistics phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/statistics/class/${env.classId}`);
  assert.ok([401, 403].includes(response.status));
});

authOnly('@F39 getClassStatistics phai kiem tra classId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/statistics/class/-1');
  assert.strictEqual(response.status, 400);
});

adminOnly('@F39 getClassStatistics voi token admin khong duoc tra ve unauthorized', async ({ I }) => {
  withAuth(I, env.adminJwt);
  const response = await I.sendGetRequest(`/api/ai/statistics/class/${env.classId}`);
  assert.ok([200, 404].includes(response.status));
});

Scenario('@F40 getSystemStatistics phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest('/api/ai/statistics/system');
  assert.ok([401, 403].includes(response.status));
});

adminOnly('@F40 getSystemStatistics voi token admin phai tra ve du lieu', async ({ I }) => {
  withAuth(I, env.adminJwt);
  const response = await I.sendGetRequest('/api/ai/statistics/system');
  assert.strictEqual(response.status, 200);
});

Scenario('@F41 getInsight phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/insights/student/${env.studentId}`);
  assert.ok([401, 403].includes(response.status));
});

authOnly('@F41 getInsight phai kiem tra studentId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/insights/student/-1');
  assert.strictEqual(response.status, 400);
});

adminOnly('@F41 getInsight voi token admin khong duoc tra ve unauthorized', async ({ I }) => {
  withAuth(I, env.adminJwt);
  const response = await I.sendGetRequest(`/api/ai/insights/student/${env.studentId}`);
  assert.ok([200, 404].includes(response.status));
});

Scenario('@F42 getRecommendations phai tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/recommendations/${env.studentId}`);
  assert.ok([401, 403].includes(response.status));
});

authOnly('@F42 getRecommendations phai kiem tra studentId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/recommendations/-1');
  assert.strictEqual(response.status, 400);
});

adminOnly('@F42 getRecommendations voi token admin khong duoc tra ve unauthorized', async ({ I }) => {
  withAuth(I, env.adminJwt);
  const response = await I.sendGetRequest(`/api/ai/recommendations/${env.studentId}`);
  assert.ok([200, 404].includes(response.status));
});
