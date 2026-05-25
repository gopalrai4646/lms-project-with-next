'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCourseRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { useTranslation } from 'react-i18next';
import { Pencil, Image as ImageIcon, Plus, ArrowUp, ArrowDown, X, Loader2, CheckCircle2, Video, ChevronUp, ChevronDown, Trash2, AlertCircle, Globe, Lock } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import { VALIDATION_LIMITS } from '@/constants/validation';

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
  const { role, permissions } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const canCreate = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'courses_create'));

  useEffect(() => {
    if (role && !canCreate) {
      router.push('/admin');
    }
  }, [role, canCreate, router]);

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
  const [formErrors, setFormErrors] = useState<{title?: string; description?: string; instructor?: string; thumbnail?: string; videos?: string}>({});

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > VALIDATION_LIMITS.IMAGE.MAX_SIZE_BYTES) {
        setUploadError(`Thumbnail must be under ${VALIDATION_LIMITS.IMAGE.MAX_SIZE_MB}MB`);
        return;
      }
      
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setUploadError(null);
      setFormErrors(prev => ({ ...prev, thumbnail: undefined }));
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
    if (field === 'file' || field === 'title') {
      setFormErrors(prev => ({ ...prev, videos: undefined }));
    }
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

    let hasError = false;
    const errors: {title?: string; description?: string; instructor?: string; thumbnail?: string; videos?: string} = {};

    if (!formData.title.trim()) {
      errors.title = "Course title is required.";
      hasError = true;
    } else if (formData.title.length < VALIDATION_LIMITS.COURSE.TITLE_MIN_LENGTH) {
      errors.title = `Title must be at least ${VALIDATION_LIMITS.COURSE.TITLE_MIN_LENGTH} characters.`;
      hasError = true;
    }
    
    if (!formData.description.trim()) {
      errors.description = "Description is required.";
      hasError = true;
    } else if (formData.description.length < VALIDATION_LIMITS.COURSE.DESCRIPTION_MIN_LENGTH) {
      errors.description = `Description must be at least ${VALIDATION_LIMITS.COURSE.DESCRIPTION_MIN_LENGTH} characters.`;
      hasError = true;
    }

    if (!formData.instructor.trim()) {
      errors.instructor = "Instructor name is required.";
      hasError = true;
    } else if (formData.instructor.length < VALIDATION_LIMITS.COURSE.INSTRUCTOR_MIN_LENGTH) {
      errors.instructor = `Instructor must be at least ${VALIDATION_LIMITS.COURSE.INSTRUCTOR_MIN_LENGTH} characters.`;
      hasError = true;
    }

    if (!thumbnailFile) {
      errors.thumbnail = "Please upload a course thumbnail.";
      hasError = true;
    }

    const validEntries = videoEntries.filter(v => v.file);
    if (validEntries.length === 0) {
      errors.videos = t.addAtLeastOneVideo || "Please add at least one video.";
      hasError = true;
    } else if (videoEntries.some(v => v.file && !v.title.trim())) {
      errors.videos = t.giveEachVideoTitle || "Please provide a title for all videos.";
      hasError = true;
    }

    setFormErrors(errors);
    if (hasError) return;

    try {
      setSubmitting(true);
      setUploadError(null);

      const thumbnailUrl = await uploadToCloudinary(thumbnailFile as File);

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

  if (role && !canCreate) return null;

  return (
    <div className={`${UI_COMPONENTS.pageContainer} animate-in fade-in duration-700`}>
      <header className="mb-6">
        <h1 className={TYPOGRAPHY.h1}>{t.createNewCourse || "New Course"}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1`}>{t.uploadVideoDetails || "Upload videos and set up course details."}</p>
      </header>

      <div className={UI_COMPONENTS.card}>
        {(error || uploadError) && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error || uploadError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.courseTitleLabel || "Course Title"} *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={VALIDATION_LIMITS.COURSE.TITLE_MAX_LENGTH}
                  minLength={VALIDATION_LIMITS.COURSE.TITLE_MIN_LENGTH}
                  className={`${UI_COMPONENTS.input} ${formErrors.title ? '!border-rose-500 !ring-rose-200' : ''}`}
                  placeholder={t.courseTitlePlaceholder || "e.g. Introduction to React"}
                />
                <div className="flex justify-between items-start mt-1.5">
                  <div className="flex-1">
                    {formErrors.title && (
                      <p className="text-sm text-rose-500 font-medium">{formErrors.title}</p>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 text-right shrink-0 ml-4">
                    {formData.title.length}/{VALIDATION_LIMITS.COURSE.TITLE_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.descriptionLabel || "Description"} *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={VALIDATION_LIMITS.COURSE.DESCRIPTION_MAX_LENGTH}
                  minLength={VALIDATION_LIMITS.COURSE.DESCRIPTION_MIN_LENGTH}
                  className={`${UI_COMPONENTS.input} resize-none ${formErrors.description ? '!border-rose-500 !ring-rose-200' : ''}`}
                  placeholder={t.descriptionPlaceholder || "Describe this course..."}
                />
                <div className="flex justify-between items-start mt-1.5">
                  <div className="flex-1">
                    {formErrors.description && (
                      <p className="text-sm text-rose-500 font-medium">{formErrors.description}</p>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 text-right shrink-0 ml-4">
                    {formData.description.length}/{VALIDATION_LIMITS.COURSE.DESCRIPTION_MAX_LENGTH}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.coverImage || "Course Thumbnail"} *</label>
              <div 
                onClick={() => thumbnailInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-primary-400 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group h-[220px]"
              >
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={handleThumbnailChange}
                  accept={VALIDATION_LIMITS.IMAGE.ACCEPTED_TYPES}
                  className="hidden"
                />
                {thumbnailPreview ? (
                  <>
                    <img src={thumbnailPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]">
                      <span className="text-white font-medium flex items-center gap-2 text-sm">
                        <Pencil size={16} /> {t.descriptionLabel ? "Change Thumbnail" : "Change Thumbnail"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center z-10">
                    <ImageIcon className="text-slate-300 block mx-auto mb-3" size={40} />
                    <p className="text-sm font-medium text-slate-600">Click to upload thumbnail</p>
                    <p className="text-xs text-slate-400 mt-1">Recommended size: 1280x720px</p>
                  </div>
                )}
              </div>
              {formErrors.thumbnail && (
                <p className="mt-2 text-sm text-rose-500 font-medium">{formErrors.thumbnail}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.instructorNameLabel || "Instructor"} *</label>
              <input
                type="text"
                required
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                maxLength={VALIDATION_LIMITS.COURSE.INSTRUCTOR_MAX_LENGTH}
                minLength={VALIDATION_LIMITS.COURSE.INSTRUCTOR_MIN_LENGTH}
                className={`${UI_COMPONENTS.input} ${formErrors.instructor ? '!border-rose-500 !ring-rose-200' : ''}`}
                placeholder={t.instructorNamePlaceholder || "Instructor Name"}
              />
              <div className="flex justify-between items-start mt-1.5">
                <div className="flex-1">
                  {formErrors.instructor && (
                    <p className="text-sm text-rose-500 font-medium">{formErrors.instructor}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.priceLabel || "Price (₹)"}</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={UI_COMPONENTS.input}
              />
            </div>
            
            <div className="flex flex-col h-full sm:col-span-2 lg:col-span-1">
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.courseVisibility || "Visibility"} *</label>
              <div className="flex bg-slate-100 p-1 rounded-xl flex-1 mt-auto border border-slate-200/60 max-h-[46px]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'public' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg transition-all px-2 overflow-hidden ${formData.visibility === 'public' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Globe size={16} className="shrink-0" /> <span className="truncate">{t.visibilityPublic || "Public"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'private' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg transition-all px-2 overflow-hidden ${formData.visibility === 'private' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Lock size={16} className="shrink-0" /> <span className="truncate">{t.visibilityPrivate || "Private"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className={TYPOGRAPHY.h2}>{t.courseVideos || "Course Videos"}</h2>
              </div>
              <button
                type="button"
                onClick={addVideoEntry}
                className={`${BUTTONS.tint} w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 text-sm !py-1.5`}
              >
                <Plus size={16} /> {t.addVideo || "Add Video"}
              </button>
            </div>

            {formErrors.videos && (
              <div className="mb-3">
                <p className="text-sm text-rose-500 font-medium">{formErrors.videos}</p>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {videoEntries.map((entry, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl group hover:border-primary-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-grow">
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0 border border-slate-200">
                      {index + 1}
                    </div>
                    
                    <div className="flex-grow min-w-0 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={entry.title}
                        onChange={(e) => updateVideoEntry(index, 'title', e.target.value)}
                        placeholder={t.videoTitle || "Video Title"}
                        className={`${UI_COMPONENTS.input} !py-1.5 !text-sm`} 
                      />
                      
                      <div 
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="w-full border border-dashed border-slate-200 rounded-lg p-2 text-center hover:border-primary-400 hover:bg-slate-50 transition-all cursor-pointer bg-slate-50/50"
                      >
                        <input 
                          type="file" 
                          ref={(el) => { fileInputRefs.current[index] = el; }}
                          onChange={(e) => handleFileChange(index, e)} 
                          accept="video/*" 
                          className="hidden" 
                        />
                        <p className="text-xs font-medium text-slate-600 truncate px-2">
                          {entry.uploading ? (
                            <span className="text-primary-600 flex items-center justify-center gap-1.5"><Loader2 size={14} className="animate-spin" /> {t.uploadingEllipsis || "Uploading..."}</span>
                          ) : entry.uploaded ? (
                            <span className="text-emerald-600 flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> {t.videoAttached || "Video attached"}</span>
                          ) : entry.file ? (
                            <span className="flex items-center justify-center gap-1.5"><Video size={14} /> {entry.file.name}</span>
                          ) : (
                            <span className="text-slate-400">{t.clickToSelectVideo || "Click to attach video file"}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-1 shrink-0 sm:ml-auto w-full sm:w-auto pt-2 mt-1 sm:pt-0 sm:mt-0 border-t sm:border-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => moveVideo(index, 'up')}
                      disabled={index === 0}
                      className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400`}
                      title={t.moveUp || "Move Up"}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveVideo(index, 'down')}
                      disabled={index === videoEntries.length - 1}
                      className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400`}
                      title={t.moveDown || "Move Down"}
                    >
                      <ChevronDown size={16} />
                    </button>
                    
                    {videoEntries.length > 1 && (
                      <>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => removeVideoEntry(index)}
                          className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                          title={t.remove || "Remove"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className={`${BUTTONS.secondary} w-full sm:w-auto`}
            >
              {t.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={createLoading || submitting}
              className={`${BUTTONS.primary} w-full sm:w-auto`}
            >
              {(submitting || createLoading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t.uploadingVideo || "Saving..."}
                </>
              ) : (
                t.createCourseBtn || "Create Course"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
