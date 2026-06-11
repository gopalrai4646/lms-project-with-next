'use client';

import { useAppSelector } from '@/store/hooks';
import Sidebar from './Sidebar';
import TeacherSidebar from '../teacher/TeacherSidebar';

export default function DynamicSidebar() {
  const { role } = useAppSelector(state => state.auth);

  if (role === 'teacher') {
    return <TeacherSidebar />;
  }

  return <Sidebar />;
}
