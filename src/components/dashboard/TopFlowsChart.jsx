import React from 'react';

const TopFlowsChart = ({ data, onSeeMore }) => {
    // Chỉ hiển thị Top 5 ở biểu đồ nhỏ
    const displayData = data?.slice(0, 5) || [];
    const maxCount = displayData.length > 0 ? Math.max(...displayData.map(d => d.count)) : 0;

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white tracking-tight">Top flow runs</h3>
                <button
                    onClick={onSeeMore}
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                    See more
                </button>
            </div>

            <div className="space-y-6">
                {displayData.length > 0 ? (
                    displayData.map((flow, index) => {
                        const width = maxCount > 0 ? (flow.count / maxCount) * 100 : 0;
                        return (
                            <div key={`${flow.id || flow.name}-${index}`} className="space-y-2 group/item">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-300 truncate pr-4 group-hover/item:text-blue-400 transition-colors" title={flow.name}>
                                        {flow.name}
                                    </span>
                                    <span className="text-blue-400 font-mono">
                                        {flow.count > 1000 ? (flow.count / 1000).toFixed(1) + 'k' : flow.count.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out group-hover/item:bg-blue-400 group-hover/item:shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center justify-center h-48 text-slate-500 italic">
                        Chưa có dữ liệu thống kê
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopFlowsChart;
