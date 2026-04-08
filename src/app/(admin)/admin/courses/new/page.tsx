'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCourseRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { useTranslation } from 'react-i18next';
import { Pencil, Image as ImageIcon, Plus, ArrowUp, ArrowDown, X, Loader2, CheckCircle2, Video } from 'lucide-react';

interface VideoEntry {
  title: string;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  url: string;
  duration?: number;
}

export default function NewCoursePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { createLoading, error } = useAppSelector((state) => state.courses);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
    visibility: 'public' as 'public' | 'private',
  });

  const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([
    { title: '', file: null, uploading: false, uploaded: false, url: '' }
  ]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const addVideoEntry = () => {
    setVideoEntries(prev => [...prev, { title: '', file: null, uploading: false, uploaded: false, url: '', duration: 0 }]);
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

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      updateVideoEntry(index, 'file', file);
      
      const duration = await getVideoDuration(file);
      updateVideoEntry(index, 'duration', duration);

      if (!videoEntries[index].title) {
        updateVideoEntry(index, 'title', file.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validEntries = videoEntries.filter(v => v.file);
    if (validEntries.length === 0) {
      setUploadError(t.addAtLeastOneVideo);
      return;
    }
    if (videoEntries.some(v => v.file && !v.title.trim())) {
      setUploadError(t.giveEachVideoTitle);
      return;
    }
    if (!thumbnailFile) {
      setUploadError('Please upload a course thumbnail.');
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);

      const thumbnailUrl = await uploadToCloudinary(thumbnailFile);

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
          duration: entry.duration || 0,
        });
      }

      const totalDuration = uploadedVideos.reduce((acc, v) => acc + (v.duration || 0), 0);

      dispatch(createCourseRequest({
        ...formData,
        thumbnail: thumbnailUrl,
        videos: uploadedVideos,
        totalDuration,
        videoUrl: uploadedVideos[0]?.url,
      }));

      router.push('/admin/courses');
    } catch (err: any) {
      setUploadError(err.message || t.failedToUploadVideos);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.createNewCourse}</h1>
        <p className="text-slate-500">{t.uploadVideoDetails}</p>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.courseTitleLabel}</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder={t.courseTitlePlaceholder}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.descriptionLabel}</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.instructorNameLabel}</label>
              <input
                type="text"
                required
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                placeholder={t.instructorNamePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.priceLabel}</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.courseVisibility || "Visibility"}</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
              >
                <option value="public">{t.public || "Public (Visible to everyone)"}</option>
                <option value="private">{t.private || "Private (Training Plans only)"}</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Course Thumbnail</label>
              <div 
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group min-h-[200px]"
              >
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={handleThumbnailChange}
                  accept="image/*"
                  className="hidden"
                />
                {thumbnailPreview ? (
                  <>
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-white font-semibold flex items-center gap-2"><Pencil size={18} /> Change Thumbnail</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center z-10">
                    <ImageIcon className="text-slate-300 block mx-auto mb-2" size={48} />
                    <p className="text-sm font-medium text-slate-600">Click to upload thumbnail</p>
                    <p className="text-xs text-slate-400 mt-1">Recommended size: 1280x720 (16:9)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Video Upload Section */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700">{t.courseVideos}</label>
              <button
                type="button"
                onClick={addVideoEntry}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1"
              >
                <Plus size={16} /> {t.addVideo}
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
                      placeholder={t.videoTitle}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveVideo(index, 'up')} disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-white" title={t.moveUp}><ArrowUp size={16} /></button>
                      <button type="button" onClick={() => moveVideo(index, 'down')} disabled={index === videoEntries.length - 1}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-white" title={t.moveDown}><ArrowDown size={16} /></button>
                      {videoEntries.length > 1 && (
                        <button type="button" onClick={() => removeVideoEntry(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-white" title={t.remove}><X size={16} /></button>
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
                        <span className="text-indigo-600 flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {t.uploadingEllipsis}</span>
                      ) : entry.uploaded ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> {t.videoAttached}</span>
                      ) : entry.file ? (
                        <span className="flex items-center justify-center gap-2"><Video size={16} /> {entry.file.name}</span>
                      ) : (
                        <span className="text-slate-400">{t.clickToSelectVideo}</span>
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
              disabled={createLoading || submitting}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {(createLoading || submitting) && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? t.uploadingVideo : createLoading ? t.savingCourse : t.createCourseBtn}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all w-full sm:w-auto"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
