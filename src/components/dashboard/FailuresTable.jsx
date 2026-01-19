import React, { useState, useMemo } from 'react';
import { AlertCircle, Search, ExternalLink } from 'lucide-react';

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

const FailuresTable = ({ failures, onSeeAll }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Lọc theo search term
    const filteredFailures = useMemo(() => {
        if (!failures) return [];
        return failures.filter(fail =>
            fail.flowName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fail.error?.message?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [failures, searchTerm]);

    // Chỉ hiển thị 10 items đầu tiên
    const displayData = filteredFailures.slice(0, 10);

    if (!failures || failures.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center text-slate-500 h-[200px] mb-8">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p>No recent failures found.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg overflow-hidden flex flex-col h-[680px] mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-slate-200">Flow run failures</h3>
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search Box */}
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <button
                        onClick={onSeeAll}
                        className="text-sm text-blue-400 hover:text-blue-300 whitespace-nowrap"
                    >
                        See all failed runs
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 mb-4">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-slate-500 font-medium border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                        <tr>
                            <th className="pb-3 pl-2">Flow name</th>
                            <th className="pb-3">Trigger type</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Run start</th>
                            <th className="pb-3">Error</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {displayData.length > 0 ? (
                            displayData.map((fail, index) => {
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
                                        <td className="py-3 text-red-300 max-w-[200px] truncate" title={fail.error?.message}>
                                            {fail.error?.message || 'Unknown Error'}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                    Không tìm thấy kết quả nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-center flex-shrink-0 border-t border-slate-800 p-4 -mx-6 -mb-6 bg-slate-800/50 rounded-b-xl backdrop-blur-sm">
                <span className="text-xs text-slate-400 font-medium">
                    Hiển thị {displayData.length} / {filteredFailures.length} kết quả.
                    {filteredFailures.length > 10 && (
                        <button onClick={onSeeAll} className="text-blue-400 hover:underline ml-1">Xem tất cả</button>
                    )}
                </span>
            </div>
        </div>
    );
};

export default FailuresTable;


