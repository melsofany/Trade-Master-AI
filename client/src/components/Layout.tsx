import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  LogOut, 
  Bot,
  ShieldCheck,
  Menu,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { href: "/", label: "نظرة عامة على النظام", icon: LayoutDashboard },
    { href: "/accounts", label: "الحسابات والتقارير", icon: ShieldCheck },
    { href: "/logs", label: "سجل العمليات التقني", icon: Activity },
    { href: "/settings", label: "تهيئة النظام", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#eff2f5] text-foreground flex flex-col rtl" dir="rtl">
      {/* SAP Shell Bar (Top) */}
      <header className="sap-shell-bar h-12 flex items-center justify-between px-4 z-50 sticky top-0 w-full shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:bg-white/10 h-8 w-8"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-white" />
            <h1 className="font-bold text-sm text-white font-display uppercase tracking-wider">Trading ERP</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-white/70">المستخدم الحالي</span>
            <span className="text-xs font-bold text-white">{user?.firstName || 'مستخدم'} {user?.lastName || ''}</span>
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

      <div className="flex-1 flex overflow-hidden relative">
        {/* SAP Side Navigation */}
        <aside 
          className={cn(
            "bg-white border-l border-border flex flex-col shrink-0 z-40 shadow-sm transition-all duration-300 ease-in-out overflow-hidden",
            isSidebarOpen ? "w-64" : "w-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="p-4 border-b border-border bg-slate-50/50 whitespace-nowrap">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">القائمة الرئيسية</p>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold transition-all group whitespace-nowrap",
                    isActive 
                      ? "bg-blue-50 text-primary border-r-4 border-primary shadow-sm" 
                      : "text-[#32363a] hover:bg-slate-50 hover:text-primary"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-border mt-auto whitespace-nowrap">
            <div className="p-3 rounded bg-blue-50/50 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] font-bold text-primary">حماية SAP النشطة</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                النظام مراقب بالذكاء الاصطناعي لضمان سلامة الصفقات.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Subheader / Breadcrumbs */}
          <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
               <span className="hover:text-primary cursor-pointer">الرئيسية</span>
               <span>/</span>
               <span className="font-bold text-[#32363a]">
                 {navItems.find(i => i.href === location)?.label || "الصفحة الحالية"}
               </span>
             </div>
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-50 border border-green-100">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                 <span className="text-[10px] font-bold text-green-700">النظام يعمل بكفاءة</span>
               </div>
             </div>
          </div>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* SAP Footer Bar */}
      <footer className="h-8 bg-white border-t border-border flex items-center px-4 text-[10px] text-muted-foreground justify-between shrink-0">
        <p>© 2026 Trading ERP System | SAP Standard Edition</p>
        <div className="flex items-center gap-4 font-medium">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-accent" /> المراقبة مفعلة</span>
          <span className="px-2 border-r border-border">v1.0.5-SAP</span>
        </div>
      </footer>
    </div>
  );
}
