import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-24 sm:pt-32 sm:pb-40">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 blur-3xl opacity-20 pointer-events-none">
          <div className="aspect-[1100/600] w-[70rem] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"></div>
        </div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-10 flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-indigo-600 font-semibold ring-1 ring-indigo-600/10 bg-indigo-50/50 backdrop-blur-sm hover:ring-indigo-600/20 transition-all">
                ✨ New: Multi-video courses now live. <Link href="/signup" className="font-bold underline-offset-4 hover:underline">Explore catalog &rarr;</Link>
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Master New Skills with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600">Mentora</span>
            </h1>
            <p className="text-xl leading-relaxed text-slate-600 mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              The all-in-one platform to manage courses, track real-time progress, and achieve your educational goals through an intuitive digital experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link
                href="/signup"
                className="w-full sm:w-auto rounded-2xl bg-indigo-600 px-10 py-5 text-base font-black text-white shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
              >
                Get Started for Free
              </Link>
              <Link 
                href="/signup" 
                className="w-full sm:w-auto rounded-2xl bg-white px-10 py-5 text-base font-black text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                View Course Catalog
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Feature Highlights Section */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-black leading-7 text-indigo-600 uppercase tracking-widest mb-2">Feature Highlights</h2>
            <p className="text-4xl font-extrabold tracking-tight text-slate-900">Built for modern learning.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                name: 'Smart Course Management', 
                description: 'Organize your learning materials with a clean interface designed for focus.',
                icon: '📚',
                gradient: 'from-blue-500 to-indigo-500'
              },
              { 
                name: 'Interactive Analytics', 
                description: 'Visualize your growth with detailed progress charts and performance statistics.',
                icon: '📊',
                gradient: 'from-violet-500 to-purple-500'
              },
              { 
                name: 'Secure & Fast', 
                description: 'Built with Firebase for instant authentication and Cloudinary for seamless media delivery.',
                icon: '⚡',
                gradient: 'from-amber-500 to-orange-500'
              },
            ].map((feature) => (
              <div key={feature.name} className="group relative bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.name}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Student & Instructor Value Props */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="p-10 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700">🎓</div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-200 mb-4">For Students</h3>
              <p className="text-2xl font-bold leading-snug mb-6 italic">
                "Learn at your own pace with structured paths and easy access to resources anywhere, anytime."
              </p>
              <div className="h-1 w-12 bg-indigo-300 rounded-full"></div>
            </div>
            
            <div className="p-10 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
              <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700">👨‍🏫</div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-4">For Instructors</h3>
              <p className="text-2xl font-bold leading-snug mb-6 italic">
                "Create, manage, and scale your teaching with powerful administrative tools that do the heavy lifting for you."
              </p>
              <div className="h-1 w-12 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer & Trust Signals */}
      <footer className="mt-auto bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Recent Updates</h4>
              <p className="text-sm text-slate-600">Stay informed with our latest course additions and platform features.</p>
            </div>
            <div className="md:text-right">
              <p className="text-sm text-slate-500">© 2026 Mentora. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

