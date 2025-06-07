import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Calculator, 
  BookOpen, 
  Settings,
  Plus,
  Home,
  HelpCircle,
  MessageSquare,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    icon: Home,
    label: "Home"
  },
  {
    href: "/iso-amp-calculator",
    icon: Calculator,
    label: "Calculator"
  },
  {
    href: "/guide",
    icon: BookOpen,
    label: "Guide"
  },
  {
    href: "/help",
    icon: HelpCircle,
    label: "Help"
  },
  {
    href: "/admin",
    icon: Settings,
    label: "Admin"
  }
];

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "";
    }
    return location.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
                    "min-w-[60px] h-12",
                    active
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mb-0.5",
                    active ? "text-blue-600 dark:text-blue-400" : ""
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    active ? "text-blue-600 dark:text-blue-400" : ""
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button for New Chat */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <button
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={() => {
            // Trigger new chat creation
            const event = new CustomEvent('createNewChat');
            window.dispatchEvent(event);
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom padding for content to avoid overlap */}
      <div className="h-16 md:hidden" />
    </>
  );
}

// Hook to handle new chat creation from FAB
export function useNewChatFAB(onNewChat: () => void) {
  const handleNewChat = () => {
    onNewChat();
  };

  // Listen for custom event from FAB
  if (typeof window !== 'undefined') {
    window.addEventListener('createNewChat', handleNewChat);
    return () => window.removeEventListener('createNewChat', handleNewChat);
  }
}