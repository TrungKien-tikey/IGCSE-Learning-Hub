export interface AnswerOption {
  id: number;
  content: string;
}

export interface QuestionOption {
  optionId: number;
  content: string;
  isCorrect: boolean;
  correct?: boolean;
}

export interface Question {
  questionId: number;
  content: string;
  score: number;
  questionType: "ESSAY" | "MCQ"; // Loại câu hỏi
  image?: string;
  options: QuestionOption[];
}

export interface Exam {
  examId: number;
  title: string;
  description: string;
  duration: number;
  maxAttempts: number;
  isActive: boolean;
  endTime: "",
  questions: Question[];
}

export interface AnswerState {
  selectedOptionId?: number | null;
  textAnswer?: string | null;
}

export interface ExamAnswer {
  answerId: number;
  question: Question;
  selectedOptionId: number | null;
  textAnswer: string | null;
  score: number;
}

export interface ExamAttempt {
  attemptId: number;
  totalScore: number;
  startTime: string; // Thời gian bắt đầu từ server
  exam: {
    examId: number;
    title: string;
    description: string;
    duration: number;
    questions: any[]; // Có thể là null hoặc undefined nếu backend chưa gửi
  };
  answers: ExamAnswer[];
}