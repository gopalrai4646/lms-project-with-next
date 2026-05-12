'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createTrainingPlanRequest } from '@/store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { useTranslation } from 'react-i18next';
import { Pencil, Image as ImageIcon, Plus, BookOpen, ChevronUp, ChevronDown, Trash2, Search, X } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

export default function NewTrainingPlanPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { createLoading, error } = useAppSelector((state) => state.trainingPlans);
  const { courses } = useAppSelector((state) => state.courses);
  const { role, permissions } = useAppSelector((state) => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;

  const canCreate = role === 'admin' || (role === 'staff' && hasPermission(permissions as any, 'training_plans_create'));

  useEffect(() => {
    if (role && !canCreate) {
      router.push('/admin');
    }
  }, [role, canCreate, router]);

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
  
  const [courseSearch, setCourseSearch] = useState('');
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  useEffect(() => {
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, courses.length]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const addCourse = (courseId: string) => {
    if (!selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
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

    if (!imageFile) {
      setUploadError(t.pleaseUploadImage || "Please upload a training plan image.");
      return;
    }

    if (selectedCourseIds.length === 0) {
      setUploadError(t.selectAtLeastOneCourse || "Please select at least one course.");
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);
      const imageUrl = await uploadToCloudinary(imageFile);

      dispatch(createTrainingPlanRequest({
        ...formData,
        image: imageUrl,
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

  if (role && !canCreate) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.newTrainingPlan || "New Training Plan"}</h1>
        <p className="text-slate-500">{t.newTrainingPlanSubtitle || "Create a new learning path by grouping courses together."}</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 md:p-8">
        {(error || uploadError) && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
            {error || uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.trainingPlanName || "Training Plan Name"}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
                  placeholder="e.g. Frontend Masterclass"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.descriptionLabel || "Description"}</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
                  placeholder="Describe this training plan..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.coverImage || "Cover Image"}</label>
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group h-[210px]"
              >
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-white font-semibold flex items-center gap-2">
                        <Pencil size={18} /> {t.descriptionLabel ? "Change Image" : "Change Image"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center z-10">
                    <ImageIcon className="text-slate-300 block mx-auto mb-2" size={48} />
                    <p className="text-sm font-medium text-slate-600">Click to upload cover image</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.curriculum || "Curriculum"}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.curriculumSubtitle || "Complete these courses in order to finish the training plan."}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCourse(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> {t.addCourse || "Add Course"}
              </button>
            </div>

            {/* Curriculum List */}
            <div className="space-y-3">
              {curriculumCourses.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">No courses added to the curriculum yet.</p>
                </div>
              ) : (
                curriculumCourses.map((course: any, index) => (
                  <div key={course.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl group hover:border-indigo-200 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <BookOpen size={20} className="text-slate-400" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 text-sm truncate">{course.title}</p>
                        {course.visibility === 'private' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-600 uppercase tracking-wide">Private</span>
                        )}
                        {course.visibility !== 'private' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wide">Public</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{course.instructor}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveCourse(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                        title={t.moveUpCursor || "Move Up"}
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCourse(index, 'down')}
                        disabled={index === curriculumCourses.length - 1}
                        className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                        title={t.moveDownCursor || "Move Down"}
                      >
                        <ChevronDown size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCourse(course.id)}
                        className="p-2 text-slate-400 hover:text-rose-600"
                        title={t.removeCourse || "Remove"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={createLoading || submitting}
              className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto text-lg"
            >
              {submitting || createLoading ? t.savingEllipsis || "Saving..." : t.createTrainingPlan || "Create Training Plan"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all w-full sm:w-auto text-lg"
            >
              {t.cancel || "Cancel"}
            </button>
          </div>
        </form>
      </div>

      {/* Add Course Modal */}
      {isAddingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{t.addCourse || "Add Course to Curriculum"}</h3>
              <button 
                onClick={() => setIsAddingCourse(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  autoFocus
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search by title or instructor..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {availableToAdd.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 italic">No matching courses found.</p>
                  </div>
                ) : (
                  availableToAdd.map(course => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => addCourse(course.id)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <BookOpen size={20} className="text-slate-400" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-900 text-sm truncate">{course.title}</p>
                          {course.visibility === 'private' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-600 uppercase tracking-wide">Private</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{course.instructor}</p>
                      </div>
                      <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm tracking-tight flex items-center gap-1.5">Add <Plus size={14} /></span>
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
