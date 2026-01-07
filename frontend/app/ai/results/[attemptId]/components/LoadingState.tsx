/**
 * LoadingState Component
 * Hiển thị trạng thái loading khi đang fetch dữ liệu
 */

export function LoadingState() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg shadow-lg animate-pulse mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-6 bg-blue-500 rounded w-1/3 mb-4" />
            <div className="h-4 bg-blue-500 rounded w-1/4" />
          </div>
          <div className="text-right">
            <div className="h-12 bg-blue-500 rounded w-24 mb-2" />
            <div className="h-4 bg-blue-500 rounded w-20" />
          </div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="bg-white border rounded-lg p-6 shadow-sm animate-pulse mb-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-5 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Question Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border rounded-lg p-6 shadow-sm animate-pulse"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="text-right">
                <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-100 rounded" />
              <div className="h-20 bg-blue-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
