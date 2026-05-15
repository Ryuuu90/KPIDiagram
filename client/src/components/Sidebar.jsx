import React from 'react';
import { NavLink } from 'react-router-dom';
import finansiaLogo from '../public/finansia-logo.jpeg';
import { useKeycloak } from '../contexts/KeycloakContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import api from '../utils/api';
import toast from 'react-hot-toast';

import {
  LayoutDashboard,
  PieChart,
  Settings,
  FileText,
  TrendingUp,
  LogOut,
  UserCircle,
  Database,
  Users,
} from 'lucide-react';

const Sidebar = () => {
  const { userInfo, logout } = useKeycloak();
  const { t } = useTranslation();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: t('sidebar.comptable'), path: '/' },
    { icon: <PieChart size={20} />, label: t('sidebar.ratio'), path: '/ratio' },
    { icon: <TrendingUp size={20} />, label: t('sidebar.simulation'), path: '/simulation' },
    { icon: <FileText size={20} />, label: t('sidebar.reports'), path: '/reports' },
    { icon: <Users size={20} />, label: t('sidebar.loan_calculator'), path: '/loan-calculator' },
    { icon: <Settings size={20} />, label: t('sidebar.investissement'), path: '/investissement' },
    { icon: <Database size={20} />, label: t('sidebar.donnees'), path: '/data-management' },
  ];

  const displayName = userInfo
    ? (userInfo.firstName || userInfo.username || t('sidebar.utilisateur'))
    : t('sidebar.chargement');

  const displayEmail = userInfo?.email || '';

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadToast = toast.loading("Importation des données en cours...");
    try {
      await api.post('/upload-arborescence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Données importées avec succès ! Actualisez pour voir les changements.", { id: loadToast });
      // Optionally trigger a page refresh or state update here
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de l'importation.", { id: loadToast });
    }
  };

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
        <LanguageSwitcher />

        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
          {t('sidebar.menu')}
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
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-[.active]:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-orange-100 p-3">
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-orange-50/60 mb-2">
          <div className="flex-shrink-0 text-orange-400">
            <UserCircle size={32} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-700 truncate">{displayName}</p>
            {displayEmail && (
              <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500
            hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100
            transition-all duration-200 group"
        >
          <span className="transition-transform duration-200 group-hover:scale-110">
            <LogOut size={18} />
          </span>
          <span className="font-medium text-sm">{t('sidebar.deconnexion')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
