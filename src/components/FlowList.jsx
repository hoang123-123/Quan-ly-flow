import React, { useState, useMemo } from 'react';
import { Search, Filter, RefreshCw, AlertTriangle, ListFilter, Activity, Square, Calendar, User } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import FlowCard from './FlowCard';
import FlowDetail from './FlowDetail';
import { useFlowContext } from '../contexts/FlowContext';

const FlowList = () => {
    // Sử dụng Global Context
    const { flows, runsMap, isScanning, syncedFlowIds, refreshData, loadingProgress, stopScanning, daysRange, setDaysRange, ownersMap, isFetchingOwners } = useFlowContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [ownerFilter, setOwnerFilter] = useState('all'); // New: Owner filter
    const [selectedFlow, setSelectedFlow] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    // Tính danh sách unique owners từ ownersMap
    const uniqueOwners = useMemo(() => {
        const owners = Object.values(ownersMap).filter(o => o && o !== 'Unknown');
        return [...new Set(owners)].sort();
    }, [ownersMap]);



    const filteredFlows = flows.filter(flow => {
        const flowId = flow.name || flow.id;
        const name = (flow.properties?.displayName || flow.name || '').toLowerCase();
        const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';
        const flowOwner = ownersMap[flowId] || 'Unknown';

        const matchesSearch = name.includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' ||
            (activeFilter === 'active' && isActive) ||
            (activeFilter === 'disabled' && !isActive);
        const matchesOwner = ownerFilter === 'all' || flowOwner === ownerFilter;

        return matchesSearch && matchesFilter && matchesOwner;
    });

    const totalPages = Math.ceil(filteredFlows.length / ITEMS_PER_PAGE);
    const paginatedFlows = filteredFlows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Map `todayRuns` từ runsMap vào flow để FlowCard hiển thị (nếu cần)
    const flowsWithData = paginatedFlows.map(flow => {
        const runs = runsMap[flow.name] || []; // runsMap key là flow.name (guid)

        // 1. Tính todayRuns
        const today = new Date().toLocaleDateString('en-CA');
        const todayRunsCount = runs.filter(r => {
            const runStartTime = r.startTime || r.properties?.startTime;
            if (!runStartTime) return false;
            return new Date(runStartTime).toLocaleDateString('en-CA') === today;
        }).length;

        // 2. Tính Độ ổn định (Success Rate)
        const totalRuns = runs.length;
        const successfulRuns = runs.filter(r => (r.status || r.properties?.status) === 'Succeeded').length;
        const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : null;

        const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';
        const flowOwner = ownersMap[flow.name] || 'Unknown';

        return {
            ...flow,
            todayRuns: todayRunsCount,
            successRate: successRate,
            hasHistory: runs.length > 0,
            isUpdating: isScanning && isActive && !syncedFlowIds.has(flow.name),
            owner: flowOwner
        };
    });

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500 overflow-hidden">
            {/* Header Section (Fixed) */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 py-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Danh sách Flows</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ListFilter size={16} />
                            <span className="text-sm">Đang hiển thị <b className="text-blue-400">{filteredFlows.length}</b> luồng</span>
                        </div>
                        {isScanning && (
                            <div className="flex items-center gap-2 text-[10px] text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full animate-pulse border border-blue-500/20">
                                <Activity size={12} />
                                <span className="font-bold tracking-tight">Syncing {loadingProgress}%</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 h-11 ml-auto md:ml-0">
                        <Calendar size={16} className="text-blue-400" />
                        <select
                            value={daysRange}
                            onChange={(e) => setDaysRange(parseInt(e.target.value))}
                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
                        >
                            <option value="1" className="bg-slate-900">1 Ngày</option>
                            <option value="7" className="bg-slate-900">7 Ngày</option>
                            <option value="30" className="bg-slate-900">30 Ngày</option>
                            <option value="90" className="bg-slate-900">90 Ngày</option>
                        </select>
                    </div>

                    {/* Owner Filter Dropdown */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 h-11">
                        <User size={16} className="text-emerald-400" />
                        <select
                            value={ownerFilter}
                            onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2 max-w-[120px]"
                            disabled={isFetchingOwners}
                        >
                            <option value="all" className="bg-slate-900">
                                {isFetchingOwners ? 'Loading...' : 'Tất cả Owner'}
                            </option>
                            {uniqueOwners.map(owner => (
                                <option key={owner} value={owner} className="bg-slate-900">
                                    {owner}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 h-11 items-center">
                        {['all', 'active', 'disabled'].map((f) => (
                            <button
                                key={f}
                                onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
                                className={`px-4 h-full rounded-lg text-xs font-bold transition-all ${activeFilter === f
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang bật' : 'Đã tắt'}
                            </button>
                        ))}
                    </div>

                    {isScanning && (
                        <button
                            onClick={stopScanning}
                            className="w-11 h-11 rounded-xl bg-red-900/20 border border-red-500/30 text-red-500 hover:bg-red-900/40 transition-all flex items-center justify-center shrink-0"
                            title="Dừng quét"
                        >
                            <Square size={20} className="fill-current" />
                        </button>
                    )}
                    <button
                        onClick={refreshData}
                        disabled={isScanning}
                        className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all group shrink-0 flex items-center justify-center ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw size={20} className={isScanning ? 'animate-spin' : 'group-active:rotate-180 transition-transform duration-500'} />
                    </button>
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm flow..."
                            className="pl-12 pr-4 h-11 bg-white/5 border border-white/10 rounded-2xl w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            </header>

            {/* Content Area (Scrollable with Top Padding for Hover) */}
            <div className="flex-1 overflow-y-auto px-1 pt-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {flows.length === 0 && isScanning ? (
                    // Initial Loading
                    <div className="flex flex-col items-center justify-center gap-6 h-full">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                            <div className="absolute inset-0 blur-lg bg-blue-500/20 animate-pulse" />
                        </div>
                        <p className="text-slate-400 font-medium tracking-wide">Đang tải danh sách Flow...</p>
                    </div>
                ) : flows.length === 0 && !isScanning ? (
                    // Error or Empty state
                    <div className="text-center py-20">
                        <div className="inline-block p-6 rounded-3xl bg-white/5 border border-white/10 text-slate-500 mb-6">
                            <AlertTriangle size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Không có dữ liệu</h3>
                        <p className="text-slate-400">Không thể tải danh sách flow hoặc chưa có flow nào.</p>
                        <button
                            onClick={refreshData}
                            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : filteredFlows.length === 0 ? (
                    // Filter returns empty
                    <div className="text-center py-20">
                        <div className="inline-block p-6 rounded-3xl bg-white/5 border border-white/10 text-slate-500 mb-6">
                            <Filter size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy flow nào</h3>
                        <p className="text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                    </div>
                ) : (
                    // Grid Content - Sitized for single screen
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                        {flowsWithData.map((flow) => (
                            <FlowCard
                                key={flow.id || flow.name}
                                flow={flow}
                                isUpdating={flow.isUpdating}
                                onClick={() => setSelectedFlow(flow)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls - Fixed at Bottom (Optimized Padding) */}
            {filteredFlows.length > ITEMS_PER_PAGE && (
                <div className="flex-shrink-0 pt-1 pb-1 pr-1 border-t border-white/5 flex items-center justify-end gap-3 backdrop-blur-md bg-slate-950/20">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all font-bold text-sm"
                    >
                        Trước
                    </button>

                    <div className="flex items-center gap-1.5">
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl font-bold transition-all text-sm ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }
                            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                return <span key={pageNum} className="text-slate-600 px-1">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all font-bold text-sm"
                    >
                        Tiếp
                    </button>
                </div>
            )}

            {/* Detail Overlay */}
            <FlowDetail
                flow={selectedFlow}
                onClose={() => setSelectedFlow(null)}
            />
        </div>
    );
};

export default FlowList;
