import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export default function DashboardLayout({
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
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
}
