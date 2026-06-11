'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchProgressRequest, updateProgressRequest } from '@/store/slices/progressSlice';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import CourseRatingModal from '@/components/common/CourseRatingModal';
import { Star, Lock, Award, Inbox, Video as VideoIcon, Check, Play } from 'lucide-react';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const courseId = params.courseId as string;
  const videoId = params.videoId as string; // Format: video_0, video_1, etc.
  const dispatch = useAppDispatch();
  const { courses } = useAppSelector(state => state.courses);
  const { user } = useAppSelector(state => state.auth);
  const { progress } = useAppSelector(state => state.progress);
  const { t: i18nT } = useTranslation();
  const t = i18nT('coursePlayer', { returnObjects: true }) as any;
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSyncRef = useRef<number>(0);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  const [detectedDurations, setDetectedDurations] = useState<Record<string, number>>({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasDismissedRating, setHasDismissedRating] = useState(false);

  const courseProgress = progress[courseId];

  useEffect(() => {
    if (courses.length === 0) dispatch(fetchCoursesRequest());
  }, [dispatch, courses.length]);

  useEffect(() => {
    if (user?.uid && courseId) {
      dispatch(fetchProgressRequest({ userId: user.uid, courseId }));
    }
  }, [dispatch, user?.uid, courseId]);

  const course = courses.find(c => c.id === courseId);
  const isEnrolled = user?.enrolledCourses?.includes(courseId);

  const videoList = course?.videos && course.videos.length > 0
    ? [...course.videos].sort((a, b) => a.order - b.order)
    : course?.videoUrl
      ? [{ title: t.courseContent, url: course.videoUrl, order: 0, duration: 0 }]
      : [];

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [videoId, videoList.length]);

  const calculateCourseProgress = useCallback((): number => {
    if (!courseProgress || videoList.length === 0) return 0;
    let totalDurationUnits = 0;
    let totalWatchedUnits = 0;
    videoList.forEach((video, index) => {
      const vidId = `video_${index}`;
      const dbDuration = video.duration || 0;
      const detectedDuration = detectedDurations[vidId] || 0;
      const effectiveDuration = dbDuration || detectedDuration;
      const watched = courseProgress.watchedDurations?.[vidId] || 0;
      const isCompleted = courseProgress.completedVideos?.includes(vidId);
      if (effectiveDuration > 0) {
        totalDurationUnits += effectiveDuration;
        totalWatchedUnits += isCompleted ? effectiveDuration : Math.min(watched, effectiveDuration);
      } else {
        totalDurationUnits += 100;
        totalWatchedUnits += isCompleted ? 100 : 0;
      }
    });
    if (totalDurationUnits <= 0) return 0;
    return Math.min(100, Math.round((totalWatchedUnits / totalDurationUnits) * 100));
  }, [courseProgress, videoList, detectedDurations]);

  useEffect(() => {
    if (!courseProgress || !course) return;
    const percentage = calculateCourseProgress();
    if (percentage === 100 && !courseProgress.isRated && !hasDismissedRating && !showRatingModal) {
      setShowRatingModal(true);
    }
  }, [courseProgress, calculateCourseProgress, hasDismissedRating, showRatingModal, course]);

  // Parse active video from videoId param
  const activeVideoIndex = videoList.findIndex((_, index) => `video_${index}` === videoId);
  const activeVideo = videoList[activeVideoIndex];


  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !user?.uid || !courseId || !videoId) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const now = Date.now();
    if (now - lastSyncRef.current < 3000) return;
    lastSyncRef.current = now;
    const isCompleted = duration > 0 && currentTime >= duration - 1.5;
    dispatch(updateProgressRequest({ userId: user.uid, courseId, videoId, watchedDuration: Math.round(currentTime), isCompleted }));
  }, [dispatch, user?.uid, courseId, videoId]);

  const handleVideoEnded = useCallback(() => {
    if (!videoRef.current || !user?.uid || !courseId || !videoId) return;
    dispatch(updateProgressRequest({ userId: user.uid, courseId, videoId, watchedDuration: Math.round(videoRef.current.duration), isCompleted: true }));
  }, [dispatch, user?.uid, courseId, videoId]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current || !courseProgress || !videoId) return;
    const savedTime = courseProgress.watchedDurations?.[videoId];
    if (videoRef.current.duration > 0) {
      const roundedDuration = Math.round(videoRef.current.duration);
      setDetectedDurations(prev => ({ ...prev, [videoId]: roundedDuration }));
    }
    if (savedTime && savedTime > 0 && !courseProgress.completedVideos?.includes(videoId)) {
      videoRef.current.currentTime = savedTime;
    }
  }, [courseProgress, videoId]);


  const getVideoProgress = (index: number): number => {
    if (!courseProgress) return 0;
    const vidId = `video_${index}`;
    const watched = courseProgress.watchedDurations?.[vidId] || 0;
    const videoDuration = videoList[index]?.duration || detectedDurations[vidId] || 0;
    if (videoDuration <= 0) return 0;
    return Math.min(100, Math.round((watched / videoDuration) * 100));
  };

  const isVideoCompleted = (index: number): boolean => {
    if (!courseProgress) return false;
    return courseProgress.completedVideos?.includes(`video_${index}`) || false;
  };

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-500 font-medium">{t.loadingCourse}</p>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className={UI_COMPONENTS.pageContainer}>
        <div className={`${UI_COMPONENTS.emptyStateCard} max-w-2xl mx-auto mt-12 bg-amber-50/50 border-amber-100`}>
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 ring-8 ring-amber-50">
             <Lock size={40} strokeWidth={1.5} />
          </div>
          <h2 className={TYPOGRAPHY.h2}>{t.enrollmentRequired}</h2>
          <p className={`${TYPOGRAPHY.body} mb-8 max-w-md`}>{t.enrollmentMessage}</p>
          <Link href="/dashboard" className={BUTTONS.primary}>
            {t.backToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  const coursePercentage = calculateCourseProgress();

  return (
    <div className={`${UI_COMPONENTS.pageContainer} max-w-7xl`}>
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 overflow-hidden">
        <div className="flex-1 min-w-0">
          <h1 className={`${TYPOGRAPHY.h1} truncate`} title={course.title}>{course.title}</h1>
          <div className={`${TYPOGRAPHY.body} mt-2 flex items-center gap-2 min-w-0`}>
            <span className="font-medium text-slate-700 truncate max-w-[150px] sm:max-w-md shrink" title={course.instructor}>
              {t.by} {course.instructor}
            </span>
            <span className="text-slate-300 shrink-0">•</span>
            <span className="shrink-0">{videoList.length} {videoList.length !== 1 ? t.videos : t.video}</span>
          </div>
        </div>
        
        {/* Progress Pill */}
        <div className="bg-white rounded-full border border-slate-200 shadow-sm px-4 py-2 flex items-center justify-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`${TYPOGRAPHY.label} !mb-0`}>{t.courseProgress}</span>
            <span className={`text-sm font-bold ${coursePercentage === 100 ? 'text-emerald-600' : 'text-primary-600'}`}>
              {coursePercentage}%
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${coursePercentage === 100 ? 'bg-emerald-500' : 'bg-primary-600'}`}
              style={{ width: `${coursePercentage}%` }}
            />
          </div>
          {coursePercentage === 100 && (
            <Award size={16} className="text-emerald-500" />
          )}
        </div>
      </header>

      {videoList.length === 0 ? (
        <div className={UI_COMPONENTS.emptyStateCard}>
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 ring-8 ring-slate-50/50">
             <Inbox size={40} strokeWidth={1.5} />
          </div>
          <h3 className={TYPOGRAPHY.h3}>{t.noVideosYet}</h3>
          <p className={TYPOGRAPHY.body}>Check back later for newly added content.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Video Player */}
            <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl aspect-video ring-1 ring-slate-900/10 border border-slate-800">
              {activeVideo ? (
                <video
                  ref={videoRef}
                  key={activeVideo.url}
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  onLoadedMetadata={handleLoadedMetadata}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-center p-8 bg-slate-900/50">
                  <div className="max-w-xs flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                       <VideoIcon size={32} className="text-slate-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-400">{t.selectVideo}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* About Course */}
            <div className={`${UI_COMPONENTS.card} border-slate-200/60`}>
              <h3 className={`${TYPOGRAPHY.h3} mb-3`}>{t.aboutCourse}</h3>
              <p className={TYPOGRAPHY.body}>{course.description}</p>
            </div>
          </div>

          {/* Playlist Sidebar */}
          <div className="lg:w-[380px] shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden sticky top-6">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className={TYPOGRAPHY.h3}>{t.courseContent}</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-200px)] overflow-y-auto no-scrollbar">
                {videoList.map((video, index) => {
                  const completed = isVideoCompleted(index);
                  const vidProgress = getVideoProgress(index);
                  const isCurrent = `video_${index}` === videoId;
                  
                  return (
                    <Link
                      key={index}
                      ref={isCurrent ? activeItemRef : null}
                      href={`/dashboard/courses/${courseId}/video_${index}${planId ? `?planId=${planId}` : ''}`}
                      className={`w-full text-left p-4 flex items-start gap-3.5 transition-all hover:bg-slate-50/80 border-l-4 ${
                        isCurrent ? 'bg-primary-50/30 border-primary-600' : 'border-transparent'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border ${
                        completed 
                          ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                          : isCurrent 
                            ? 'bg-primary-600 text-white border-primary-700 ring-4 ring-primary-50' 
                            : 'bg-white text-slate-500 border-slate-200'
                      }`}>
                        {completed ? <Check size={14} strokeWidth={3} /> : isCurrent ? <Play size={10} className="fill-current ml-0.5" /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className={`text-sm font-semibold leading-snug truncate ${isCurrent ? 'text-primary-700' : 'text-slate-700'}`}>
                          {video.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {video.duration ? (
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{formatDuration(video.duration)}</span>
                          ) : null}
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider flex items-center gap-1.5 bg-primary-100/50 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span> Playing
                            </span>
                          )}
                          {vidProgress > 0 && !completed && !isCurrent && (
                            <span className="text-[11px] text-primary-500 font-bold">{vidProgress}%</span>
                          )}
                        </div>
                        {vidProgress > 0 && (
                          <div className="mt-2.5 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${completed ? 'bg-emerald-400' : 'bg-primary-500'}`}
                              style={{ width: `${vidProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}



      {showRatingModal && user?.uid && (
        <CourseRatingModal 
          courseId={courseId}
          userId={user.uid}
          courseTitle={course.title}
          onDismiss={() => {
            setShowRatingModal(false);
            setHasDismissedRating(true);
          }}
        />
      )}
    </div>
  );
}
