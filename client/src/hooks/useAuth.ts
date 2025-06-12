import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh auth state
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
