function parseLong(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

const env = {
  baseUrl: process.env.AI_SERVICE_BASE_URL || 'http://localhost:8082',
  jwt: process.env.AI_TEST_JWT || '',
  // Fallback to AI_TEST_JWT so admin scenario can still run if only one token is configured.
  adminJwt: process.env.AI_TEST_ADMIN_JWT || process.env.AI_TEST_JWT || '',
  studentId: parseLong(process.env.AI_TEST_STUDENT_ID, 1),
  attemptId: parseLong(process.env.AI_TEST_ATTEMPT_ID, 1),
  classId: parseLong(process.env.AI_TEST_CLASS_ID, 1),
  examId: parseLong(process.env.AI_TEST_EXAM_ID, 1)
};

function withAuth(I, token) {
  I.haveRequestHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}

module.exports = {
  env,
  withAuth
};
