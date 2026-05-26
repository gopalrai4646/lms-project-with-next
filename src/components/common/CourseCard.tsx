'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/store/slices/courseSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { enrollCourseRequest, saveCourseRequest } from '@/store/slices/authSlice';
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
      dispatch(enrollCourseRequest(course.id));
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(saveCourseRequest(course.id));
  };

  return (
    <div className={`${UI_COMPONENTS.cardInteractive} !p-0 overflow-hidden flex-col h-full`}>
      {/* Top half - Grey area */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 relative h-52 flex flex-col">
        {/* Header icons */}
        <div className="flex justify-between items-start z-10 relative">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Video size={14} /> {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </div>
          
          <button
            onClick={handleSave}
            className="p-2 transition-all hover:scale-110 active:scale-95 group/heart outline-none"
            title={isSaved ? t.saved : t.save}
          >
            <Heart 
              size={26} 
              className={`transition-colors duration-300 ${
                isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400 group-hover/heart:text-rose-500'
              }`} 
            />
          </button>
        </div>

        {/* Centered Thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center pt-8 group cursor-pointer">
          <div className="relative">
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#252525] text-white text-[11px] px-3 py-1.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
              Preview
            </div>
            
            {course.thumbnail ? (
              <img 
                src={course.thumbnail} 
                alt={course.title} 
                className="w-[180px] h-[105px] object-cover rounded shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-[180px] h-[105px] bg-white rounded shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300 text-slate-300">
                <BookOpen size={48} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom half - White area */}
      <div className="p-6 flex flex-col bg-white">
        <div className="flex items-center gap-2 mb-5 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 truncate min-w-0" title={course.title}>
            {course.title}
          </h3>
          <span className="text-sm font-medium text-slate-400 whitespace-nowrap shrink-0">
            • {course.instructor || `${videoCount} teacher`}
          </span>
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 ml-auto">
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
              {t.enroll || 'Enroll Now'}
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
