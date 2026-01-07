"use client";

/**
 * AI Results Detail Page
 * Trang xem chi tiết kết quả chấm điểm do AI Service cung cấp
 * Standalone: Chỉ lấy dữ liệu từ AI Service
 */

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DetailedGradingResultDTO } from "@/app/ai/types";
import { aiService, AIServiceError } from "@/lib/api/aiService";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { ResultHeader } from "./components/ResultHeader";
import { ResultSummary } from "./components/ResultSummary";
import { QuestionResultCard } from "./components/QuestionResultCard";
import { ActionButtons } from "./components/ActionButtons";

type PageParams = Promise<{ attemptId: string }>;

export default function AIResultsPage() {
  const params = useParams() as unknown as PageParams | { attemptId: string };

  // Handle both Promise and direct object for params
  const attemptId = typeof params === "object" && "attemptId" in params
    ? Number(params.attemptId)
    : 0;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    message: string;
    status?: number;
  } | null>(null);
  const [data, setData] = useState<DetailedGradingResultDTO | null>(null);

  const fetchData = async () => {
    if (!attemptId || attemptId === 0) {
      setError({
        message: "ID lượt làm bài không hợp lệ",
        status: 400,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await aiService.getDetailedResult(attemptId);
      setData(result);
    } catch (err) {
      if (err instanceof AIServiceError) {
        setError({
          message: err.message,
          status: err.status,
        });
      } else {
        setError({
          message: err instanceof Error ? err.message : "Lỗi không xác định",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error || !data) {
    return (
      <ErrorState
        error={error?.message || "Không tìm thấy kết quả"}
        statusCode={error?.status}
        attemptId={attemptId}
        onRetry={fetchData}
      />
    );
  }

  // Success state
  return (
    <main className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <ResultHeader
          score={data.score}
          maxScore={data.maxScore}
          passed={data.score >= 5.0}
          gradedAt={new Date().toISOString()}
          confidence={data.confidence}
          attemptId={data.attemptId}
        />

        {/* Summary */}
        <ResultSummary
          confidence={data.confidence}
          confidenceLevel={
            data.confidence >= 0.8
              ? "HIGH"
              : data.confidence >= 0.5
                ? "MEDIUM"
                : "LOW"
          }
          evaluationMethod={
            data.details && data.details.length > 0
              ? data.details[0].evaluationMethod
              : "LOCAL_RULE_BASED"
          }
          language={data.language}
          overallFeedback={data.feedback}
        />

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            📋 Chi tiết từng câu hỏi ({data.details.length} câu)
          </h3>

          {data.details.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>Không có dữ liệu câu hỏi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.details.map((detail, index) => (
                <QuestionResultCard
                  key={detail.questionId}
                  result={detail}
                  questionNumber={index + 1}
                  questionContent={`Câu ${index + 1}`}
                  studentAnswer={undefined}
                  referenceAnswer={undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <ActionButtons attemptId={attemptId} onRefresh={fetchData} />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          main {
            background: white;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .max-w-4xl {
            max-width: 100%;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </main>
  );
}
