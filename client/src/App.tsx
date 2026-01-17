import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Logs from "@/pages/Logs";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Simple auth guard - if not logged in, show login page or redirect
  // For Replit Auth, we redirect to /api/login usually, but here I'll just show a landing/login button if not authed.
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
         <div className="w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
         </div>
         <h1 className="text-4xl font-bold text-white font-display mb-4">بوت التداول الذكي</h1>
         <p className="text-slate-400 max-w-md mb-8">نظام آلي لمراقبة الأسواق وتنفيذ الصفقات المربحة بدقة متناهية مع حماية الذكاء الاصطناعي.</p>
         <button 
           onClick={() => window.location.href = "/api/login"}
           className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-1"
         >
           تسجيل الدخول باستخدام Replit
         </button>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/logs" component={Logs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
