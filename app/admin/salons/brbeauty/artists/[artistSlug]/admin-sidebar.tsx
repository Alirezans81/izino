import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

const menu = [
  // {
  //   title: "ساعات کاری",
  //   route: "/admin/services",
  //   icon: <ScissorsLineDashed />,
  // },
  // {
  //   title: "خدمات",
  //   route: "/admin/services",
  //   icon: <ScissorsLineDashed />,
  // },
  // {
  //   title: "درخواست های رزرو",
  //   route: "/admin/reservations",
  //   icon: <ScissorsLineDashed />,
  // },
];

export function AdminSidebar() {
  return (
    <Sidebar dir="rtl" side="right">
      <SidebarHeader />
      <SidebarContent>
        <SidebarMenuItem className="px-3">
          {menu.map((item) => (
            <SidebarMenuButton
              key={item.route}
              render={<Link href={`${item.route}`} />}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          ))}
        </SidebarMenuItem>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
