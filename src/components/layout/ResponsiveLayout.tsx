'use client';

import { useAppSelector } from '@/store/hooks';

interface Props {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: Props) {
  const { isImpersonating } = useAppSelector((state) => state.auth);
  const { isSidebarCollapsed } = useAppSelector((state) => state.settings);

  return (
    <main 
      className={`transition-all duration-300 min-h-screen ${
        isImpersonating ? 'pt-[104px]' : 'pt-16'
      } ${
        isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
      } pl-0`}
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}
