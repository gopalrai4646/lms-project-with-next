import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Sidebar />
      <main className="pl-0 md:pl-64 pt-16 min-h-screen transition-all">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase tracking-wider">Admin Area</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
