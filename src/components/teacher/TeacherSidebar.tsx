'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useTranslation } from 'react-i18next';

import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  UserSquare2,
  ClipboardList
} from 'lucide-react';

import { setMobileMenuOpen, setSidebarCollapsed } from '@/store/slices/settingsSlice';

export default function TeacherSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector((state) => state.auth);
  const { isMobileMenuOpen, isSidebarCollapsed } = useAppSelector((state) => state.settings);
  const { t: i18nT } = useTranslation();
  const t = i18nT('teacher', { returnObjects: true }) as any;

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar_collapsed');
    if (savedCollapsed === 'true') {
      dispatch(setSidebarCollapsed(true));
    }
  }, [dispatch]);

  const handleToggleCollapse = () => {
    const newState = !isSidebarCollapsed;
    dispatch(setSidebarCollapsed(newState));
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      dispatch(setMobileMenuOpen(false));
    }
  };

  if (!user || role !== 'teacher') return null;

  const menuItems = [
    { name: t?.nav?.dashboard || 'Dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: t?.nav?.manageCourses || 'Manage Courses', href: '/teacher/courses', icon: <BookOpen size={18} /> },
    { name: t?.nav?.trainingPlans || 'Training Plans', href: '/teacher/training-plans', icon: <ClipboardList size={18} /> },
    { name: t?.nav?.manageUsers || 'Manage Users', href: '/teacher/users', icon: <UserSquare2 size={18} /> },
  ];

  if (user?.enrolledCourses && user.enrolledCourses.length > 0) {
    menuItems.push({ name: t?.nav?.assignedCourses || 'Assigned Courses', href: '/dashboard/courses', icon: <BookOpen size={18} /> });
  }

  if (user?.assignedTrainingPlans && user.assignedTrainingPlans.length > 0) {
    menuItems.push({ name: t?.nav?.assignedPlans || 'Assigned Plans', href: '/training-plans', icon: <ClipboardList size={18} /> });
  }

  menuItems.push({ name: t?.nav?.account || 'Account', href: '/teacher/account', icon: <Settings size={18} /> });

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => dispatch(setMobileMenuOpen(false))}
        />
      )}
      
      <aside 
        className={`fixed left-0 top-16 bottom-0 bg-slate-50 border-r border-slate-200/70 transition-all duration-300 ease-in-out z-50 group/sidebar w-64 flex flex-col ${
          isSidebarCollapsed ? 'md:w-16' : 'md:w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <button 
          onClick={handleToggleCollapse}
          className="hidden md:flex absolute -right-3 top-5 w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-xs shadow-sm hover:bg-slate-50 transition-all z-50 text-slate-400 hover:text-slate-600"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                title={isSidebarCollapsed ? item.name : ''}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-md transition-all duration-150 group/item relative overflow-hidden text-sm ${
                  isActive
                    ? 'bg-slate-200/60 text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-500 hover:bg-slate-200/40 hover:text-slate-900 font-medium'
                }`}
              >
                <span className={`shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover/item:text-slate-600'}`}>
                  {item.icon}
                </span>
                <span className={`whitespace-nowrap transition-all duration-300 origin-left ${
                  isSidebarCollapsed ? 'opacity-0 scale-0 w-0 hidden' : 'opacity-100 scale-100'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
