import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceWorkerRegistration } from "@/components/platform/ServiceWorkerRegistration";
import { PushPermissionBanner } from "@/components/platform/PushPermissionBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <ServiceWorkerRegistration scope="/dashboard/" />
      <SidebarProvider className="[--sidebar-width:16rem] [--sidebar-width-icon:3.5rem]">
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden bg-background">
          <Topbar />
          <ScrollArea className="min-h-0 flex-1 bg-background">
            <main className="min-h-full bg-background pt-14">
              <div className="px-4 pt-3">
                <PushPermissionBanner portal="admin" />
              </div>
              {children}
            </main>
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  );
}
