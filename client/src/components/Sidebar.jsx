import React from 'react';
import { NavLink } from 'react-router-dom';
import finansiaLogo from '../public/finansia-logo.jpeg';

import { LayoutDashboard, PieChart, Settings, LogOut, FileText, TrendingUp, Users } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Élément comptable', path: '/' },
        { icon: <PieChart size={20} />, label: 'Ratio', path: '/ratio' },
        { icon: <TrendingUp size={20} />, label: 'Simulation', path: '/simulation' },
        { icon: <FileText size={20} />, label: 'Reports', path: '/reports' },
        { icon: <Users size={20} />, label: 'Loan Calculator', path: '/loan-calculator' },
        { icon: <Settings size={20} />, label: 'Investissement', path: '/investissement' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white/70 backdrop-blur-xl border-r border-orange-100 text-slate-600 flex flex-col z-50 transition-all duration-300">
            {/* Logo Section */}
            <div className="p-4 border-b border-orange-50/50 flex items-center justify-center">
                <img
                    src={finansiaLogo}
                    alt="Finansia Logo"
                    className="h-16 w-auto object-contain"
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Menu
                </div>

                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive
                                ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100'
                                : 'hover:bg-orange-50/50 hover:text-orange-500 border border-transparent'}
            `}
                    >
                        <span className="transition-transform duration-200 group-hover:scale-110">
                            {item.icon}
                        </span>
                        <span className="font-medium text-sm">{item.label}</span>
                        {/* Active Indicator */}
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-[.active]:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </nav>

        </aside>
    );
};

export default Sidebar;
