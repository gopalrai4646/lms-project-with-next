'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';

import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Settings, 
  BarChart3, 
  Wrench, 
  Users,
  PieChart,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { translations } from '@/utils/translations';
import { setMobileMenuOpen } from '@/store/slices/settingsSlice';

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector((state) => state.auth);
  const { language, isMobileMenuOpen } = useAppSelector((state) => state.settings);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      dispatch(setMobileMenuOpen(false));
    }
  };

  const t = translations[language].nav;

  if (!user) return null;

  const userMenuItems = [
    { name: t.dashboard, href: '/dashboard', icon: <LayoutDashboard size={22} /> },
    { name: t.courses, href: '/dashboard/courses', icon: <BookOpen size={22} /> },
    { name: t.trainingPlans, href: '/training-plans', icon: <ClipboardList size={22} /> },
    { name: t.accountSettings, href: '/settings', icon: <Settings size={22} /> },
  ];

  const adminMenuItems = [
    { name: t.adminDashboard, href: '/admin', icon: <BarChart3 size={22} /> },
    { name: t.adminReport, href: '/admin/report', icon: <PieChart size={22} /> },
    { name: t.topCourses, href: '/admin/top-courses', icon: <BarChart3 size={22} /> },
    { name: t.topTrainingPlans, href: '/admin/top-training-plans', icon: <Award size={22} /> },
    { name: t.manageCourses, href: '/admin/courses', icon: <Wrench size={22} /> },
    { name: t.trainingPlans, href: '/admin/training-plans', icon: <ClipboardList size={22} /> },
    { name: t.users, href: '/admin/users', icon: <Users size={22} /> },
    { name: t.settings, href: '/settings', icon: <Settings size={22} /> },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => dispatch(setMobileMenuOpen(false))}
        />
      )}
      
      <aside 
        className={`fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-50 group/sidebar w-64 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-4 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-xs shadow-sm hover:bg-slate-50 transition-all z-50 text-slate-400 hover:text-indigo-600"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3.5 rounded-2xl transition-all duration-300 group/item relative overflow-hidden ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <span className={`text-xl shrink-0 transition-transform duration-300 group-hover/item:scale-125 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`whitespace-nowrap transition-all duration-500 origin-left ${
                isCollapsed ? 'opacity-0 scale-0 w-0' : 'opacity-100 scale-100'
              }`}>
                {item.name}
              </span>
              
              {isActive && !isCollapsed && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 rounded-full my-3 mr-1" />
              )}
            </Link>
          );
        })}
      </div>
      

    </aside>
    </>
  );
}
