import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const colorStyles = {
        blue: "border-l-blue-500 bg-blue-50 text-blue-600",
        teal: "border-l-teal-500 bg-teal-50 text-teal-600",
        amber: "border-l-amber-500 bg-amber-50 text-amber-600",
        purple: "border-l-purple-500 bg-purple-50 text-purple-600",
    };

    const selectedColor = colorStyles[color] || colorStyles.blue;
    const iconBg = selectedColor.replace("border-l-", "").split(" ")[1];

    return (
        <div className={`bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm border-l-4 ${selectedColor.split(" ")[0]} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4">
                <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">{title}</p>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg ${iconBg} bg-opacity-50 flex-shrink-0 ml-2`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 line-clamp-1">{trend}</p>
        </div>
    );
};

export default StatCard;