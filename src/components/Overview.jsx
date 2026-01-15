import React, { useState } from 'react';
import StatCard from './dashboard/StatCard';
import ErrorTrendChart from './dashboard/ErrorTrendChart';
import TopFlowsChart from './dashboard/TopFlowsChart';
import StatusDonutChart from './dashboard/StatusDonutChart';
import FailuresTable from './dashboard/FailuresTable';
import FailuresDrawer from './dashboard/FailuresDrawer';
import TopFlowsDrawer from './dashboard/TopFlowsDrawer';
import UnsharedFlowsChart from './dashboard/UnsharedFlowsChart';
import UnsharedFlowsDrawer from './dashboard/UnsharedFlowsDrawer';
import { Activity, AlertTriangle, Layers, Play, RefreshCw, Square, Calendar } from 'lucide-react';
import { useFlowContext } from '../contexts/FlowContext';

const Overview = () => {
    // Sử dụng Global Context thay vì fetch local
    const { overviewStats, loadingProgress, isScanning, refreshData, lastUpdated, stopScanning, daysRange, setDaysRange, unsharedFlows } = useFlowContext();
    const [showTopFlowsDrawer, setShowTopFlowsDrawer] = useState(false);
    const [showUnsharedFlowsDrawer, setShowUnsharedFlowsDrawer] = useState(false);
    const [showFailuresDrawer, setShowFailuresDrawer] = useState(false);

    // Stats từ context
    const stats = overviewStats;

    // Chuẩn bị dữ liệu cho Chart
    const trendData = Object.keys(stats.runsByDate).sort().map(date => {
        const item = stats.runsByDate[date];
        const total = item.passes + item.fails;
        return {
            date: date.split('-').slice(1).join('/'), // MM/DD format
            runs: total,
            errorRate: total > 0 ? parseFloat(((item.fails / total) * 100).toFixed(1)) : 0
        };
    }).slice(-7); // Last 7 days

    const donutData = [
        { name: 'Succeeded', value: stats.successfulRuns },
        { name: 'Failed', value: stats.failedRuns }
    ];

    const errorRate = stats.totalRuns > 0
        ? ((stats.failedRuns / stats.totalRuns) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-4 pt-0 bg-slate-950 min-h-screen text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-end mb-3 px-2">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Automation Center</h1>
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <span>Monitor</span>
                        <span>/</span>
                        <span className="text-blue-400 font-medium">Runs</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <select
                            value={daysRange}
                            onChange={(e) => setDaysRange(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-2"
                        >
                            <option value="1" className="bg-slate-900">Gần nhất 1 ngày</option>
                            <option value="7" className="bg-slate-900">Gần nhất 7 ngày</option>
                            <option value="30" className="bg-slate-900">Gần nhất 30 ngày</option>
                            <option value="90" className="bg-slate-900">Gần nhất 90 ngày</option>
                        </select>
                    </div>
                    <div className="text-right hidden sm:block border-l border-slate-700 pl-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cập nhật lúc</p>
                        <p className="text-sm font-mono text-blue-400">
                            {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                        </p>
                    </div>
                    {isScanning && (
                        <button
                            onClick={stopScanning}
                            className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-500 transition-all flex items-center justify-center"
                            title="Dừng quét"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    )}
                    <button
                        onClick={refreshData}
                        disabled={isScanning}
                        className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw className={`w-5 h-5 text-white ${isScanning ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Progress Bar (Visible when scanning) */}
            {isScanning && (
                <div className="w-full bg-slate-900 rounded-full h-1 mb-2 overflow-hidden mx-2">
                    <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                    ></div>
                </div>
            )}

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Flows có lượt chạy"
                    value={stats.topFlows?.length || 0}
                    icon={Layers}
                />
                <StatCard
                    title="Total runs"
                    value={stats.totalRuns.toLocaleString()}
                    icon={Play}
                />
                <StatCard
                    title="Flow runs error rate"
                    value={`${errorRate}%`}
                    icon={AlertTriangle}
                    className={parseFloat(errorRate) > 10 ? 'border-red-900/50 bg-red-900/10' : ''}
                />
            </div>

            {/* Charts Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ErrorTrendChart data={trendData} />
                <TopFlowsChart
                    data={stats.topFlows}
                    onSeeMore={() => setShowTopFlowsDrawer(true)}
                />
            </div>

            {/* Charts Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatusDonutChart data={donutData} />
                <UnsharedFlowsChart
                    data={unsharedFlows}
                    onSeeMore={() => setShowUnsharedFlowsDrawer(true)}
                />
            </div>

            {/* Failures Table - Full Width */}
            <FailuresTable
                failures={stats.recentFailures}
                onSeeAll={() => setShowFailuresDrawer(true)}
            />

            {/* Side Drawers */}
            <TopFlowsDrawer
                isOpen={showTopFlowsDrawer}
                onClose={() => setShowTopFlowsDrawer(false)}
                data={stats.topFlows}
            />
            <UnsharedFlowsDrawer
                isOpen={showUnsharedFlowsDrawer}
                onClose={() => setShowUnsharedFlowsDrawer(false)}
                data={unsharedFlows}
            />
            <FailuresDrawer
                isOpen={showFailuresDrawer}
                onClose={() => setShowFailuresDrawer(false)}
                failures={stats.recentFailures}
            />
        </div>
    );
};

export default Overview;

