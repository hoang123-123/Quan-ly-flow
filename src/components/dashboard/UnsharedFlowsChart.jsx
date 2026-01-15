import React from 'react';
import { ShieldOff, ExternalLink } from 'lucide-react';

const UnsharedFlowsChart = ({ data, onSeeMore }) => {
    // Chỉ hiển thị Top 5 ở component nhỏ
    const displayData = data?.slice(0, 5) || [];

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">Flows chưa chia sẻ quyền</h3>
                    <ShieldOff className="w-5 h-5 text-amber-500/50" />
                </div>
                {data?.length > 0 && (
                    <button
                        onClick={onSeeMore}
                        className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                        See all ({data.length})
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {displayData.length > 0 ? (
                    displayData.map((flow, index) => (
                        <div key={`${flow.flowId || flow.id || index}-${index}`} className="space-y-2 group/item">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-slate-300 truncate pr-4 group-hover/item:text-amber-400 transition-colors flex-1" title={flow.name}>
                                    {flow.name}
                                </span>
                                <a
                                    href={`https://make.powerautomate.com/environments/${flow.environmentId}/flows/${flow.flowId}/details`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors opacity-0 group-hover/item:opacity-100"
                                    title="Mở trong Power Automate"
                                >
                                    <ExternalLink className="w-4 h-4 text-amber-400" />
                                </a>
                            </div>
                            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500/50 rounded-full transition-all duration-1000 ease-out group-hover/item:bg-amber-400 group-hover/item:shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500 italic">
                        Tất cả flows đều được chia sẻ quyền
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnsharedFlowsChart;
