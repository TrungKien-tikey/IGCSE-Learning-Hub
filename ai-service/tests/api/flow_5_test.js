const assert = require('assert');
const { env, withAuth } = require('../support/env');

const authOnly = env.jwt ? Scenario : Scenario.skip;

Feature('AI Service - Luong 5 Cham diem va lay ket qua');

Scenario('@Flow5-F1 ingestContext tu choi payload rong', async ({ I }) => {
  const response = await I.sendPostRequest('/api/ai/ingest-context', []);

  assert.strictEqual(response.status, 400);
  assert.ok(response.data.error);
});

Scenario('@Flow5-F1 ingestContext tu choi payload vuot qua 100 records', async ({ I }) => {
  const largePayload = Array.from({ length: 101 }, (_, idx) => ({
    studentId: idx + 1,
    attempt_id: idx + 100000,
    answers: []
  }));

  const response = await I.sendPostRequest('/api/ai/ingest-context', largePayload);

  assert.strictEqual(response.status, 400);
  assert.ok(response.data.error);
});

Scenario('@Flow5-F1 ingestContext tu choi khi thieu studentId', async ({ I }) => {
  const payload = [
    {
      attempt_id: 200001,
      answers: []
    }
  ];

  const response = await I.sendPostRequest('/api/ai/ingest-context', payload);

  assert.strictEqual(response.status, 400);
  assert.ok(response.data.error);
});

Scenario('@Flow5-F1 ingestContext chap nhan payload hop le va tra ve ACCEPTED', async ({ I }) => {
  const payload = [
    {
      studentId: env.studentId,
      attempt_id: Date.now(),
      exam_id: env.examId,
      answers: [
        {
          questionNumber: 1,
          selectedAnswer: 'A'
        }
      ]
    }
  ];

  const response = await I.sendPostRequest('/api/ai/ingest-context', payload);

  assert.strictEqual(response.status, 202);
  assert.strictEqual(response.data.status, 'ACCEPTED');
});

Scenario('@Flow5-F2 getResult tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}`);

  assert.ok([401, 403].includes(response.status));
});

authOnly('@Flow5-F2 getResult voi JWT tra ve du lieu hoac 404', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}`);

  assert.ok([200, 404].includes(response.status));
});

authOnly('@Flow5-F2 getResult kiem tra attemptId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/result/-1');

  assert.ok([400, 404, 500].includes(response.status));
});

authOnly('@Flow5-F2 getResult voi attemptId khong ton tai nen khong duoc 401 403', async ({ I }) => {
  withAuth(I, env.jwt);
  const missingAttemptId = 999999999;
  const response = await I.sendGetRequest(`/api/ai/result/${missingAttemptId}`);

  assert.ok(![401, 403].includes(response.status));
  assert.ok([200, 404].includes(response.status));
});

Scenario('@Flow5-F3 getDetailedResult tu choi khi khong co token', async ({ I }) => {
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}/details`);

  assert.ok([401, 403].includes(response.status));
});

authOnly('@Flow5-F3 getDetailedResult voi JWT tra ve chi tiet hoac 404', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest(`/api/ai/result/${env.attemptId}/details`);

  assert.ok([200, 404].includes(response.status));
  if (response.status === 200) {
    assert.ok(response.data);
  }
});

authOnly('@Flow5-F3 getDetailedResult kiem tra attemptId khong hop le', async ({ I }) => {
  withAuth(I, env.jwt);
  const response = await I.sendGetRequest('/api/ai/result/-1/details');

  assert.ok([400, 404, 500].includes(response.status));
});

authOnly('@Flow5-F3 getDetailedResult voi attemptId khong ton tai nen khong duoc 401 403', async ({ I }) => {
  withAuth(I, env.jwt);
  const missingAttemptId = 999999999;
  const response = await I.sendGetRequest(`/api/ai/result/${missingAttemptId}/details`);

  assert.ok(![401, 403].includes(response.status));
  assert.ok([200, 404].includes(response.status));
});
