import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // In development, try dev auth first, fallback to production auth
  const isDev = process.env.NODE_ENV === 'development';
  
  const { data: user, isLoading } = useQuery({
    queryKey: [isDev ? "/api/dev/current-user" : "/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
