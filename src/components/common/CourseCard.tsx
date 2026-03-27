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
            🎥 {videoCount} {videoCount !== 1 ? 'videos' : 'video'}
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {course.price > 0 ? `$${course.price}` : t.free}
          </span>
          <span className="text-xs font-medium text-slate-400">{course.instructor}</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">{course.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{course.description}</p>

        {isEnrolled && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.yourProgress}</span>
              <span className="text-xs font-bold text-indigo-600">{progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isEnrolled && videoCount > 0 && (
            <Link
              href={`/courses/${course.id}`}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold transition-all hover:bg-emerald-700 shadow-lg  flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span>▶️</span> {t.viewCourse}
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
