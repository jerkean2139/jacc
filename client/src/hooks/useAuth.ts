import type { User } from "@shared/schema";

export function useAuth() {
  // Demo user for seamless experience
  const demoUser = {
    id: 'demo-user',
    username: 'demo',
    email: 'demo@example.com',
    role: 'sales-agent'
  };

  return {
    user: demoUser,
    isLoading: false,
    isAuthenticated: true,
  };
}
