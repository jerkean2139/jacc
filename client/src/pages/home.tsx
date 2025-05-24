import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Sidebar from "@/components/sidebar";
import ChatInterface from "@/components/chat-interface";
import UserStatsDashboard from "@/components/user-stats-dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNewChatFAB } from "@/components/bottom-nav";
import type { Chat, Folder } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      // Force set the active chat ID to the existing chat
      const chatId = "05c2287d-a415-4de4-b9b4-1bc4628a337a";
      console.log("Setting active chat ID to:", chatId);
      setActiveChatId(chatId);
    }
  }, [chats, activeChatId]);

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
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1">
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

      {/* Mobile Layout */}
      <div className="flex-1 md:hidden pb-16">
        <ChatInterface
          chatId={activeChatId}
          onChatUpdate={refetchChats}
        />
      </div>
    </div>
  );
}
