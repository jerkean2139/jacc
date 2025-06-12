import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh auth state
    queryFn: async () => {
      const res = await fetch("/api/user", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        return null; // Return null for unauthenticated users
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
