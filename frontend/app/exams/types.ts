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
  isActive: boolean;
  questions: Question[];
}

export interface AnswerState {
  selectedOptionId?: number; // Dùng cho trắc nghiệm
  textAnswer?: string;       // Dùng cho tự luận
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
  exam: {
    title: string;
    description: string;
  };
  answers: ExamAnswer[];
}