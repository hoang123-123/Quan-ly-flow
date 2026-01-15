import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const StatusDonutChart = ({ data }) => {
    // data: [{ name: 'Failed', value: 10 }, { name: 'Succeeded', value: 90 }, ...]
    const COLORS = {
        'Failed': '#ef4444', // Red 500
        'Succeeded': '#22c55e', // Green 500
        'Canceled': '#a855f7', // Purple 500
        'Running': '#3b82f6' // Blue 500
    };

    const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-[350px]">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Flow runs by status</h3>
            <div className="relative h-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="square" />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                    <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default StatusDonutChart;
