'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateTrainingPlanRequest, fetchTrainingPlansRequest } from '@/store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { translations } from '@/utils/translations';

export default function EditTrainingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);
  
  const { trainingPlans, loading, error: planError } = useAppSelector((state) => state.trainingPlans);
  const { courses, error: courseError } = useAppSelector((state) => state.courses);
  const { language } = useAppSelector((state) => state.settings);
  const t = translations[language]?.admin || translations['en'].admin;

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

  useEffect(() => {
    if (trainingPlans.length === 0) {
      dispatch(fetchTrainingPlansRequest());
    }
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, trainingPlans.length, courses.length]);

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
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId) 
        ? prev.filter(cId => cId !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview && !imageFile) {
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

  const error = planError || courseError || uploadError;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t.editTrainingPlan || "Edit Training Plan"}</h1>
        <p className="text-slate-500">{t.editTrainingPlanSubtitle || "Update your learning path details."}</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.trainingPlanName || "Training Plan Name"}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="e.g. Frontend Masterclass"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.descriptionLabel || "Description"}</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="Describe this training plan..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.coverImage || "Cover Image"}</label>
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group min-h-[160px]"
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
                      <span className="text-white font-semibold flex items-center gap-2"><span>✏️</span> Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center z-10">
                    <span className="text-3xl block mb-2">🖼️</span>
                    <p className="text-sm font-medium text-slate-600">Click to upload cover image</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-3">{t.selectCourses || "Select Courses"}</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No courses available.</p>
                ) : (
                  courses.map(course => (
                    <label key={course.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedCourseIds.includes(course.id)}
                        onChange={() => toggleCourseSelection(course.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-2">
                          {course.title}
                          {course.visibility === 'private' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide">Private</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{course.description}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || submitting}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {submitting || loading ? t.savingEllipsis || "Saving..." : t.saveChanges || "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all w-full sm:w-auto"
            >
              {t.cancel || "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
