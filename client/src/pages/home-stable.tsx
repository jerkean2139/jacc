import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/useAuth";
import { useNewChatFAB } from "@/components/bottom-nav";
import type { Chat, Folder } from "@shared/schema";

export default function HomeStable() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user's chats
  const { data: chats = [], refetch: refetchChats } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  // Fetch user's folders
  const { data: folders = [], refetch: refetchFolders } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  // Set active chat to most recent if none selected
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      const chatId = "05c2287d-a415-4de4-b9b4-1bc4628a337a";
      console.log("Setting active chat ID to:", chatId);
      setActiveChatId(chatId);
    }
  }, [chats]);

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "New Chat",
          isActive: true
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setActiveChatId(newChat.id);
        refetchChats();
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleFolderCreate = async (name: string, parentId?: string, color?: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          parentId: parentId || null,
          color: color || "blue"
        }),
      });

      if (response.ok) {
        refetchFolders();
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  // Connect the floating action button to new chat creation
  useNewChatFAB(handleNewChat);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header - Always visible on mobile */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <Sidebar
                user={user}
                chats={chats}
                folders={folders}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={handleChatSelect}
                onFolderCreate={handleFolderCreate}
                collapsed={false}
              />
            </SheetContent>
          </Sheet>
          <img src="/icons/icon-192x192.png" alt="JACC" className="w-8 h-8" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">JACC</h1>
        </div>
        <button
          onClick={handleNewChat}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Mobile Chat Area */}
      <div className="lg:hidden flex-1 pb-16">
          {/* Mobile Header */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <Sidebar
                    user={user}
                    chats={chats}
                    folders={folders}
                    activeChatId={activeChatId}
                    onNewChat={handleNewChat}
                    onChatSelect={handleChatSelect}
                    onFolderCreate={handleFolderCreate}
                    collapsed={false}
                  />
                </SheetContent>
              </Sheet>
              <img src="/icons/icon-192x192.png" alt="JACC" className="w-8 h-8" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">JACC</h1>
            </div>
            <button
              onClick={handleNewChat}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              chatId={activeChatId}
              onChatUpdate={refetchChats}
            />
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="flex-1">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Sidebar Panel */}
            <ResizablePanel
              defaultSize={25}
              minSize={20}
              maxSize={40}
              collapsible
              onCollapse={() => setSidebarCollapsed(true)}
              onExpand={() => setSidebarCollapsed(false)}
              className={sidebarCollapsed ? "min-w-0" : ""}
            >
              <Sidebar
                user={user}
                chats={chats}
                folders={folders}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={handleChatSelect}
                onFolderCreate={handleFolderCreate}
                collapsed={sidebarCollapsed}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Chat Panel */}
            <ResizablePanel defaultSize={75} minSize={60}>
              <ChatInterface
                chatId={activeChatId}
                onChatUpdate={refetchChats}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

      {/* Desktop Layout - Show on large screens only */}
      <div className="hidden lg:flex flex-1">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar Panel */}
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            maxSize={40}
            collapsible
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={sidebarCollapsed ? "min-w-0" : ""}
          >
            <Sidebar
              user={user}
              chats={chats}
              folders={folders}
              activeChatId={activeChatId}
              onNewChat={handleNewChat}
              onChatSelect={handleChatSelect}
              onFolderCreate={handleFolderCreate}
              collapsed={sidebarCollapsed}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chat Panel */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <ChatInterface
              chatId={activeChatId}
              onChatUpdate={refetchChats}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}