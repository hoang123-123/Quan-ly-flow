import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, Hash, Info, ExternalLink, Zap, Activity, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';
import { flowService } from '../services/flowService';

const FlowDetail = ({ flow, onClose }) => {
  const [runs, setRuns] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [flowStructure, setFlowStructure] = useState({ trigger: null, actions: [] });
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [expandedRun, setExpandedRun] = useState(null);
  const [copiedMetadata, setCopiedMetadata] = useState(false);

  const handleCopyMetadata = () => {
    if (!metadata) return;
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopiedMetadata(true);
    setTimeout(() => setCopiedMetadata(false), 2000);
  };

  useEffect(() => {
    if (flow) {
      const fetchData = async () => {
        setLoadingRuns(true);
        try {
          // Lấy cả metadata chi tiết và lịch sử chạy
          const [metadataRes, history] = await Promise.all([
            flowService.getFlowMetadata(flow),
            flowService.getFlowRuns(flow)
          ]);

          setMetadata(metadataRes);
          setFlowStructure(flowService.parseFlowStructure(metadataRes));
          setRuns(history);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoadingRuns(false);
        }
      };
      fetchData();
    } else {
      setRuns([]);
      setMetadata(null);
      setFlowStructure({ trigger: null, actions: [] });
      setExpandedRun(null);
    }
  }, [flow]);

  if (!flow) return null;

  const name = flow.properties?.displayName || flow.name || 'Unnamed Flow';
  const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';
  const createdTime = flow.properties?.createdTime || flow.createdTime;
  const lastModifiedTime = flow.properties?.lastModifiedTime || flow.lastModifiedTime;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Backdrop */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Sidebar Content */}
        <Motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-[#0f172a] shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <Zap size={20} fill="currentColor" />
              </div>
              <h2 className="text-xl font-bold text-white truncate max-w-[350px]">{name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-10">
            {/* Header Status + Essential Metadata */}
            <div className="relative pt-9 pb-6 px-6 rounded-2xl bg-slate-900/40 border border-white/12">
              <span className="absolute top-0 left-6 -translate-y-1/2 bg-[#0f172a] px-3 text-xs font-black text-slate-500 tracking-[0.25em] uppercase z-10">
                STATUS
              </span>

              <div className="space-y-6">
                {/* Main Status Row */}
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isActive ? 'Đang hoạt động' : 'Đã dừng'}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    </div>
                  </div>
                  <a
                    href={`https://make.powerautomate.com/environments/${flowService.parseFlowIds(flow).environmentId}/flows/${flowService.parseFlowIds(flow).flowId}/details`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Mở trong Power Automate
                  </a>
                </div>

                {/* Technical Metadata Row (Dates Only) */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <Clock size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Ngày tạo</p>
                      <p className="text-xs text-slate-400">
                        {createdTime ? new Date(createdTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <Clock size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Cập nhật</p>
                      <p className="text-xs text-slate-400">
                        {lastModifiedTime ? new Date(lastModifiedTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow Structure Section */}
            {flowStructure.trigger && (
              <div className="relative pt-9 pb-6 px-6 rounded-2xl bg-slate-900/40 border border-white/12">
                <span className="absolute top-0 left-6 -translate-y-1/2 bg-[#0f172a] px-3 text-xs font-black text-slate-500 tracking-[0.25em] uppercase">
                  FLOW STRUCTURE
                </span>
                <div className="space-y-4">
                  {/* Trigger */}
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-2">🎯 Trigger</p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-sm font-semibold text-blue-400">{flowStructure.trigger.name}</span>
                      <span className="text-xs text-slate-400">({flowStructure.trigger.type})</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {flowStructure.actions.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-2">📋 Actions ({flowStructure.actions.length})</p>
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {flowStructure.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                            <span className="text-xs font-mono text-slate-500 w-6">{index + 1}.</span>
                            <span className="text-sm font-medium text-white flex-1">{action.name}</span>
                            <span className="text-xs text-slate-400 px-2 py-1 rounded bg-white/5">{action.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Run History Table */}
            <div className="relative pt-9 pb-1 rounded-2xl bg-slate-900/40 border border-white/12 space-y-0">
              <span className="absolute top-0 left-6 -translate-y-1/2 bg-[#0f172a] px-3 text-xs font-black text-slate-500 tracking-[0.25em] uppercase z-10">
                RUN HISTORY
              </span>
              <div className="rounded-b-2xl overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {loadingRuns ? (
                  <div className="p-10 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Đang tải lịch sử...</p>
                  </div>
                ) : runs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Không có lịch sử chạy dữ liệu hoặc lỗi kết nối.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-3 font-semibold text-slate-300">Thời gian</th>
                        <th className="p-3 font-semibold text-slate-300">Trạng thái</th>
                        <th className="p-3 font-semibold text-slate-300">Lỗi tại / Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {runs.map((run, i) => {
                        const runProps = run.properties || run;
                        const status = runProps.status;
                        const startTime = runProps.startTime;
                        const errorInfo = status === 'Failed' ? flowService.parseRunError(run) : null;
                        const isExpanded = expandedRun === i;

                        return (
                          <React.Fragment key={i}>
                            <tr
                              className={`transition-colors cursor-pointer ${isExpanded ? 'bg-white/10' : 'hover:bg-white/[0.04]'}`}
                              onClick={() => status === 'Failed' && setExpandedRun(isExpanded ? null : i)}
                            >
                              <td className="p-3 text-slate-400 text-xs font-mono">
                                {startTime ? new Date(startTime).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit'
                                }) : 'N/A'}
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status === 'Succeeded' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                                  status === 'Failed' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
                                    'text-blue-400 bg-blue-400/10 border-blue-400/20'
                                  }`}>
                                  {status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                              </td>
                              <td className="p-3">
                                {errorInfo ? (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-rose-400 font-medium">Lỗi: {errorInfo.action}</span>
                                    <span className="text-[10px] text-slate-500 italic">Code: {errorInfo.code}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-600">—</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && errorInfo && (
                              <tr className="bg-rose-500/5">
                                <td colSpan="3" className="p-4 border-b border-rose-500/10">
                                  <div className="p-3 rounded-lg bg-black/40 border border-rose-500/20">
                                    <p className="text-[11px] text-rose-300/80 font-mono whitespace-pre-wrap break-all leading-relaxed">
                                      {errorInfo.message}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Metadata for Debugging */}
            <div className="relative pt-9 pb-6 px-6 rounded-2xl bg-slate-900/40 border border-white/12">
              <span className="absolute top-0 left-6 -translate-y-1/2 bg-[#0f172a] px-3 text-xs font-black text-slate-500 tracking-[0.25em] uppercase z-10 flex items-center gap-2">
                METADATA
                <button
                  onClick={handleCopyMetadata}
                  className={`p-1 rounded hover:bg-white/10 transition-all ${copiedMetadata ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
                  title="Copy JSON structure"
                >
                  {copiedMetadata ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </span>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <pre className="text-xs text-blue-300/80 font-mono">
                  {metadata ? JSON.stringify(metadata, null, 2) : 'Đang tải metadata...'}
                </pre>
              </div>
            </div>
          </div>
        </Motion.div>
      </div>
    </AnimatePresence>
  );
};


export default FlowDetail;
