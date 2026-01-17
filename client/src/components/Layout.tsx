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
    { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/logs", label: "سجل الصفقات", icon: Activity },
    { href: "/settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row rtl" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-l border-border flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-display tracking-tight">بوت التداول الذكي</h1>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              متصل بالشبكة
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="p-4 rounded-xl bg-secondary/30 mb-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent">حماية الذكاء الاصطناعي</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              المراقبة النشطة للمخاطر تعمل بكفاءة عالية. آخر تحديث منذ دقيقتين.
            </p>
          </div>

          <div className="flex items-center gap-3 px-2 mb-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{user?.firstName || 'مستخدم'} {user?.lastName}</p>
               <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
             </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background/50 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2070&auto=format&fit=crop')] opacity-[0.02] mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat fixed" />
        <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
