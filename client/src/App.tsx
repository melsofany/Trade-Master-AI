import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogOut, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";

import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Logs from "@/pages/Logs";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
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

function Layout() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 shrink-0">
        <h1 className="text-lg font-semibold text-primary">الرئيسية</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                <User className="h-4 w-4" />
                <span className="font-medium">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          ) : (
            <Button asChild variant="default" size="sm" className="gap-2">
              <Link href="/auth">
                <LogIn className="h-4 w-4" />
                <span>تسجيل الدخول</span>
              </Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-slate-50">
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
