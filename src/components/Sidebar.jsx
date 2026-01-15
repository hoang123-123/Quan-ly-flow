import React from 'react';
import {
    Activity,
    BarChart3,
    AlertCircle,
    ListTree,
    Settings,
    LogOut,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';

const Sidebar = ({ activeView, onViewChange }) => {
    const menuGroups = [
        {
            title: 'QUẢN LÝ',
            items: [
                { id: 'flows', label: 'Danh sách flow', icon: ListTree },
            ]
        },
        {
            title: 'CHẨN ĐOÁN',
            items: [
                { id: 'overview', label: 'Tổng quan hệ thống', icon: Activity },
                { id: 'errors', label: 'Phân tích lỗi', icon: AlertCircle },
            ]
        }
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-72 border-r border-white/5 bg-[#020617] p-6 flex flex-col z-20">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <BarChart3 size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">Flow Analytics</h1>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">System Monitor</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-8">
                {menuGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                        <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onViewChange(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                                            ? 'bg-blue-600/10 text-white shadow-sm shadow-blue-500/5'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`transition-colors duration-300 ${isActive ? 'text-blue-500' : 'group-hover:text-slate-200'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <span className="font-medium text-[13.5px]">{item.label}</span>

                                        {isActive && (
                                            <>
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom Menu */}
            <div className="pt-6 border-t border-white/5 space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all text-sm font-medium">
                    <Settings size={18} />
                    <span>Cài đặt</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500/70 hover:bg-rose-500/5 hover:text-rose-500 transition-all text-sm font-medium">
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
