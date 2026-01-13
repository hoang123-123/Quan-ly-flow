import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, Hash, Info, ExternalLink, Zap, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { flowService } from '../services/flowService';

const FlowDetail = ({ flow, onClose }) => {
  const [runs, setRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [hasProxy, setHasProxy] = useState(!!import.meta.env.VITE_FLOW_RUNS_API_URL);

  useEffect(() => {
    if (flow) {
      const fetchData = async () => {
        setLoadingRuns(true);
        try {
          // Lấy cả metadata chi tiết và lịch sử chạy
          const [metadata, history] = await Promise.all([
            flowService.getFlowMetadata(flow),
            flowService.getFlowRuns(flow)
          ]);

          setRuns(history);
          setAnalysis(flowService.analyzeRuns(history));
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoadingRuns(false);
        }
      };
      fetchData();
    } else {
      setRuns([]);
      setAnalysis(null);
    }
  }, [flow]);

  if (!flow) return null;

  const name = flow.properties?.displayName || flow.name || 'Unnamed Flow';
  const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';
  const createdTime = flow.properties?.createdTime || flow.createdTime;
  const lastModifiedTime = flow.properties?.lastModifiedTime || flow.lastModifiedTime;
  const flowId = flow.id || flow.name;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Sidebar Content */}
        <motion.div
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
            {/* Header Status */}
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái hiện tại</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isActive ? 'Đang hoạt động' : 'Đã dừng'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                </div>
              </div>
              <button className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                <ExternalLink size={16} />
                Mở trong Power Automate
              </button>
            </div>

            {/* Analysis Section */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Activity size={16} />
                PHÂN TÍCH HIỆU SUẤT (GẦN ĐÂY)
              </h3>

              {!hasProxy && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs mb-4">
                  <p className="flex items-center gap-2 font-semibold mb-1">
                    <AlertTriangle size={14} />
                    Yêu cầu cấu hình Proxy
                  </p>
                  Để xem dữ liệu lịch sử chạy chính xác, bạn cần cấu hình Proxy Flow trong `.env.local`.
                </div>
              )}

              {analysis && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-slate-500 font-medium mb-1">Xác suất lỗi</p>
                    <p className={`text-3xl font-bold ${parseFloat(analysis.failureRate) > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {analysis.failureRate}%
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-slate-500 font-medium mb-1">Tổng lượt chạy</p>
                    <p className="text-3xl font-bold text-white">{analysis.total || 0}</p>
                  </div>
                </div>
              )}

              {analysis?.commonErrors?.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={14} />
                    CÁC LỖI THƯỜNG GẶP
                  </p>
                  <div className="space-y-1">
                    {analysis.commonErrors.slice(0, 3).map((err, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-400 capitalize">
                        <span>{err.code}</span>
                        <span className="font-mono text-rose-300">x{err.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Run History Table */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Clock size={16} />
                LỊCH SỬ CHẠY GẦN ĐÂY
              </h3>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                {loadingRuns ? (
                  <div className="p-10 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Đang tải lịch sử...</p>
                  </div>
                ) : runs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-white/5">
                    Không có lịch sử chạy dữ liệu hoặc lỗi kết nối.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-3 font-semibold text-slate-300">Thời gian</th>
                        <th className="p-3 font-semibold text-slate-300">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {runs.slice(0, 5).map((run, i) => {
                        const runProps = run.properties || run;
                        const status = runProps.status;
                        const startTime = runProps.startTime;
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Information Grid */}
            <section className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Info size={16} />
                THÔNG TIN CHI TIẾT
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <InfoItem icon={Hash} label="Flow ID" value={flowId} />
                <InfoItem icon={Clock} label="Ngày tạo" value={createdTime ? new Date(createdTime).toLocaleString('vi-VN') : 'N/A'} />
                <InfoItem icon={Clock} label="Chỉnh sửa lần cuối" value={lastModifiedTime ? new Date(lastModifiedTime).toLocaleString('vi-VN') : 'N/A'} />
              </div>
            </section>

            {/* Raw JSON for Debugging Admin */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400">DỮ LIỆU GỐC (RAW DATA)</h3>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
                <pre className="text-xs text-blue-300/80 font-mono">
                  {JSON.stringify(flow, null, 2)}
                </pre>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
    <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-white font-semibold mt-0.5 break-all">{value}</p>
    </div>
  </div>
);

export default FlowDetail;
