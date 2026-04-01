'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { updateRatingRequest } from '@/store/slices/progressSlice';

interface CourseRatingModalProps {
  courseId: string;
  userId: string;
  courseTitle: string;
  onDismiss: () => void;
}

export default function CourseRatingModal({ courseId, userId, courseTitle, onDismiss }: CourseRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const dispatch = useAppDispatch();

  const handleSubmit = () => {
    if (rating === 0) return;
    dispatch(updateRatingRequest({ userId, courseId, rating }));
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative p-8 text-center">
          <button 
            onClick={onDismiss}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Star size={40} fill="currentColor" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">Enjoying this course?</h3>
          <p className="text-slate-500 mb-8 leading-relaxed px-4">
            Congratulations on finishing <span className="font-bold text-slate-700">{courseTitle}</span>! How would you rate your learning experience?
          </p>

          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`transition-all duration-200 transform hover:scale-125 ${
                  (hover || rating) >= star ? 'text-amber-400' : 'text-slate-200'
                }`}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  size={42} 
                  fill={(hover || rating) >= star ? 'currentColor' : 'none'} 
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg ${
                rating > 0 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:shadow-indigo-200' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Submit Rating
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
            >
              Rate Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
