import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Try development auth first in development mode
  const { data: devUser, isLoading: devLoading } = useQuery({
    queryKey: ["/api/dev/current-user"],
    retry: false,
    enabled: process.env.NODE_ENV === 'development',
  });

  // Fallback to production auth
  const { data: prodUser, isLoading: prodLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !devUser && process.env.NODE_ENV !== 'development',
  });

  const user = devUser || prodUser;
  const isLoading = devLoading || prodLoading;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
