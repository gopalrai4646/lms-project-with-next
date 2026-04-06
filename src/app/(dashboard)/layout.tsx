import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import RouteGuard from "@/components/auth/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRole="any">
      <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
        <Navbar />
        <Sidebar />
        <ResponsiveLayout>
          <Breadcrumbs />
          {children}
        </ResponsiveLayout>
      </div>
    </RouteGuard>
  );
}
