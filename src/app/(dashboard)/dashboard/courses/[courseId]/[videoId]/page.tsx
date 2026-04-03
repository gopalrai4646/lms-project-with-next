'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { fetchProgressRequest, updateProgressRequest } from '@/store/slices/progressSlice';
import { translations } from '@/utils/translations';
import Link from 'next/link';
import CourseRatingModal from '@/components/common/CourseRatingModal';
import { Star, Lock, Award, Inbox, Video as VideoIcon, Check, Play } from 'lucide-react';

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
  const { language } = useAppSelector(state => state.settings);
  const t = translations[language].coursePlayer;
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSyncRef = useRef<number>(0);

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
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
             <Lock size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t.enrollmentRequired}</h2>
          <p className="text-slate-600 mb-6">{t.enrollmentMessage}</p>
          <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
            {t.backToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  const coursePercentage = calculateCourseProgress();

  return (
    <div className="max-w-6xl mx-auto pb-8 pt-2 px-4">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{course.title}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t.by} {course.instructor} • {videoList.length} {videoList.length !== 1 ? t.videos : t.video}</p>
        
        <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-700">{t.courseProgress}</span>
            <span className={`text-sm font-extrabold ${coursePercentage === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
              {coursePercentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${coursePercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${coursePercentage}%` }}
            />
          </div>
          {coursePercentage === 100 && (
            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Award size={14} /> {t.courseCompleted}
            </p>
          )}
        </div>

      {videoList.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Inbox size={40} />
          </div>
          <p className="font-medium">{t.noVideosYet}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 mt-10">
          <div className="flex-1">
            <div className="bg-black rounded-2xl overflow-hidden shadow-xl aspect-video">
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
                <div className="w-full h-full flex items-center justify-center text-white/50 text-center p-8">
                  <div className="max-w-xs flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                       <VideoIcon size={40} className="text-white/20" />
                    </div>
                    <p className="text-lg font-bold">{t.selectVideo}</p>
                  </div>
                </div>
              )}
            </div>
            {/* Active video info removed for cleaner UI */}
            
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">{t.aboutCourse}</h3>
              <p className="text-slate-600 leading-relaxed">{course.description}</p>
            </div>
          </div>

          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t.courseContent}</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                {videoList.map((video, index) => {
                  const completed = isVideoCompleted(index);
                  const vidProgress = getVideoProgress(index);
                  const isCurrent = `video_${index}` === videoId;
                  
                  return (
                    <Link
                      key={index}
                      href={`/dashboard/courses/${courseId}/video_${index}${planId ? `?planId=${planId}` : ''}`}
                      className={`w-full text-left p-4 flex items-start gap-3 transition-all hover:bg-slate-50 ${
                        isCurrent ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        completed ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {completed ? <Check size={14} strokeWidth={3} /> : isCurrent ? <Play size={10} className="fill-current ml-0.5" /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {video.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {video.duration ? (
                            <span className="text-xs text-slate-400">{formatDuration(video.duration)}</span>
                          ) : null}
                          {vidProgress > 0 && !completed && (
                            <span className="text-xs text-indigo-500 font-medium">{vidProgress}%</span>
                          )}
                        </div>
                        {vidProgress > 0 && (
                          <div className="mt-1.5 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${completed ? 'bg-emerald-400' : 'bg-indigo-400'}`}
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
