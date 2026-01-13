import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, AlertTriangle, Loader2, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import FlowCard from './components/FlowCard';
import FlowDetail from './components/FlowDetail';
import { flowService } from './services/flowService';

function App() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchFlows = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await flowService.getFlows();
        setFlows(data);
      } catch (err) {
        setError('Không thể kết nối với Power Automate. Vui lòng kiểm tra lại API URL và kết nối mạng.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlows();
  }, [refreshKey]);

  const filteredFlows = flows.filter(flow => {
    const name = (flow.properties?.displayName || flow.name || '').toLowerCase();
    const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';

    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && isActive) ||
      (activeFilter === 'disabled' && !isActive);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main className="flex-1 ml-72 p-8 lg:p-12 overflow-y-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Quản lý Flows</h2>
            <div className="flex items-center gap-2 text-slate-400">
              <ListFilter size={16} />
              <span>Đang hiển thị <b className="text-blue-400">{filteredFlows.length}</b> luồng tự động</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all group"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-active:rotate-180 transition-transform duration-500'} />
            </button>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm flow..."
                className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl w-full md:w-80 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 blur-lg bg-blue-500/20 animate-pulse" />
              </div>
              <p className="text-slate-400 font-medium">Đang tải dữ liệu từ Power Automate...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-3xl bg-rose-500/5 border border-rose-500/20 flex flex-col items-center text-center max-w-2xl mx-auto mt-10"
            >
              <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 mb-6">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20"
              >
                Thử lại ngay
              </button>
            </motion.div>
          ) : filteredFlows.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 rounded-3xl bg-white/5 border border-white/10 text-slate-500 mb-6">
                <Filter size={48} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy flow nào</h3>
              <p className="text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredFlows.map((flow, index) => (
                <FlowCard
                  key={flow.id || flow.name || index}
                  flow={flow}
                  onClick={setSelectedFlow}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Overlay */}
        <FlowDetail
          flow={selectedFlow}
          onClose={() => setSelectedFlow(null)}
        />
      </main>
    </div>
  );
}

export default App;
