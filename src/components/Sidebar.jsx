import React from 'react';
import { LayoutGrid, PlayCircle, StopCircle, Settings, HelpCircle, LogOut } from 'lucide-react';

const Sidebar = ({ activeFilter, onFilterChange }) => {
    const menuItems = [
        { id: 'all', label: 'Tất cả Flows', icon: LayoutGrid },
        { id: 'active', label: 'Đang hoạt động', icon: PlayCircle },
        { id: 'disabled', label: 'Đã dừng', icon: StopCircle },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-72 border-r border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-6 flex flex-col z-10">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Activity size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">FlowManager</h1>
                    <p className="text-xs text-slate-500 font-medium">Premium Admin Kit</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFilter === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onFilterChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-blue-400' : 'group-hover:text-white transition-colors'} />
                            <span className="font-medium text-sm">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-white/5 space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
                    <Settings size={18} />
                    Cài đặt
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium text-rose-400/80 hover:text-rose-400">
                    <LogOut size={18} />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

const Activity = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default Sidebar;
