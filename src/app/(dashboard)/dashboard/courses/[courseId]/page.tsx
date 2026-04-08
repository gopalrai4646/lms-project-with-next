'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoursesRequest } from '@/store/slices/courseSlice';
import { useTranslation } from 'react-i18next';

export default function CourseRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const dispatch = useAppDispatch();
  const { courses, loading } = useAppSelector(state => state.courses);
  const { t: i18nT } = useTranslation();
  const t = i18nT('coursePlayer', { returnObjects: true }) as any;
  const planId = searchParams.get('planId');

  useEffect(() => {
    if (courses.length === 0) {
      dispatch(fetchCoursesRequest());
    }
  }, [dispatch, courses.length]);

  useEffect(() => {
    if (courses.length > 0) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        // Redirect to the first video
        const redirectUrl = `/dashboard/courses/${courseId}/video_0${planId ? `?planId=${planId}` : ''}`;
        router.replace(redirectUrl);
      }
    }
  }, [loading, courses, courseId, router, planId]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
        <p className="text-slate-500 font-medium">{t.loadingCourse}</p>
      </div>
    </div>
  );
}
