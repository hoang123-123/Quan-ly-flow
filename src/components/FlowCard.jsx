import React from 'react';
import { Play, Square, Clock, ChevronRight, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FlowCard = ({ flow, onClick }) => {
    const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';
    const name = flow.properties?.displayName || flow.name || 'Unnamed Flow';
    const modifiedTime = flow.properties?.lastModifiedTime || flow.lastModifiedTime;

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onClick(flow)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer"
        >
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {isActive ? <Play size={24} fill="currentColor" /> : <Square size={24} fill="currentColor" />}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border border-current/20`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isActive ? 'ĐANG CHẠY' : 'ĐÃ TẮT'}
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {name}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{modifiedTime ? new Date(modifiedTime).toLocaleDateString('vi-VN') : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={14} />
                        <span className="truncate max-w-[100px] text-xs">ID: {flow.name?.substring(0, 8)}...</span>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={20} className="text-blue-400" />
            </div>
        </motion.div>
    );
};

export default FlowCard;
