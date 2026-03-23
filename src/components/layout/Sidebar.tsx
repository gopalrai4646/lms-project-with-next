'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

const userMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Courses', href: '/courses', icon: '📚' },
  { name: 'Training Plans', href: '/training-plans', icon: '📋' },
  { name: 'Account Settings', href: '/settings', icon: '⚙️' },
];

const adminMenuItems = [
  { name: 'Admin Dashboard', href: '/admin', icon: '📊' },
  { name: 'Manage Courses', href: '/admin/courses', icon: '🛠️' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useAppSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <aside 
      className={`fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200 transition-all duration-500 ease-in-out z-40 group/sidebar ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-slate-50 transition-all z-50 text-slate-400 hover:text-indigo-600"
      >
        {isCollapsed ? '→' : '←'}
      </button>

      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group/item relative overflow-hidden ${
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
      
      {!isCollapsed && (
        <div className="absolute bottom-8 left-4 right-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl text-white shadow-xl shadow-indigo-100 overflow-hidden relative group/card">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover/card:bg-white/20 transition-all" />
            <p className="text-[10px] font-black tracking-widest text-indigo-200 mb-1 uppercase">Pro Plan</p>
            <p className="text-sm font-bold mb-4 leading-tight">Unlock all premium courses</p>
            <button className="w-full py-2.5 bg-white text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all shadow-sm active:scale-95">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
