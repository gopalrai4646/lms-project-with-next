'use client';

import { useState, useEffect } from 'react';
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
    <div className="bg-white rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col border border-slate-100">
      {/* Top half - Grey area */}
      <div className="bg-[#f0f2f5] p-5 relative h-52 flex flex-col">
        {/* Header icons */}
        <div className="flex justify-between items-start z-10 relative">
          <div className="bg-[#2d3142] text-white px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm">
            <span>🎬</span> {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </div>
          
          <button
            onClick={handleSave}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all ${
              isSaved ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 hover:text-rose-500'
            }`}
            title={isSaved ? t.saved : t.save}
          >
            {isSaved ? '❤️' : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
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
              <div className="w-[180px] h-[105px] bg-white rounded shadow-md flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300 text-slate-300">
                📚
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom half - White area */}
      <div className="p-6 flex flex-col bg-white">
        <div className="flex justify-between items-center mb-5">
          <span className="px-3.5 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-full tracking-wide">
            {course.price > 0 ? `$${course.price}` : t.free?.toUpperCase() || 'FREE'}
          </span>
          <span className="text-sm font-medium text-slate-500">
            {course.instructor || `${videoCount} video teacher`}
          </span>
        </div>

        {isEnrolled && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.yourProgress || 'YOUR PROGRESS'}</span>
              <span className="text-xs font-bold text-[#6366f1]">{progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#6366f1] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className={`space-y-3 ${isEnrolled ? '' : 'pt-2'}`}>
          {isEnrolled && videoCount > 0 && (
            <Link
              href={`/courses/${course.id}`}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold transition-all hover:bg-emerald-700 shadow flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span>▶️</span> {t.viewCourse || 'View Course'}
            </Link>
          )}

          {!isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={authLoading}
              className="w-full py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
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
