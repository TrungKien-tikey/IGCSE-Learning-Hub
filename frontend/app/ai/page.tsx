"use client";

/**
 * AI Service Home Page
 * Trang chủ của AI module
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { aiService } from "@/lib/api/aiService";

export default function AIHomePage() {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNavigateToResult = async () => {
    if (!attemptId.trim()) {
      setError("Vui lòng nhập ID lượt làm bài");
      return;
    }

    const id = Number(attemptId);
    if (isNaN(id) || id <= 0) {
      setError("ID lượt làm bài phải là số dương");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Verify attempt exists
      await aiService.getDetailedResult(id);

      // Navigate to result page
      router.push(`/ai/results/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi kiểm tra kết quả"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNavigateToResult();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Grading Service
          </h1>
          <p className="text-xl text-gray-600">
            Xem kết quả chấm điểm tự động bằng AI
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📋 Xem kết quả chấm điểm
          </h2>

          {/* Input Group */}
          <div className="mb-6">
            <label
              htmlFor="attemptId"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Nhập ID lượt làm bài (Attempt ID):
            </label>
            <div className="flex gap-3">
              <input
                id="attemptId"
                type="number"
                min="1"
                placeholder="VD: 123"
                value={attemptId}
                onChange={(e) => {
                  setAttemptId(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleNavigateToResult}
                disabled={loading || !attemptId.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition disabled:cursor-not-allowed"
              >
                {loading ? "🔄 Đang tải..." : "🔍 Xem kết quả"}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">❌ {error}</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Cách sử dụng:</strong> Nhập ID của lượt làm bài (attempt
              ID) mà bạn muốn xem kết quả. ID này được cấp sau khi bạn nộp bài
              thi.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-800 mb-2">Chấm điểm tự động</h3>
            <p className="text-gray-600 text-sm">
              AI Service sử dụng GPT-4 để chấm điểm các câu tự luận một cách
              chính xác và công bằng
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-800 mb-2">Chi tiết từng câu</h3>
            <p className="text-gray-600 text-sm">
              Xem điểm từng câu, nhận xét chi tiết, và độ tin cậy của điểm số
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-gray-800 mb-2">Phân tích chi tiết</h3>
            <p className="text-gray-600 text-sm">
              Hiểu rõ điểm mạnh, điểm yếu và cách cải thiện bài thi của bạn
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-bold text-gray-800 mb-2">Đa ngôn ngữ</h3>
            <p className="text-gray-600 text-sm">
              Hỗ trợ tiếng Anh, tiếng Việt, và tự động nhận diện ngôn ngữ
            </p>
          </div>
        </div>

        {/* Example */}
        <div className="bg-gray-800 text-gray-100 rounded-lg shadow-lg p-6">
          <h3 className="font-bold mb-3">📌 Ví dụ:</h3>
          <div className="font-mono text-sm space-y-2">
            <p>
              {"> "}
              <span className="text-blue-400">Nhập:</span> 123
            </p>
            <p>
              {"→ "}
              <span className="text-green-400">
                Xem kết quả chấm của lượt làm bài #123
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
