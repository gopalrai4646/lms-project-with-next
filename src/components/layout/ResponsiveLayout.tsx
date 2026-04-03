'use client';

import { useAppSelector } from '@/store/hooks';

interface Props {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: Props) {
  const { isSidebarCollapsed, isMobileMenuOpen } = useAppSelector((state) => state.settings);

  return (
    <main 
      className={`transition-all duration-300 pt-16 min-h-screen ${
        isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
      } pl-0`}
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}
