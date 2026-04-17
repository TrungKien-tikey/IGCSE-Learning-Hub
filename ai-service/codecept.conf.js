require('dotenv').config();

const baseUrl = process.env.AI_SERVICE_BASE_URL || 'http://localhost:8082';

exports.config = {
  tests: './tests/api/*_test.js',
  output: './tests/output',
  helpers: {
    REST: {
      endpoint: baseUrl,
      defaultHeaders: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  },
  include: {},
  mocha: {},
  bootstrap: null,
  teardown: null,
  hooks: [],
  plugins: {
    retryFailedStep: {
      enabled: true
    }
  },
  name: 'ai-service-api-tests'
};
