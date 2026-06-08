'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/store/slices/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { saveCourseRequest } from '@/store/slices/authSlice';
import { initiatePaymentRequest } from '@/store/slices/paymentSlice';
import { useTranslation } from 'react-i18next';
import { Video, Heart, BookOpen, Play } from 'lucide-react';
import { UI_COMPONENTS, BUTTONS, TYPOGRAPHY } from '@/constants/ui';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('dashboard', { returnObjects: true }) as any;

  const isEnrolled = user?.enrolledCourses?.includes(course.id);
  const isSaved = user?.savedCourses?.includes(course.id);

  const { progress } = useAppSelector((state) => state.progress);
  const courseProgress = progress[course.id];

  useEffect(() => {
    if (isEnrolled && user?.uid && !courseProgress) {
      dispatch({ type: 'progress/fetchProgressRequest', payload: { userId: user.uid, courseId: course.id } });
    }
  }, [isEnrolled, user?.uid, course.id, courseProgress, dispatch]);

  const videoCount = course.videos?.length || (course.videoUrl ? 1 : 0);

  const calculateProgress = () => {
    if (!courseProgress || videoCount === 0) return 0;
    
    const videoList = course.videos || [];
    let totalDurationUnits = 0;
    let totalWatchedUnits = 0;

    videoList.forEach((video, index) => {
      const vidId = `video_${index}`;
      const duration = video.duration || 0;
      const watched = courseProgress.watchedDurations?.[vidId] || 0;
      const isCompleted = courseProgress.completedVideos?.includes(vidId);

      if (duration > 0) {
        totalDurationUnits += duration;
        totalWatchedUnits += isCompleted ? duration : Math.min(watched, duration);
      } else {
        totalDurationUnits += 100;
        totalWatchedUnits += isCompleted ? 100 : 0;
      }
    });

    if (totalDurationUnits <= 0) return 0;
    return Math.min(100, Math.round((totalWatchedUnits / totalDurationUnits) * 100));
  };

  const progressPercentage = calculateProgress();

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isEnrolled) {
      dispatch(initiatePaymentRequest({ courseId: course.id, amount: course.price ?? 999 }));
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(saveCourseRequest(course.id));
  };

  return (
    <div className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden flex-col h-full`}>
      {/* Top half - Cover Image */}
      <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100 group cursor-pointer">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
            <BookOpen size={48} />
          </div>
        )}

        {/* Header icons (floating over image) */}
        <div className="absolute inset-0 p-4 flex justify-between items-start z-10 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border border-slate-700/50 pointer-events-auto">
            <Video size={14} /> {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </div>
          
          <button
            onClick={handleSave}
            className="p-2 transition-all hover:scale-110 active:scale-95 group/heart outline-none pointer-events-auto"
            title={isSaved ? t.saved : t.save}
          >
            <Heart 
              size={22} 
              className={`transition-colors duration-300 drop-shadow-md ${
                isSaved ? 'text-rose-500 fill-rose-500' : 'text-white group-hover/heart:text-rose-500 group-hover/heart:fill-rose-500/30'
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Bottom half - White area */}
      <div className="p-6 flex flex-col bg-white">
        <div className="flex items-center justify-between gap-3 mb-5 w-full overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 truncate shrink min-w-0" title={course.title}>
              {course.title}
            </h3>
            <span className="text-sm font-medium text-slate-400 shrink-0 hidden xs:block">•</span>
            <span className="text-sm font-medium text-slate-400 truncate shrink min-w-0" title={course.instructor}>
              {course.instructor || `${videoCount} teacher`}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap shrink-0">
            {course.price > 0 ? `$${course.price}` : t.free?.toUpperCase() || 'FREE'}
          </span>
        </div>

        {isEnrolled && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.yourProgress || 'YOUR PROGRESS'}</span>
              <span className="text-xs font-bold text-primary-600">{progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className={`space-y-3 ${isEnrolled ? '' : 'pt-2'} mt-auto`}>
          {isEnrolled && videoCount > 0 && (
            <Link
              href={`/dashboard/courses/${course.id}`}
              className={`${BUTTONS.primary} w-full flex items-center justify-center gap-2`}
              onClick={(e) => e.stopPropagation()}
            >
              <Play size={16} className="fill-current" /> {t.viewCourse || 'View Course'}
            </Link>
          )}

          {!isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={authLoading}
              className={`${BUTTONS.primary} w-full`}
            >
              {course.price === 0 ? t.enroll || 'Enroll Now' : 'Buy Now'}
            </button>
          )}

          {isEnrolled && videoCount === 0 && (
            <button
              disabled
              className="w-full py-3.5 rounded-2xl font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              {t.enrolled || 'Enrolled'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
