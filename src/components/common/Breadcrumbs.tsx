'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { translations } from '@/utils/translations';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  
  const { language } = useAppSelector((state) => state.settings);
  const { courses } = useAppSelector((state) => state.courses);
  const { trainingPlans } = useAppSelector((state) => state.trainingPlans);
  const languageNav = translations[language].nav;
  
  if (!pathname || pathname === '/') return null;

  const paths = pathname.split('/').filter(Boolean);
  if (paths.length === 0) return null;

  // ─── Sidebar Page Check ───
  const isDashboardOrAdmin = paths[0] === 'dashboard' || paths[0] === 'admin';
  if (!planId) {
    if (isDashboardOrAdmin && paths.length <= 2) return null;
    if (!isDashboardOrAdmin && paths.length <= 1) return null;
  }

  // ─── Breadcrumb Stack Generation ───
  let breadcrumbItems: { label: string; href: string; isLast: boolean }[] = [];

  // 1. Add Training Plan Context if planId is present
  if (planId) {
    const plan = trainingPlans.find(tp => tp.id === planId);
    breadcrumbItems.push({ 
      label: languageNav.trainingPlans, 
      href: '/training-plans', 
      isLast: false 
    });
    if (plan) {
      breadcrumbItems.push({ 
        label: plan.name, 
        href: `/training-plans/${planId}`, 
        isLast: false 
      });
    }
  }

  // 2. Process current path segments
  paths.forEach((path, index) => {
    // Skip root segments (dashboard/admin)
    if (index === 0 && (path === 'dashboard' || path === 'admin')) return;
    
    // Skip 'courses' if we are in a training plan context (optional choice for cleaner path)
    if (planId && path === 'courses') return;

    let label = path.replace(/-/g, ' ');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    const isLast = index === paths.length - 1;
    const prevSegment = paths[index - 1];
    let href = `/${paths.slice(0, index + 1).join('/')}`;
    if (planId) href += `?planId=${planId}`;

    // ─── Special handling for Admin Edit routes: /admin/[type]/edit/[id] ───
    // This swaps "Edit > [ID]" to "[Item Name] > Edit"
    if (path === 'edit' && paths[index + 1]) {
      const nextId = paths[index + 1];
      const type = paths[index - 1]; 
      
      if (type === 'training-plans') {
        const plan = trainingPlans.find(tp => tp.id === nextId);
        if (plan) label = plan.name;
      } else if (type === 'courses' || type === 'course-management' || type === 'admin/courses') {
        const course = courses.find(c => c.id === nextId);
        if (course) label = course.title;
      }
      
      // Link the "Item Name" back to the list page instead of the empty /edit/ folder
      href = `/${paths.slice(0, index).join('/')}`;
    }

    if (prevSegment === 'edit') {
      label = 'Edit'; 
    }

    // ─── Standard Replacement logic (non-edit routes) ───
    if (path !== 'edit' && prevSegment !== 'edit') {
      if (prevSegment === 'courses' || prevSegment === 'course-management') {
        const course = courses.find(c => c.id === path);
        if (course) label = course.title;
      }

      const isCourseIdPrev = paths[index - 1] && paths[index - 2] === 'courses';
      if (isCourseIdPrev) {
        const course = courses.find(c => c.id === prevSegment);
        if (course) {
          if (path.startsWith('video_')) {
            const videoIndex = parseInt(path.split('_')[1], 10);
            const sortedVideos = [...(course.videos || [])].sort((a, b) => a.order - b.order);
            const video = sortedVideos[videoIndex];
            if (video) label = video.title;
            else if (videoIndex === 0) label = 'Introduction';
          }
        }
      }

      if (prevSegment === 'training-plans') {
        const plan = trainingPlans.find(tp => tp.id === path);
        if (plan) label = plan.name;
      }
    }

    // Translation Overrides
    if (path === 'courses') label = languageNav.courses;
    if (path === 'training-plans') label = languageNav.trainingPlans;
    if (path === 'settings') label = languageNav.settings;
    if (path === 'users') label = languageNav.users;

    if (label.length > 25 && !label.includes(' ')) label = 'Details';

    breadcrumbItems.push({ label, href, isLast });
  });

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav className="flex mb-6 text-sm font-medium text-slate-500 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide items-center">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-slate-300">
              <ChevronRight size={14} />
            </span>
          )}
          {item.isLast ? (
            <span className="text-slate-900 font-bold max-w-[200px] truncate" title={item.label}>{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-indigo-600 transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
