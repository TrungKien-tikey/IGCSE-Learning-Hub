/**
 * ActionButtons Component
 * Nút hành động: Quay lại, In kết quả, Chia sẻ
 */

import { useRouter } from "next/navigation";

interface ActionButtonsProps {
  attemptId: number;
  canPrint?: boolean;
  onRefresh?: () => void;
}

export function ActionButtons({
  attemptId,
  canPrint = true,
  onRefresh,
}: ActionButtonsProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Kết quả chấm điểm",
        text: `Kết quả chấm bài #${attemptId} từ AI Service`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Đã sao chép link vào clipboard");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 border-t mt-6 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        <span>←</span> Quay lại
      </button>

      {/* Right: Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition font-medium"
            title="Làm mới dữ liệu"
          >
            <span>🔄</span> Làm mới
          </button>
        )}

        {/* Print Button */}
        {canPrint && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition font-medium"
            title="In kết quả chấm"
          >
            <span>🖨️</span> In kết quả
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-blue-700 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition font-medium"
          title="Chia sẻ kết quả"
        >
          <span>📤</span> Chia sẻ
        </button>

        {/* Home Button */}
        <button
          onClick={() => router.push("/ai")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          title="Về trang chủ"
        >
          <span>🏠</span> Trang chủ
        </button>
      </div>
    </div>
  );
}
