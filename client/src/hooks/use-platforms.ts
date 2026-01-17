import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function usePlatforms() {
  return useQuery({
    queryKey: [api.platforms.list.path],
    queryFn: async () => {
      const res = await fetch(api.platforms.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch platforms");
      return api.platforms.list.responses[200].parse(await res.json());
    },
  });
}
