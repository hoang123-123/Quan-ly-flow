import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ErrorTrendChart = ({ data }) => {
    // Transform object data to array if needed, but assuming data is already array of {date, passed, failed}
    // const chartData = ... 

    // For now assuming data passed in is suitable or needs minor transformation
    // data format expected: { date: 'Jan 8', runs: 76, errorRate: 2.5 }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-[400px]">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Flow runs error trends</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Runs', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar yAxisId="left" dataKey="runs" name="Flow runs" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="errorRate" name="Error rate" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ErrorTrendChart;
