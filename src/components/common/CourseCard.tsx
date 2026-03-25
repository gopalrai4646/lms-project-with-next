'use client';

import Link from 'next/link';
import { Course } from '@/store/slices/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { enrollCourseRequest, saveCourseRequest } from '@/store/slices/authSlice';
import { translations } from '@/utils/translations';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language].dashboard;

  const isEnrolled = user?.enrolledCourses?.includes(course.id);
  const isSaved = user?.savedCourses?.includes(course.id);

  const videoCount = course.videos?.length || (course.videoUrl ? 1 : 0);

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isEnrolled) {
      dispatch(enrollCourseRequest(course.id));
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(saveCourseRequest(course.id));
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-md transition-all flex flex-col h-full">
      <div className="h-48 bg-slate-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform overflow-hidden relative">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          '📚'
        )}
        <button
          onClick={handleSave}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-md transition-all ${isSaved ? 'bg-rose-500 text-white' : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'}`}
          title={isSaved ? t.saved : t.save}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
        {videoCount > 0 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 text-white text-xs font-bold rounded-lg backdrop-blur-sm">
            🎥 {videoCount} video{videoCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {course.price > 0 ? `$${course.price}` : 'Free'}
          </span>
          <span className="text-xs font-medium text-slate-400">{course.instructor}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">{course.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{course.description}</p>

        <div className="space-y-3">
          {isEnrolled && videoCount > 0 && (
            <Link
              href={`/courses/${course.id}`}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold transition-all hover:bg-emerald-700 shadow-lg  flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span>▶️</span> View Course
            </Link>
          )}

          <button
            onClick={handleEnroll}
            disabled={isEnrolled || authLoading}
            className={`w-full py-3 rounded-2xl font-bold transition-all active:scale-[0.98] ${
              isEnrolled
                ? 'bg-emerald-50 text-emerald-600 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            {isEnrolled ? `✓ ${t.enrolled}` : t.enroll}
          </button>
        </div>
      </div>
    </div>
  );
}
