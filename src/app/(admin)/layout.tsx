import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      <Navbar />
      <Sidebar />
      <ResponsiveLayout>
        <Breadcrumbs />
        {children}
      </ResponsiveLayout>
    </div>
  );
}
