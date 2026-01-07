/**
 * Environment Configuration
 * Cấu hình endpoints cho các services
 */

export const envConfig = {
  // AI Service
  AI_SERVICE_URL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8082",
  
  // Exam Service
  EXAM_SERVICE_URL: process.env.NEXT_PUBLIC_EXAM_SERVICE_URL || "http://localhost:8080",
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;

