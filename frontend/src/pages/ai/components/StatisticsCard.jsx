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
        <div className={`rounded-2xl p-5 shadow-sm ${colorClasses}`}>
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBgClass}`}>
                    {typeof icon === "string" ? (
                        <span className="text-2xl">{icon}</span>
                    ) : (
                        <span className="w-7 h-7">{icon}</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <p className="text-sm opacity-80 font-medium">{label}</p>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                </div>
            </div>
        </div>
    );
}
