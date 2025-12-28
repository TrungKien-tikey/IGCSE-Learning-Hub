# 🚀 **HƯỚNG DẪN CHẠY AI SERVICE & API EXAMPLES**

## 📋 **MỤC LỤC**
1. [Setup Database](#-setup-database)
2. [Chạy AI Service](#-chạy-ai-service)
3. [API Examples](#-api-examples)
4. [Testing Scripts](#-testing-scripts)

---

## 🗄️ **SETUP DATABASE**

### **Bước 1: Khởi động MySQL với Docker**
```bash
# Từ thư mục root của project
cd D:\oop\IGCSE-Learning-Hub
docker-compose up -d mysql-db phpmyadmin
```

### **Bước 2: Tạo Database cho AI Service**
```bash
# Chạy script tạo database
docker exec -i igcse_mysql mysql -uroot -proot < docker/init-db.sql
```

### **Bước 3: Kiểm tra Database**
- **phpMyAdmin**: http://localhost:8081
- **Username**: root
- **Password**: root
- **Database**: ai_db

---

## ⚙️ **CHẠY AI SERVICE**

### **Cách 1: Chạy với JAR file (Khuyến nghị)**
```bash
cd ai-service
java -jar target/ai-service-0.0.1-SNAPSHOT.jar
```

### **Cách 2: Chạy với Maven (Development)**
```bash
cd ai-service
./mvnw spring-boot:run
```

### **Cách 3: Chạy với Maven Wrapper (Windows)**
```powershell
cd ai-service
mvnw.cmd spring-boot:run
```

### **Kiểm tra Service đã chạy**
```bash
# Health check
curl http://localhost:8082/api/ai/health
```

**Expected Response:**
```json
{
  "status": "UP",
  "timestamp": "2025-12-28T22:10:00.000+00:00",
  "service": "ai-service"
}
```

---

## 🔗 **API EXAMPLES**

### **📊 1. HEALTH CHECK**
```bash
# GET /api/ai/health
curl -X GET "http://localhost:8082/api/ai/health" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2025-12-28T22:10:00.000+00:00",
  "service": "ai-service"
}
```

---

### **📝 2. CHẤM ĐIỂM BÀI THI**

#### **2.1 Chấm điểm cơ bản (Tiếng Anh)**
```bash
# POST /api/ai/mark/{attemptId}
curl -X POST "http://localhost:8082/api/ai/mark/123" \
  -H "Content-Type: application/json"
```

#### **2.2 Chấm điểm với ngôn ngữ cụ thể**
```bash
# POST /api/ai/mark/{attemptId}/{language}
curl -X POST "http://localhost:8082/api/ai/mark/123/vi" \
  -H "Content-Type: application/json"
```

**Response mẫu:**
```json
{
  "attemptId": 123,
  "score": 85.5,
  "maxScore": 100.0,
  "feedback": "Good performance with room for improvement in essay writing.",
  "confidence": 0.92,
  "language": "en"
}
```

#### **2.3 Lấy kết quả chấm điểm**
```bash
# GET /api/ai/result/{attemptId}
curl -X GET "http://localhost:8082/api/ai/result/123" \
  -H "Content-Type: application/json"
```

#### **2.4 Lấy kết quả chi tiết**
```bash
# GET /api/ai/result/{attemptId}/detailed
curl -X GET "http://localhost:8082/api/ai/result/123/detailed" \
  -H "Content-Type: application/json"
```

**Response chi tiết:**
```json
{
  "attemptId": 123,
  "score": 85.5,
  "maxScore": 100.0,
  "feedback": "Good performance with room for improvement in essay writing.",
  "confidence": 0.92,
  "language": "en",
  "details": [
    {
      "questionId": 1,
      "questionType": "ESSAY",
      "score": 15.0,
      "maxScore": 20.0,
      "feedback": "Well-structured essay with good vocabulary.",
      "isCorrect": true,
      "confidence": 0.88,
      "evaluationMethod": "AI_GPT4"
    }
  ]
}
```

---

### **🔄 3. XỬ LÝ THEO LÔ (BATCH PROCESSING)**

#### **3.1 Tạo batch chấm điểm**
```bash
# POST /api/ai/batch/mark
curl -X POST "http://localhost:8082/api/ai/batch/mark" \
  -H "Content-Type: application/json" \
  -d '{
    "attemptIds": [123, 124, 125],
    "language": "vi"
  }'
```

**Response:**
```json
{
  "batchId": "batch_1735420200000",
  "status": "PROCESSING",
  "message": "Batch processing started successfully",
  "totalCount": 3
}
```

#### **3.2 Kiểm tra trạng thái batch**
```bash
# GET /api/ai/batch/status/{batchId}
curl -X GET "http://localhost:8082/api/ai/batch/status/batch_1735420200000" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "batchId": "batch_1735420200000",
  "status": "COMPLETED",
  "results": {
    "123": 85.5,
    "124": 92.0,
    "125": 78.5
  },
  "completedCount": 3,
  "totalCount": 3,
  "processingTime": 45000
}
```

---

### **📈 4. THỐNG KÊ**

#### **4.1 Thống kê học sinh**
```bash
# GET /api/ai/stats/student/{studentId}
curl -X GET "http://localhost:8082/api/ai/stats/student/456" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "studentId": 456,
  "totalExams": 5,
  "averageScore": 82.4,
  "passedExams": 4,
  "failedExams": 1,
  "strongTopics": ["Mathematics", "Physics"],
  "weakTopics": ["Chemistry"],
  "recentTrend": "improving"
}
```

#### **4.2 Thống kê lớp học**
```bash
# GET /api/ai/stats/class/{classId}
curl -X GET "http://localhost:8082/api/ai/stats/class/789" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "classId": 789,
  "totalStudents": 25,
  "averageClassScore": 78.6,
  "passRate": 0.84,
  "topicPerformance": {
    "Mathematics": 85.2,
    "Physics": 82.1,
    "Chemistry": 75.8,
    "Biology": 79.4
  }
}
```

#### **4.3 Thống kê hệ thống**
```bash
# GET /api/ai/stats/system
curl -X GET "http://localhost:8082/api/ai/stats/system" \
  -H "Content-Type: application/json"
```

---

### **🧠 5. GỢI Ý HỌC TẬP (INSIGHTS)**
```bash
# GET /api/ai/insights/{studentId}
curl -X GET "http://localhost:8082/api/ai/insights/456" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "studentId": 456,
  "performanceLevel": "GOOD",
  "strengths": [
    "Strong in mathematical reasoning",
    "Good essay writing skills"
  ],
  "weaknesses": [
    "Needs improvement in Chemistry",
    "Time management in exams"
  ],
  "recommendations": "Focus on Chemistry practice questions and time management techniques.",
  "predictedImprovement": "85%",
  "studyPlan": "2 hours Chemistry daily, 1 hour practice exams weekly"
}
```

---

### **📚 6. KHUYẾN NGHỊ HỌC TẬP**
```bash
# GET /api/ai/recommendations/{studentId}
curl -X GET "http://localhost:8082/api/ai/recommendations/456" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "studentId": 456,
  "recommendations": [
    "Practice Chemistry lab experiments",
    "Review Physics formulas weekly",
    "Join study group for Mathematics"
  ],
  "priority": "HIGH",
  "estimatedTimeToImprove": "4 weeks",
  "resources": [
    "Khan Academy Chemistry",
    "Physics formula sheets",
    "Past exam papers"
  ]
}
```

---

### **📄 7. BÁO CÁO**

#### **7.1 Báo cáo học sinh**
```bash
# GET /api/ai/reports/student/{studentId}/{format}
curl -X GET "http://localhost:8082/api/ai/reports/student/456/pdf" \
  -H "Content-Type: application/json" \
  --output student_report.pdf
```

#### **7.2 Báo cáo lớp học**
```bash
# GET /api/ai/reports/class/{classId}/{format}
curl -X GET "http://localhost:8082/api/ai/reports/class/789/pdf" \
  -H "Content-Type: application/json" \
  --output class_report.pdf
```

**Supported formats:** `pdf`, `docx`, `xlsx`

---

## 🧪 **TESTING SCRIPTS**

### **Chạy Full Test Suite**
```powershell
# Trong thư mục ai-service
.\test_all_endpoints.ps1
```

### **Test Thủ Công với PowerShell**
```powershell
# Test health
Invoke-WebRequest -Uri "http://localhost:8082/api/ai/health" -Method GET

# Test grading
Invoke-WebRequest -Uri "http://localhost:8082/api/ai/mark/123" -Method POST

# Test batch
$body = @{
    attemptIds = @(123, 124, 125)
    language = "vi"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8082/api/ai/batch/mark" -Method POST -Body $body -ContentType "application/json"
```

---

## ⚠️ **LƯU Ý QUAN TRỌNG**

### **API Key Configuration**
Trước khi chạy, cần cấu hình API key OpenAI:
```properties
# Trong application.properties
openai.api.key=YOUR_ACTUAL_OPENAI_API_KEY_HERE
```

### **Sample Data**
Để test đầy đủ, cần insert sample data vào database:
```sql
-- Insert sample exam attempt
INSERT INTO exam_attempts (exam_id, student_id, answers) VALUES
(1, 456, '{"question1": "Sample essay answer", "question2": "A"}');

-- Insert sample AI result
INSERT INTO ai_results (attempt_id, score, feedback, language, confidence, student_id, exam_id)
VALUES (1, 85.5, 'Good performance', 'en', 0.92, 456, 1);
```

### **Troubleshooting**
```bash
# Check logs
tail -f logs/ai-service.log

# Check if port 8082 is free
netstat -ano | findstr :8082

# Kill process on port 8082
# Windows: taskkill /PID <PID> /F
```

---

## 🎯 **QUICK START CHECKLIST**

- [ ] ✅ Docker MySQL chạy: `docker-compose up -d`
- [ ] ✅ Database created: `docker exec -i igcse_mysql mysql -uroot -proot < docker/init-db.sql`
- [ ] ✅ API key configured trong `application.properties`
- [ ] ✅ AI Service chạy: `java -jar target/ai-service-0.0.1-SNAPSHOT.jar`
- [ ] ✅ Health check pass: `curl http://localhost:8082/api/ai/health`
- [ ] ✅ Test grading: `curl -X POST http://localhost:8082/api/ai/mark/123`

**🎉 READY TO TEST ALL 13 ENDPOINTS!** 🚀

