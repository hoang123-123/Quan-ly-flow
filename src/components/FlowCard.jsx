import { Play, Square, Clock, Activity, RefreshCw, ArrowUpRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const FlowCard = ({ flow, onClick, isUpdating }) => {
    const isActive = flow.properties?.state === 'Started' || flow.state === 'Started' || flow.status === 'Active';
    const name = flow.properties?.displayName || flow.name || 'Unnamed Flow';
    const modifiedTime = flow.properties?.lastModifiedTime || flow.lastModifiedTime;
    const todayRuns = flow.todayRuns || 0;
    const successRate = flow.successRate || 0;

    return (
        <Motion.div
            whileHover={{
                y: -4,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.35)',
                transition: { duration: 0.1, ease: 'easeOut' }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(flow)}
            className="group relative overflow-hidden rounded-2xl border border-white/12 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-indigo-500/50 cursor-pointer shadow-2xl flex flex-col gap-6"
        >
            {/* Row 1: Identity (Title remains Bold) */}
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors line-clamp-1 flex-1 tracking-tight" title={name}>
                    {name}
                </h3>
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-medium tracking-widest flex-shrink-0 ${isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'} border border-current/10`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
            </div>

            {/* Consolidated Health & Activity Block (Tighter Gapping) */}
            <div className="flex flex-col gap-1.5">
                {/* Live Metrics Row (Normalized Color & Weight) */}
                <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-lg font-medium tabular-nums">{todayRuns}</span>
                        <span className="text-[11px] font-normal uppercase tracking-widest leading-none">lượt chạy</span>
                        {isUpdating && <RefreshCw size={14} className="animate-spin text-indigo-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-normal uppercase tracking-widest">Độ ổn định</span>
                        <span className={`font-medium tracking-tight ${parseFloat(successRate) > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {successRate ? `${successRate}%` : '---'}
                        </span>
                    </div>
                </div>

                {/* Progress Bar Tier */}
                <div className="h-1.5 w-full bg-slate-800/60 rounded-full overflow-hidden">
                    <Motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${successRate || 0}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                    />
                </div>
            </div>

            {/* Row 4: Symmetrical Footer (Simplified, No UUID) */}
            <div className="flex items-center justify-between pt-1 text-[10px] font-normal">
                <div className="flex items-center gap-2 text-slate-400 transition-colors group-hover:text-slate-300">
                    <span className="uppercase tracking-widest text-[9px] opacity-80">Cập nhật:</span>
                    <span className="font-mono tracking-tight text-slate-300">
                        {modifiedTime ? new Date(modifiedTime).toLocaleDateString('vi-VN') : '---'}
                    </span>
                </div>
            </div>
        </Motion.div>
    );
};

export default FlowCard;
