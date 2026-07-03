import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  );
}
