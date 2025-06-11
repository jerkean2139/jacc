import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // For demo purposes, if auth fails, provide a default user
  const demoUser = {
    id: 'demo-user',
    username: 'demo',
    email: 'demo@example.com',
    role: 'sales-agent'
  };

  const effectiveUser = user || (error ? demoUser : null);

  return {
    user: effectiveUser,
    isLoading: isLoading && !error,
    isAuthenticated: !!effectiveUser,
  };
}
