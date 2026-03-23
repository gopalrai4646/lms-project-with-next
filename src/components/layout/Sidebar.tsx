'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'My Courses', href: '/courses', icon: '📚' },
  { name: 'Assignments', href: '/assignments', icon: '📝' },
  { name: 'Messages', href: '/messages', icon: '✉️' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 p-4 transition-all duration-300">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600 pl-3'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="absolute bottom-8 left-4 right-4">
        <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl text-white shadow-lg shadow-indigo-100">
          <p className="text-xs font-medium text-indigo-100 mb-1">PRO PLAN</p>
          <p className="text-sm font-bold mb-3">Upgrade for more courses</p>
          <button className="w-full py-2 bg-white text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
}
