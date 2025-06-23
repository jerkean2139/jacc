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
  TrendingUp,
  Settings,
  LogOut,
  MoreVertical,
  Trash2,
  FolderPlus,
  Download,
  Calculator,
  FileSearch,
  Brain,
  RotateCcw,
  FileText
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
  onFolderDelete?: (folderId: string) => void;
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
  onFolderDelete,
  onChatDelete,
  collapsed = false
}: SidebarProps) {
  // Debug logging
  console.log("Sidebar Debug:", {
    chatsCount: chats.length,
    hasOnChatDelete: !!onChatDelete,
    onChatDeleteType: typeof onChatDelete
  });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showAllChats, setShowAllChats] = useState(false);
  const [showAllFolders, setShowAllFolders] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // Clear any local storage/session data
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to login page after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear data and redirect even if logout request fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
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
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());

  const displayedChats = showAllChats ? recentChats : recentChats.slice(0, 7);
  const displayedFolders = showAllFolders ? folders : folders.slice(0, 7);

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
              {user?.role === 'admin' && (
                <>
                  <DropdownMenuItem asChild>
                    <a href="/admin/training" className="flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      AI Training
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/learning" className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Learning Path
                    </a>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4 space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full navy-primary text-white hover:opacity-90 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        
        <Button
          onClick={() => window.location.href = '/pricing-comparison'}
          variant="outline"
          className="w-full text-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Pricing Comparison
        </Button>



        <Button
          onClick={() => {
            if (window.confirm('This will restart the interactive tutorial. Continue?')) {
              localStorage.removeItem('tutorial-completed');
              window.location.reload();
            }
          }}
          variant="outline"
          className="w-full text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart Tutorial
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
            {displayedChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center p-2 rounded-lg transition-colors border",
                  activeChatId === chat.id 
                    ? "bg-slate-100 dark:bg-slate-800 border-blue-200" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent"
                )}
              >
                <div 
                  className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
                  onClick={() => onChatSelect(chat.id)}
                >
                  <MessageSquare className={cn(
                    "w-4 h-4 flex-shrink-0",
                    activeChatId === chat.id 
                      ? "text-green-500" 
                      : "text-slate-400 dark:text-slate-500"
                  )} />
                  
                  {/* Trash can icon for delete */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm("JACC wants to make sure you want to delete this chat history from the internal memory?")) {
                        try {
                          const response = await fetch(`/api/chats/${chat.id}`, {
                            method: "DELETE",
                            credentials: "include",
                          });
                          
                          if (response.ok) {
                            window.location.reload();
                          } else {
                            alert("Failed to delete chat");
                          }
                        } catch (error) {
                          alert("Error deleting chat");
                        }
                      }
                    }}
                    className="opacity-30 hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    title="Delete this chat"
                  >
                    <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                  </button>
                  
                  <span className={cn(
                    "text-sm truncate",
                    activeChatId === chat.id 
                      ? "text-slate-900 dark:text-white font-medium" 
                      : "text-slate-700 dark:text-slate-300"
                  )}>
                    {chat.title}
                  </span>
                  {activeChatId === chat.id && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-slate-400 hover:text-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this chat?")) {
                          try {
                            const response = await fetch(`/api/chats/${chat.id}`, {
                              method: "DELETE",
                              credentials: "include",
                            });
                            
                            if (response.ok) {
                              window.location.reload();
                            } else {
                              alert("Failed to delete chat");
                            }
                          } catch (error) {
                            alert("Error deleting chat");
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {recentChats.length > 7 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllChats(!showAllChats)}
                className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showAllChats ? "Show Less" : `Show ${recentChats.length - 7} More`}
                <ChevronDown className={cn(
                  "w-3 h-3 ml-1 transition-transform",
                  showAllChats && "rotate-180"
                )} />
              </Button>
            )}
          </div>
        </div>

        {/* Chat Organization Folders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Chat Categories
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5"
                onClick={() => setCreatingFolder(true)}
                title="Create new chat category"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5"
                title="Manage categories"
              >
                <Settings className="w-3 h-3 text-slate-400" />
              </Button>
            </div>
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
            {displayedFolders.filter(folder => !folder.parentId).map((folder) => (
              <Collapsible
                key={folder.id}
                open={expandedFolders.has(folder.id)}
                onOpenChange={() => toggleFolder(folder.id)}
              >
                <div className="relative group">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
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
                  {onFolderDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFolderDelete(folder.id);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-30 group-hover:opacity-100 transition-all duration-200 rounded-full shadow-lg z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <CollapsibleContent className="ml-6 space-y-1">
                  {/* Subfolder content would go here */}
                </CollapsibleContent>
              </Collapsible>
            ))}
            
            {folders.filter(folder => !folder.parentId).length > 7 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllFolders(!showAllFolders)}
                className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showAllFolders ? "Show Less" : `Show ${folders.filter(folder => !folder.parentId).length - 7} More`}
                <ChevronDown className={cn(
                  "w-3 h-3 ml-1 transition-transform",
                  showAllFolders && "rotate-180"
                )} />
              </Button>
            )}
          </div>
        </div>

        {/* AI Tools Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            AI Tools
          </h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 p-2 rounded-lg cursor-not-allowed opacity-50">
              <Brain className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">AI Prompts</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full ml-auto">Coming Soon</span>
            </div>
            <a 
              href="/user-guide" 
              className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Guide</span>
            </a>
          </div>
        </div>

        {/* Business Intelligence Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Business Intelligence
          </h4>
          <div className="space-y-1">
            <a 
              href="/iso-amp-calculator" 
              className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
            >
              <Calculator className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">ISO AMP</span>
            </a>
            <a 
              href="/merchant-insights" 
              className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Merchant Insights</span>
            </a>
          </div>
        </div>

        {/* Knowledge Base Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Knowledge Base
          </h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 p-2 rounded-lg cursor-not-allowed opacity-50">
              <FileSearch className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Document Library</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full ml-auto">Coming Soon</span>
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
