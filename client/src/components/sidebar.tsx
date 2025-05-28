import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MessageSquare,
  Folder,
  ChevronRight,
  ChevronDown,
  Star,
  Settings,
  LogOut,
  MoreVertical,
  Trash2,
  FolderPlus
} from "lucide-react";
import type { User, Chat, Folder as FolderType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: User;
  chats: Chat[];
  folders: FolderType[];
  activeChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (chatId: string) => void;
  onFolderCreate: (name: string, parentId?: string, color?: string) => void;
  onChatDelete?: (chatId: string) => void;
  collapsed?: boolean;
}

export default function Sidebar({
  user,
  chats,
  folders,
  activeChatId,
  onNewChat,
  onChatSelect,
  onFolderCreate,
  onChatDelete,
  collapsed = false
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim());
      setNewFolderName("");
      setCreatingFolder(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateFolder();
    } else if (e.key === "Escape") {
      setCreatingFolder(false);
      setNewFolderName("");
    }
  };

  const recentChats = chats
    .filter(chat => chat.isActive)
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
    .slice(0, 10);

  if (collapsed) {
    return (
      <div className="w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 space-y-4">
        <Button
          size="icon"
          onClick={onNewChat}
          className="navy-primary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 space-y-2">
          {recentChats.slice(0, 5).map((chat) => (
            <div key={chat.id} className="relative group">
              <Button
                variant={activeChatId === chat.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onChatSelect(chat.id)}
                className={cn(
                  "w-10 h-10",
                  activeChatId === chat.id && "navy-primary text-white"
                )}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onChatDelete?.(chat.id);
                }}
                className="absolute -top-1 -right-1 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full shadow-lg z-10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* User Profile Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
            <AvatarFallback className="navy-primary text-white">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sales Agent</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full navy-primary text-white hover:opacity-90 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 px-4">
        {/* Recent Chats Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Recent Chats
          </h4>
          <div className="space-y-1">
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                  activeChatId === chat.id 
                    ? "bg-slate-100 dark:bg-slate-800" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <MessageSquare className={cn(
                    "w-4 h-4 flex-shrink-0",
                    activeChatId === chat.id 
                      ? "text-green-500" 
                      : "text-slate-400 dark:text-slate-500"
                  )} />
                  <span className={cn(
                    "text-sm truncate",
                    activeChatId === chat.id 
                      ? "text-slate-900 dark:text-white font-medium" 
                      : "text-slate-700 dark:text-slate-300"
                  )}>
                    {chat.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {activeChatId === chat.id && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChatDelete?.(chat.id);
                    }}
                    className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onChatDelete?.(chat.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>

        {/* Folders Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Folders
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5"
              onClick={() => setCreatingFolder(true)}
            >
              <FolderPlus className="w-3 h-3" />
            </Button>
          </div>

          {creatingFolder && (
            <div className="mb-3">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Folder name..."
                className="h-8 text-sm"
                autoFocus
                onBlur={() => {
                  if (!newFolderName.trim()) {
                    setCreatingFolder(false);
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-1">
            {folders.filter(folder => !folder.parentId).map((folder) => (
              <Collapsible
                key={folder.id}
                open={expandedFolders.has(folder.id)}
                onOpenChange={() => toggleFolder(folder.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer group transition-colors">
                    <div className="flex items-center space-x-2">
                      {expandedFolders.has(folder.id) ? (
                        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                      <Folder className={cn(
                        "w-4 h-4",
                        folder.color === "green" ? "text-green-500" :
                        folder.color === "blue" ? "text-blue-500" :
                        folder.color === "yellow" ? "text-yellow-500" :
                        "text-slate-500"
                      )} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{folder.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      0 files
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6 space-y-1">
                  {/* Subfolder content would go here */}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Favorites Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Favorites
          </h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Quick Rate Calculator</span>
            </div>
            <div className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Enrollment Timeline</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Online</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-8 h-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
