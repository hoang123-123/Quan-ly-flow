import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ShieldOff, ExternalLink } from 'lucide-react';

const UnsharedFlowsDrawer = ({ isOpen, onClose, data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = (data || []).filter(flow =>
        flow.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-800 z-50 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <ShieldOff className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Flows chưa chia sẻ quyền</h2>
                                        <p className="text-sm text-slate-400">{data?.length || 0} flows cần được chia sẻ</p>
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
                                    placeholder="Tìm kiếm flow..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                                />
                            </div>
                        </div>

                        {/* Flow List */}
                        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 180px)' }}>
                            <div className="space-y-2">
                                {filteredData.length > 0 ? (
                                    filteredData.map((flow, index) => (
                                        <div
                                            key={flow.id || index}
                                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <span className="text-slate-300 truncate text-sm group-hover:text-amber-400 transition-colors" title={flow.name}>
                                                    {flow.name}
                                                </span>
                                            </div>
                                            <a
                                                href={`https://make.powerautomate.com/environments/${flow.environmentId}/flows/${flow.flowId}/details`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Mở trong Power Automate"
                                            >
                                                <ExternalLink className="w-4 h-4 text-slate-400" />
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                        <ShieldOff className="w-12 h-12 mb-3 opacity-30" />
                                        <span className="text-sm">Không tìm thấy flow nào</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
                            <p className="text-xs text-slate-500 text-center">
                                Để xem lịch sử các flow này, hãy yêu cầu chủ sở hữu chia sẻ Connection với bạn.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UnsharedFlowsDrawer;
