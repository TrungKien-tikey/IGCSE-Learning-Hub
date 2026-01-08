/**
 * EmptyState Component
 * Reusable empty state với icon, message, và action button
 * 
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.title - Tiêu đề
 * @param {string} props.message - Thông điệp chi tiết
 * @param {string} props.actionLabel - Label cho button (optional)
 * @param {function} props.onAction - Handler cho button (optional)
 */
export default function EmptyState({
    icon = "📭",
    title = "Không có dữ liệu",
    message = "Chưa có dữ liệu để hiển thị",
    actionLabel,
    onAction,
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-5xl mb-4">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm max-w-xs mb-4">{message}</p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
