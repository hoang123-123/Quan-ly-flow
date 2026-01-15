import React, { useState } from 'react';
import { X, Search, Cloud } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const TopFlowsDrawer = ({ isOpen, onClose, data }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <Motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Top flow runs</h3>
                                <p className="text-xs text-slate-400 mt-1">Danh sách chi tiết lượt chạy của các flow</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm flow..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* List Header */}
                        <div className="px-6 py-2 bg-slate-800/50 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Flow name</span>
                            <span>Run count</span>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Cloud className="text-blue-400 shrink-0" size={18} />
                                            <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-400 font-mono">
                                            {item.count.toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-500">
                                    Không tìm thấy dữ liệu
                                </div>
                            )}
                        </div>
                    </Motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TopFlowsDrawer;
