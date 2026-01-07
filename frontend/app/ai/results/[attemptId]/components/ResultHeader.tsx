/**
 * ResultHeader Component
 * Hiển thị header với tổng điểm và trạng thái
 */

import {
  calculatePercentage,
  formatNumber,
  formatDateTime,
  getScoreColor,
} from "@/app/ai/utils/format";

interface ResultHeaderProps {
  score: number;
  maxScore: number;
  passed: boolean;
  gradedAt: string;
  confidence: number;
  attemptId: number;
}

export function ResultHeader({
  score,
  maxScore,
  passed,
  gradedAt,
  confidence,
  attemptId,
}: ResultHeaderProps) {
  const percentage = calculatePercentage(score, maxScore);
  const scoreColor = getScoreColor(score, maxScore);

  return (
    <div className={`${scoreColor.bg} ${scoreColor.text} border-2 ${scoreColor.border} rounded-lg shadow-lg p-8 mb-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Top Row: Title + Score */}
        <div className="flex justify-between items-start gap-6">
          <div>
            <p className="text-sm font-medium opacity-75 mb-2">
              Lượt làm bài #{attemptId}
            </p>
            <h1 className="text-3xl font-bold mb-2">
              Kết quả chấm điểm tự động
            </h1>
            <p className="opacity-75">Được chấm bởi AI Service</p>
          </div>

          {/* Score Display */}
          <div className="text-right">
            <div className="text-5xl font-bold mb-1">
              {formatNumber(score, 1)}
            </div>
            <div className="text-lg opacity-75 mb-2">
              / {formatNumber(maxScore, 0)}
            </div>
            <div className="text-2xl font-semibold">{percentage.toFixed(1)}%</div>
          </div>
        </div>

        {/* Bottom Row: Status + DateTime + Confidence */}
        <div className="mt-6 pt-6 border-t border-current border-opacity-20 flex flex-wrap items-center gap-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {passed ? (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-xs opacity-75">Trạng thái</p>
                  <p className="font-semibold">Đã đạt</p>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">❌</span>
                <div>
                  <p className="text-xs opacity-75">Trạng thái</p>
                  <p className="font-semibold">Chưa đạt</p>
                </div>
              </>
            )}
          </div>

          {/* DateTime */}
          <div>
            <p className="text-xs opacity-75">Thời gian chấm</p>
            <p className="font-medium text-sm">{formatDateTime(gradedAt)}</p>
          </div>

          {/* Confidence */}
          <div>
            <p className="text-xs opacity-75">Độ tin cậy</p>
            <p className="font-semibold">{(confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
