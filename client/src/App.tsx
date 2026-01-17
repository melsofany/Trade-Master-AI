import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";

import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Settings from "@/pages/Settings";
import Logs from "@/pages/Logs";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && window.location.pathname !== "/login") {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {!user ? (
        <Route path="/:rest*">
          {() => null}
        </Route>
      ) : (
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/accounts" component={Accounts} />
            <Route path="/settings" component={Settings} />
            <Route path="/logs" component={Logs} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
