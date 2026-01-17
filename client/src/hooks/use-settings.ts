import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertBotSettings, type InsertUserApiKey } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useBotSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateBotSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<InsertBotSettings>) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update settings");
      }
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات البوت بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: [api.keys.list.path],
    queryFn: async () => {
      const res = await fetch(api.keys.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return api.keys.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertUserApiKey) => {
      const res = await fetch(api.keys.create.path, {
        method: api.keys.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add API key");
      }
      return api.keys.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.keys.list.path] });
      toast({
        title: "تمت الإضافة",
        description: "تم ربط مفتاح API بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(api.keys.delete.path.replace(":id", id.toString()), {
        method: api.keys.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete API key");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.keys.list.path] });
      toast({
        title: "تم الحذف",
        description: "تم إزالة مفتاح API",
      });
    },
  });
}
