'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { updateRatingRequest } from '@/store/slices/progressSlice';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';

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
    <div className={`${UI_COMPONENTS.modalBackdrop} z-[100]`}>
      <div className={`${UI_COMPONENTS.modalContent} max-w-md p-0`}>
        <div className="relative p-8 text-center bg-white">
          <button 
            onClick={onDismiss}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <h3 className={`${TYPOGRAPHY.h2} mb-2`}>Enjoying this course?</h3>
          <p className={`${TYPOGRAPHY.body} mb-8 px-2`}>
            Congratulations on finishing <span className="font-bold text-slate-900">{courseTitle}</span>! How would you rate your learning experience?
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

          <div className="space-y-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`${BUTTONS.primary} w-full !py-3.5 !text-base !font-bold ${rating > 0 ? 'shadow-lg shadow-primary-600/20' : ''}`}
            >
              Submit Rating
            </button>
            <button
              onClick={onDismiss}
              className={`${BUTTONS.ghost} w-full !py-3 !text-sm`}
            >
              Rate Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
