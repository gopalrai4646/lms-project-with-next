'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCourseRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';

interface VideoEntry {
  title: string;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  url: string;
}

export default function NewCoursePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.courses);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
  });

  const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([
    { title: '', file: null, uploading: false, uploaded: false, url: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addVideoEntry = () => {
    setVideoEntries(prev => [...prev, { title: '', file: null, uploading: false, uploaded: false, url: '' }]);
  };

  const removeVideoEntry = (index: number) => {
    if (videoEntries.length <= 1) return;
    setVideoEntries(prev => prev.filter((_, i) => i !== index));
  };

  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= videoEntries.length) return;
    setVideoEntries(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const updateVideoEntry = (index: number, field: keyof VideoEntry, value: any) => {
    setVideoEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateVideoEntry(index, 'file', e.target.files[0]);
      if (!videoEntries[index].title) {
        updateVideoEntry(index, 'title', e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validEntries = videoEntries.filter(v => v.file);
    if (validEntries.length === 0) {
      setUploadError('Please add at least one video file');
      return;
    }
    if (videoEntries.some(v => v.file && !v.title.trim())) {
      setUploadError('Please give each video a title');
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);

      // Upload all videos sequentially
      const uploadedVideos = [];
      for (let i = 0; i < videoEntries.length; i++) {
        const entry = videoEntries[i];
        if (!entry.file) continue;

        updateVideoEntry(i, 'uploading', true);
        const videoUrl = await uploadToCloudinary(entry.file);
        updateVideoEntry(i, 'uploading', false);
        updateVideoEntry(i, 'uploaded', true);
        updateVideoEntry(i, 'url', videoUrl);

        uploadedVideos.push({
          title: entry.title.trim(),
          url: videoUrl,
          order: uploadedVideos.length,
        });
      }

      dispatch(createCourseRequest({
        ...formData,
        videos: uploadedVideos,
        videoUrl: uploadedVideos[0]?.url, // backward compat
      }));

      router.push('/admin/courses');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload videos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Create New Course</h1>
        <p className="text-slate-500">Add course details and upload videos</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 md:p-8">
        {(error || uploadError) && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
            {error || uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Multi-Video Upload Section */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700">Course Videos</label>
              <button
                type="button"
                onClick={addVideoEntry}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1"
              >
                <span>+</span> Add Video
              </button>
            </div>

            <div className="space-y-4">
              {videoEntries.map((entry, index) => (
                <div key={index} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateVideoEntry(index, 'title', e.target.value)}
                      placeholder="Video title (e.g. Introduction)"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveVideo(index, 'up')} disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-white" title="Move up">↑</button>
                      <button type="button" onClick={() => moveVideo(index, 'down')} disabled={index === videoEntries.length - 1}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-white" title="Move down">↓</button>
                      {videoEntries.length > 1 && (
                        <button type="button" onClick={() => removeVideoEntry(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-white" title="Remove">✕</button>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 hover:bg-white transition-all cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[index] = el; }}
                      onChange={(e) => handleFileChange(index, e)}
                      accept="video/*"
                      className="hidden"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      {entry.uploading ? (
                        <span className="text-indigo-600 animate-pulse">⏳ Uploading...</span>
                      ) : entry.uploaded ? (
                        <span className="text-emerald-600">✅ Uploaded successfully</span>
                      ) : entry.file ? (
                        <span>🎥 {entry.file.name}</span>
                      ) : (
                        <span className="text-slate-400">Click to select video file</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || submitting}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {(loading || submitting) && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? 'Uploading Videos...' : loading ? 'Saving...' : 'Create Course'}
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
