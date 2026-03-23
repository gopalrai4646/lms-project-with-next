import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white border-b border-slate-100 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20">
                New courses added this week. <Link href="/courses" className="font-semibold text-indigo-600"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></Link>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Elevate Your Learning Journey with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">LMS Portal</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              The modern, all-in-one platform for students and educators. Manage courses, track progress, and achieve your goals with ease.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-[0.98]"
              >
                Get Started for Free
              </Link>
              <Link href="/login" className="text-sm font-bold leading-6 text-slate-900 hover:text-indigo-600 transition-colors">
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
            <div className="aspect-[1000/600] w-[60rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]"></div>
        </div>
      </header>

      {/* Features Section */}
      <main className="flex-1 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600 uppercase tracking-widest">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Powerful tools for modern education
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                { name: 'Course Management', description: 'Easily organize and deliver your content with a clean, intuitive interface.', icon: '📚' },
                { name: 'Interactive Progress', description: 'Monitor learning paths with beautiful charts and real-time statistics.', icon: '📊' },
                { name: 'Seamless Integration', description: 'Connect with tools you love, including Cloudinary for media and Firebase for fast auth.', icon: '⚙️' },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <dt className="flex items-center gap-x-3 text-2xl">
                    {feature.icon}
                    <span className="text-lg font-bold leading-7 text-slate-900">{feature.name}</span>
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>© 2026 LMS Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
