import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Menu, Plus, MessageSquare, Folder, Download, Settings, HelpCircle, Calculator, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/useAuth";
import { useNewChatFAB } from "@/components/bottom-nav";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function HomeStable() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract chatId from URL
  const activeChatId = location.includes('/chat/') ? location.split('/chat/')[1] : null;

  // Fetch chats and folders
  const { data: chats = [], refetch: refetchChats } = useQuery({
    queryKey: ["/api/chats"],
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
  });

  // Mutation for creating new chat
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chats", {
        title: "New Chat",
      });
      return response.json();
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      navigate(`/chat/${newChat.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  });

  // Mutation for creating new folder
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/folders", { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
  });

  const handleNewChat = () => {
    createChatMutation.mutate();
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleFolderCreate = (name: string) => {
    createFolderMutation.mutate(name);
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
          <img 
            src="/jacc-logo.jpg" 
            alt="JACC" 
            className="w-8 h-8 rounded-full object-cover" 
          />
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
      <div className="lg:hidden flex-1 h-[calc(100vh-80px)]">
        <ChatInterface 
          chatId={activeChatId} 
          onChatUpdate={refetchChats}
        />
      </div>

      {/* Desktop Layout - CSS Grid for stability */}
      <div className="hidden lg:grid grid-cols-[320px_1fr] h-full w-full">
        {/* Sidebar - Fixed width grid column */}
        <div className="border-r border-border overflow-hidden">
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
        </div>

        {/* Chat Panel - Flexible grid column */}
        <div className="overflow-hidden">
          <ChatInterface
            chatId={activeChatId}
            onChatUpdate={refetchChats}
          />
        </div>
      </div>
    </div>
  );
}