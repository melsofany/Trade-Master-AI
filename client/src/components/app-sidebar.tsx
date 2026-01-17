import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Settings, ScrollText, LogOut, LogIn, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function AppSidebar({ side = "right" }: { side?: "left" | "right" }) {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    { title: "لوحة التحكم", icon: LayoutDashboard, url: "/" },
    { title: "السجلات", icon: ScrollText, url: "/logs" },
    { title: "الإعدادات", icon: Settings, url: "/settings" },
  ];

  return (
    <Sidebar side={side}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">بوت التداول</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>التطبيق</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <User className="h-4 w-4" />
                  <span className="truncate">{user.email || 'مستخدم'}</span>
                </div>
                <SidebarMenuButton
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </SidebarMenuButton>
              </div>
            ) : (
              <SidebarMenuButton asChild className="w-full justify-start">
                <Link href="/auth">
                  <LogIn className="h-4 w-4" />
                  <span>تسجيل الدخول</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
