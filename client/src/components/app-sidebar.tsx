import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Settings, ScrollText, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    { title: "الرئيسية", icon: LayoutDashboard, url: "/" },
    { title: "سجل العمليات", icon: ScrollText, url: "/logs" },
    { title: "الإعدادات", icon: Settings, url: "/settings" },
  ];

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-lg font-bold text-primary text-right">لوحة التحكم</h2>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url} 
                    tooltip={item.title} 
                    className="flex-row-reverse gap-3 px-4"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-right">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            {user && (
              <SidebarMenuButton
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="w-full text-destructive hover:text-destructive flex-row-reverse gap-3 px-2"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-right">تسجيل الخروج</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
