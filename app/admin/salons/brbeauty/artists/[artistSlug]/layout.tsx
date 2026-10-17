import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";

export default function AdminLayout({ children }: LayoutProps<"/admin/salons/brbeauty/artists/[artistSlug]">) {
  return (
    <SidebarProvider>
      {/* <AdminSidebar /> */}
      <main className="px-5 py-4">{children}</main>
    </SidebarProvider>
  );
}
