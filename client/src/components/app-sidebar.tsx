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
  SidebarTrigger, // Import SidebarTrigger here
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
    <Sidebar side={side} collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <SidebarTrigger className="h-8 w-8" />
          <div className="font-bold text-xl text-primary truncate">بوت التداول</div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-right px-4">التطبيق</SidebarGroupLabel>
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
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-2 py-1.5 text-sm flex-row-reverse">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 text-right font-medium">{user.email || 'مستخدم'}</span>
                </div>
                <SidebarMenuButton
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="w-full text-destructive hover:text-destructive flex-row-reverse gap-3 px-2"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-right">تسجيل الخروج</span>
                </SidebarMenuButton>
              </div>
            ) : (
              <SidebarMenuButton asChild className="w-full flex-row-reverse gap-3 px-2">
                <Link href="/auth">
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-right">تسجيل الدخول</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
