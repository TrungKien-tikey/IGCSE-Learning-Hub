/**
 * ErrorState Component
 * Hiển thị lỗi khi không thể fetch hoặc xử lý dữ liệu
 */

import { useRouter } from "next/navigation";

interface ErrorStateProps {
  error: string;
  statusCode?: number;
  attemptId?: number;
  onRetry?: () => void;
}

export function ErrorState({
  error,
  statusCode,
  attemptId,
  onRetry,
}: ErrorStateProps) {
  const router = useRouter();

  const getErrorIcon = () => {
    if (!statusCode) return "⚠️";
    if (statusCode === 404) return "🔍";
    if (statusCode >= 500) return "🚨";
    return "❌";
  };

  const getErrorTitle = () => {
    if (!statusCode) return "Lỗi";
    if (statusCode === 404) return "Không tìm thấy kết quả";
    if (statusCode === 503) return "Dịch vụ không khả dụng";
    if (statusCode >= 500) return "Lỗi máy chủ";
    return `Lỗi ${statusCode}`;
  };

  const getErrorDescription = () => {
    if (!statusCode) return error;
    if (statusCode === 404)
      return `Không tìm thấy kết quả chấm cho lượt làm bài #${attemptId}. Bài này có thể chưa được chấm hoặc ID không chính xác.`;
    if (statusCode === 503)
      return "AI Service hiện tại không khả dụng. Vui lòng thử lại sau một lúc.";
    if (statusCode >= 500)
      return "Có lỗi xảy ra ở phía máy chủ. Vui lòng thử lại sau.";
    return error;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-4">{getErrorIcon()}</div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-red-900 mb-2">
          {getErrorTitle()}
        </h1>

        {/* Error Message */}
        <p className="text-red-700 mb-6 text-lg">{getErrorDescription()}</p>

        {/* Error Code */}
        {statusCode && (
          <div className="bg-red-100 rounded px-3 py-2 inline-block mb-8">
            <code className="text-red-800 font-mono text-sm">
              Error {statusCode}
            </code>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 flex-wrap">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              🔄 Thử lại
            </button>
          )}

          <button
            onClick={() => router.back()}
            className="px-6 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
          >
            ← Quay lại
          </button>

          <button
            onClick={() => router.push("/ai")}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            🏠 Trang chủ
          </button>
        </div>
      </div>

      {/* Technical Details (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-6 p-4 bg-gray-100 rounded-lg">
          <summary className="cursor-pointer font-medium text-gray-700">
            Chi tiết lỗi (Dev Mode)
          </summary>
          <pre className="mt-3 text-xs bg-gray-200 p-3 rounded overflow-auto text-gray-800">
            {JSON.stringify(
              {
                message: error,
                statusCode,
                attemptId,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
