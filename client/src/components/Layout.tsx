import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  LogOut, 
  Bot,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "نظرة عامة على النظام", icon: LayoutDashboard },
    { href: "/logs", label: "سجل العمليات التقني", icon: Activity },
    { href: "/settings", label: "تهيئة النظام", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col rtl" dir="rtl">
      {/* SAP Shell Bar */}
      <header className="sap-shell-bar h-12 flex items-center justify-between px-4 z-50 sticky top-0 w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-white" />
            <h1 className="font-bold text-sm text-white font-display uppercase tracking-wider">Trading ERP</h1>
          </div>
          
          <nav className="hidden md:flex items-center h-full">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "h-12 flex items-center px-4 text-xs font-semibold transition-colors border-b-2",
                    isActive 
                      ? "border-white bg-white/10 text-white" 
                      : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-white/70">المستخدم الحالي</span>
            <span className="text-xs font-bold text-white">{user?.firstName} {user?.lastName}</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 hover:bg-white/10 rounded transition-colors text-white"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumbs or Subheader (SAP Style) */}
        <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
             <span>النظام الرئيسي</span>
             <span>/</span>
             <span className="font-bold text-foreground">
               {navItems.find(i => i.href === location)?.label || "الصفحة الحالية"}
             </span>
           </div>
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 border border-green-200">
               <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
               <span className="text-[10px] font-bold text-green-700">متصل بالشبكة</span>
             </div>
           </div>
        </div>

        <main className="flex-1 p-4 md:p-6 bg-[#eff2f5]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* SAP Footer Bar */}
      <footer className="h-8 bg-white border-t border-border flex items-center px-4 text-[10px] text-muted-foreground justify-between">
        <p>© 2026 Trading ERP System | All Rights Reserved</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-accent" /> حماية النشطة</span>
          <span>v1.0.4-SAP</span>
        </div>
      </footer>
    </div>
  );
}
