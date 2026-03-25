'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateCourseRequest, fetchCoursesRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector((state) => state.courses);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
  });
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Fetch courses if not already loaded
  useEffect(() => {
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, courses.length]);

  // Pre-populate form when course data is available
  useEffect(() => {
    if (!initialized && courses.length > 0) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setFormData({
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          price: course.price,
        });
        setCurrentVideoUrl(course.videoUrl || null);
        setInitialized(true);
      }
    }
  }, [courses, courseId, initialized]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploading(true);
      setUploadError(null);

      let videoUrl = currentVideoUrl;

      // Only upload if a new video was selected
      if (videoFile) {
        videoUrl = await uploadToCloudinary(videoFile);
      }

      dispatch(updateCourseRequest({
        id: courseId,
        ...formData,
        ...(videoUrl ? { videoUrl } : {}),
      }));

      router.push('/admin/courses');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  if (!initialized && courses.length > 0 && !courses.find(c => c.id === courseId)) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-r-xl">
          Course not found. It may have been deleted.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Edit Course</h1>
        <p className="text-slate-500">Update course details and optionally replace the video</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 md:p-8">
        {(error || uploadError) && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error || uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Course Video</label>
              {currentVideoUrl && !videoFile && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <span>✅</span> Current video attached
                </div>
              )}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎥</div>
                <p className="text-sm font-bold text-slate-900">
                  {videoFile ? videoFile.name : 'Click to replace course video (optional)'}
                </p>
                <p className="text-xs text-slate-400 mt-1">MP4, MOV or WebM supported</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Course Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="e.g. Advanced React Patterns"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Describe what students will learn..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Instructor Name</label>
              <input
                type="text"
                required
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Price ($)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {(loading || uploading) && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all w-full sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
