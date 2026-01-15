import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, className = "" }) => {
    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg ${className}`}>
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    {Icon && (
                        <div className="p-3 bg-slate-800 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium text-slate-400">{title}</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                    </div>
                </div>
                {description && (
                    <div className="text-right">
                        <p className="text-xs text-slate-500">{description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
