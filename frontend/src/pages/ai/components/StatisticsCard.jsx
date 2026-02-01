/**
 * StatisticsCard - Card thống kê với icon
 * Nền pastel + shadow nhẹ, không border màu
 */

const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-600",
    red: "bg-rose-50 text-rose-600",
    purple: "bg-violet-50 text-violet-600",
    indigo: "bg-indigo-50 text-indigo-600",
};

const iconBgMap = {
    blue: "bg-blue-100",
    green: "bg-emerald-100",
    yellow: "bg-amber-100",
    red: "bg-rose-100",
    purple: "bg-violet-100",
    indigo: "bg-indigo-100",
};

export default function StatisticsCard({ icon, label, value, color = "blue" }) {
    const colorClasses = colorMap[color] || colorMap.blue;
    const iconBgClass = iconBgMap[color] || iconBgMap.blue;

    return (
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm ${colorClasses}`}>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                    {typeof icon === "string" ? (
                        <span className="text-xl sm:text-2xl">{icon}</span>
                    ) : (
                        <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7">{icon}</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm opacity-80 font-medium truncate">{label}</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
                </div>
            </div>
        </div>
    );
}
