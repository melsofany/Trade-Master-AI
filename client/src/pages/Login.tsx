import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Lock, User, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل تسجيل الدخول");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
      toast({
        title: "تم تسجيل الدخول",
        description: "مرحباً بك مجدداً في نظام التداول",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الدخول",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-border/50 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground">نظام التداول الآلي والتحليل الذكي</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium mr-1">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                required
                type="text"
                className="w-full p-3 pr-11 rounded-xl bg-secondary/20 border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                required
                type="password"
                className="w-full p-3 pr-11 rounded-xl bg-secondary/20 border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              "جاري التحقق..."
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                دخول النظام
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          جميع الحقوق محفوظة © 2026 نظام التداول الذكي
        </p>
      </motion.div>
    </div>
  );
}
