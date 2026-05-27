'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateTrainingPlanRequest, fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { useTranslation } from 'react-i18next';
import { Pencil, Image as ImageIcon, Plus, BookOpen, ChevronUp, ChevronDown, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import { VALIDATION_LIMITS } from '@/constants/validation';

export default function EditTrainingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);
  
  const { trainingPlans, updateLoading, error: planError } = useAppSelector((state) => state.trainingPlans);
  const { courses, error: courseError } = useAppSelector((state) => state.courses);
  const { role, permissions } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const canEdit = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_edit'));

  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{name?: string; description?: string; image?: string; courses?: string}>({});
  
  const [courseSearch, setCourseSearch] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  useEffect(() => {
    if (role && !canEdit) {
      router.push('/admin');
      return;
    }

    if (trainingPlans.length === 0) {
      dispatch(fetchTrainingPlansRequest());
    }
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, trainingPlans.length, courses.length, role, canEdit, router]);

  useEffect(() => {
    if (trainingPlans.length > 0) {
      const plan = trainingPlans.find(tp => tp.id === id);
      if (plan) {
        setFormData({ name: plan.name, description: plan.description });
        setSelectedCourseIds(plan.courseIds || []);
        setImagePreview(plan.image);
      }
    }
  }, [trainingPlans, id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > VALIDATION_LIMITS.IMAGE.MAX_SIZE_BYTES) {
        setUploadError(`Image must be under ${VALIDATION_LIMITS.IMAGE.MAX_SIZE_MB}MB`);
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadError(null);
      setFormErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const addCourse = (courseId: string) => {
    if (!selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
      setFormErrors(prev => ({ ...prev, courses: undefined }));
    }
    setCourseSearch('');
    setIsAddingCourse(false);
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourseIds(selectedCourseIds.filter(id => id !== courseId));
  };

  const moveCourse = (index: number, direction: 'up' | 'down') => {
    const newIds = [...selectedCourseIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newIds.length) {
      [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
      setSelectedCourseIds(newIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    const errors: {name?: string; description?: string; image?: string; courses?: string} = {};

    if (!formData.name.trim()) {
      errors.name = "Training plan name is required.";
      hasError = true;
    } else if (formData.name.length < VALIDATION_LIMITS.TRAINING_PLAN.NAME_MIN_LENGTH) {
      errors.name = `Name must be at least ${VALIDATION_LIMITS.TRAINING_PLAN.NAME_MIN_LENGTH} characters.`;
      hasError = true;
    }
    
    if (!formData.description.trim()) {
      errors.description = "Description is required.";
      hasError = true;
    } else if (formData.description.length < VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MIN_LENGTH) {
      errors.description = `Description must be at least ${VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MIN_LENGTH} characters.`;
      hasError = true;
    }

    if (!imagePreview && !imageFile) {
      errors.image = t.pleaseUploadImage || "Please upload a training plan image.";
      hasError = true;
    }

    if (selectedCourseIds.length === 0) {
      errors.courses = t.selectAtLeastOneCourse || "Please select at least one course.";
      hasError = true;
    }

    setFormErrors(errors);

    if (hasError) {
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);
      
      let imageUrl = imagePreview; // Use existing if unchanged
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      dispatch(updateTrainingPlanRequest({
        id,
        ...formData,
        image: imageUrl as string,
        courseIds: selectedCourseIds,
      }));

      router.push('/admin/training-plans');
    } catch (err: any) {
      setUploadError(err.message || t.failedToUploadImage || "Failed to upload image.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableToAdd = courses.filter(c => 
    !selectedCourseIds.includes(c.id) && 
    (c.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
     c.instructor.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  const curriculumCourses = selectedCourseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);

  const error = planError || courseError || uploadError;

  if (role && !canEdit) return null;

  return (
    <div className={`${UI_COMPONENTS.pageContainer} animate-in fade-in duration-700`}>
      <header className="mb-6">
        <h1 className={TYPOGRAPHY.h1}>{t.editTrainingPlan || "Edit Training Plan"}</h1>
        <p className={`${TYPOGRAPHY.body} mt-1`}>{t.editTrainingPlanSubtitle || "Update your learning path details."}</p>
      </header>

      <div className={UI_COMPONENTS.card}>
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.trainingPlanName || "Training Plan Name"} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={VALIDATION_LIMITS.TRAINING_PLAN.NAME_MAX_LENGTH}
                  minLength={VALIDATION_LIMITS.TRAINING_PLAN.NAME_MIN_LENGTH}
                  className={`${UI_COMPONENTS.input} ${formErrors.name ? '!border-rose-500 !ring-rose-200' : ''}`}
                  placeholder={t.planTitlePlaceholder || "e.g. Frontend Masterclass"}
                />
                <div className="flex justify-between items-start mt-1.5">
                  <div className="flex-1">
                    {formErrors.name && (
                      <p className="text-sm text-rose-500 font-medium">{formErrors.name}</p>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 text-right shrink-0 ml-4">
                    {formData.name.length}/{VALIDATION_LIMITS.TRAINING_PLAN.NAME_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.descriptionLabel || "Description"} *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MAX_LENGTH}
                  minLength={VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MIN_LENGTH}
                  className={`${UI_COMPONENTS.input} resize-none ${formErrors.description ? '!border-rose-500 !ring-rose-200' : ''}`}
                  placeholder={t.planDescPlaceholder || "Describe this training plan..."}
                />
                <div className="flex justify-between items-start mt-1.5">
                  <div className="flex-1">
                    {formErrors.description && (
                      <p className="text-sm text-rose-500 font-medium">{formErrors.description}</p>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 text-right shrink-0 ml-4">
                    {formData.description.length}/{VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MAX_LENGTH}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.coverImage || "Cover Image"} *</label>
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-primary-400 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group h-[220px]"
              >
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  accept={VALIDATION_LIMITS.IMAGE.ACCEPTED_TYPES}
                  className="hidden"
                />
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]">
                      <span className="text-white font-medium flex items-center gap-2 text-sm">
                        <Pencil size={16} /> {t.descriptionLabel ? "Change Image" : "Change Image"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center z-10">
                    <ImageIcon className="text-slate-300 block mx-auto mb-3" size={40} />
                    <p className="text-sm font-medium text-slate-600">Click to upload cover image</p>
                    <p className="text-xs text-slate-400 mt-1">Recommended size: 1200x630px</p>
                  </div>
                )}
              </div>
              {formErrors.image && (
                <p className="mt-2 text-sm text-rose-500 font-medium">{formErrors.image}</p>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className={TYPOGRAPHY.h2}>{t.curriculum || "Curriculum"}</h2>
                <p className={`${TYPOGRAPHY.body} mt-1`}>{t.curriculumSubtitle || "Complete these courses in order to finish the training plan."}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCourse(true)}
                className={`${BUTTONS.tint} w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 text-sm !py-1.5`}
              >
                <Plus size={16} /> {t.addCourse || "Add Course"}
              </button>
            </div>

            {formErrors.courses && (
              <div className="mb-3">
                <p className="text-sm text-rose-500 font-medium">{formErrors.courses}</p>
              </div>
            )}

            {/* Curriculum List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {curriculumCourses.length === 0 ? (
                <div className="xl:col-span-2 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium text-sm">No courses added to the curriculum yet.</p>
                </div>
              ) : (
                curriculumCourses.map((course: any, index) => (
                  <div key={course.id} className={UI_COMPONENTS.cardRowItem}>
                    <div className="flex items-center gap-3 min-w-0 flex-grow">
                      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0 border border-slate-200">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                        {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <BookOpen size={16} className="text-slate-400" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{course.title}</p>
                          {course.visibility === 'private' && (
                            <span className="px-1.5 py-0.5 flex shrink-0 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wide border border-slate-200">Private</span>
                          )}
                          {course.visibility !== 'private' && (
                            <span className="px-1.5 py-0.5 flex shrink-0 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-600 uppercase tracking-wide border border-emerald-200">Public</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{course.instructor}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 shrink-0 sm:ml-auto w-full sm:w-auto pt-2 mt-1 sm:pt-0 sm:mt-0 border-t sm:border-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => moveCourse(index, 'up')}
                        disabled={index === 0}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400`}
                        title={t.moveUpCursor || "Move Up"}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCourse(index, 'down')}
                        disabled={index === curriculumCourses.length - 1}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400`}
                        title={t.moveDownCursor || "Move Down"}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => removeCourse(course.id)}
                        className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                        title={t.removeCourse || "Remove"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
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
              disabled={updateLoading || submitting}
              className={`${BUTTONS.primary} w-full sm:w-auto`}
            >
              {(submitting || updateLoading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t.savingEllipsis || "Saving..."}
                </>
              ) : (
                t.saveChanges || "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add Course Modal */}
      {isAddingCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className={TYPOGRAPHY.h2}>{t.addCourse || "Add Course to Curriculum"}</h3>
              <button 
                onClick={() => setIsAddingCourse(false)}
                className={`${BUTTONS.ghost} !p-1.5`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="relative mb-5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  autoFocus
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder={t.searchCoursePlaceholder || "Search by title or instructor..."}
                  className={`${UI_COMPONENTS.input} !pl-10`}
                />
              </div>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                {availableToAdd.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-slate-500 text-sm font-medium">No matching courses found.</p>
                  </div>
                ) : (
                  availableToAdd.map(course => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => addCourse(course.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                        {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <BookOpen size={16} className="text-slate-400" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-slate-900 text-sm truncate">{course.title}</p>
                          {course.visibility === 'private' && (
                            <span className="px-1.5 py-0.5 flex rounded text-[9px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wide border border-slate-200">Private</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{course.instructor}</p>
                      </div>
                      <span className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold text-xs tracking-tight flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                        Add <Plus size={12} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
