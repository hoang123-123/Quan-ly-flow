import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

// Helper: Parse run ID to extract URLs
const parseRunId = (runId) => {
    // runId format: /providers/Microsoft.ProcessSimple/environments/{envId}/flows/{flowId}/runs/{runId}
    if (!runId) return { flowUrl: null, runUrl: null };

    const match = runId.match(/environments\/([^/]+)\/flows\/([^/]+)(?:\/runs\/([^/]+))?/);
    if (!match) return { flowUrl: null, runUrl: null };

    const [, envId, flowId, runName] = match;
    const baseUrl = 'https://make.powerautomate.com';
    const flowUrl = `${baseUrl}/environments/${envId}/flows/${flowId}/details`;
    const runUrl = runName ? `${baseUrl}/environments/${envId}/flows/${flowId}/runs/${runName}` : null;

    return { flowUrl, runUrl };
};

const FailuresDrawer = ({ isOpen, onClose, failures }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page khi search thay đổi
    const filteredData = useMemo(() => {
        setCurrentPage(1);
        return (failures || []).filter(fail =>
            fail.flowName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fail.error?.message?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [failures, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex-shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Flow run failures</h2>
                                        <p className="text-sm text-slate-400">{failures?.length || 0} lỗi được ghi nhận</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm kiếm theo tên flow hoặc lỗi..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="text-slate-500 font-medium border-b border-slate-800 sticky top-0 bg-slate-900">
                                    <tr>
                                        <th className="pb-3 pl-2">Flow name</th>
                                        <th className="pb-3">Trigger type</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Run start</th>
                                        <th className="pb-3">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((fail, index) => {
                                            const { flowUrl, runUrl } = parseRunId(fail.runId);
                                            return (
                                                <tr key={index} className="hover:bg-slate-800/50 transition-colors group">
                                                    <td className="py-3 pl-2 max-w-[250px]" title={fail.flowName}>
                                                        {flowUrl ? (
                                                            <a
                                                                href={flowUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-slate-300 hover:text-blue-400 transition-colors truncate flex items-center gap-1"
                                                            >
                                                                <span className="truncate">{fail.flowName}</span>
                                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-300 truncate">{fail.flowName}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">{fail.type || 'Automated'}</td>
                                                    <td className="py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></div>
                                                            Failed
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        {runUrl ? (
                                                            <a
                                                                href={runUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1"
                                                            >
                                                                {new Date(fail.startTime).toLocaleString('vi-VN')}
                                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                                            </a>
                                                        ) : (
                                                            new Date(fail.startTime).toLocaleString('vi-VN')
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-red-300 max-w-[250px] truncate" title={fail.error?.message}>
                                                        {fail.error?.message || 'Unknown Error'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                                Không tìm thấy kết quả nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-800 flex-shrink-0 flex justify-between items-center">
                                <span className="text-sm text-slate-500">
                                    Trang {currentPage} / {totalPages} ({filteredData.length} kết quả)
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-white" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FailuresDrawer;

