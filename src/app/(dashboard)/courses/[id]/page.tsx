'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import Link from 'next/link';

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const dispatch = useAppDispatch();
  const { courses } = useAppSelector(state => state.courses);
  const { user } = useAppSelector(state => state.auth);

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => {
    if (courses.length === 0) dispatch(fetchCoursesRequest());
  }, [dispatch, courses.length]);

  const course = courses.find(c => c.id === courseId);
  const isEnrolled = user?.enrolledCourses?.includes(courseId);

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-500 font-medium">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-12 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Enrollment Required</h2>
          <p className="text-slate-600 mb-6">You need to enroll in this course to access the videos.</p>
          <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Build video list: prefer videos[] array, fallback to single videoUrl
  const videoList = course.videos && course.videos.length > 0
    ? [...course.videos].sort((a, b) => a.order - b.order)
    : course.videoUrl
      ? [{ title: 'Course Video', url: course.videoUrl, order: 0 }]
      : [];

  const activeVideo = videoList[activeVideoIndex];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Course Header */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-indigo-600 font-medium mb-3 flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{course.title}</h1>
        <p className="text-slate-500 mt-1 text-sm">By {course.instructor} • {videoList.length} video{videoList.length !== 1 ? 's' : ''}</p>
      </div>

      {videoList.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 font-medium">No videos have been added to this course yet.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player */}
          <div className="flex-1">
            <div className="bg-black rounded-2xl overflow-hidden shadow-xl aspect-video">
              {activeVideo ? (
                <video
                  key={activeVideo.url}
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  Select a video to play
                </div>
              )}
            </div>
            {activeVideo && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">{activeVideo.title}</h2>
                <p className="text-sm text-slate-500 mt-1">Video {activeVideoIndex + 1} of {videoList.length}</p>
              </div>
            )}
          </div>

          {/* Video Playlist Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Course Content</h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                {videoList.map((video, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveVideoIndex(index)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-all hover:bg-slate-50 ${
                      index === activeVideoIndex ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      index === activeVideoIndex ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {index === activeVideoIndex ? '▶' : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        index === activeVideoIndex ? 'text-indigo-700' : 'text-slate-700'
                      }`}>
                        {video.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Description */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3">About this course</h3>
        <p className="text-slate-600 leading-relaxed">{course.description}</p>
      </div>
    </div>
  );
}
