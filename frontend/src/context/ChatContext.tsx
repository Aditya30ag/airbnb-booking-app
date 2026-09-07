'use client';

import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
  currentListingId: string | null;
  setCurrentListingId: (id: string | null) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({
  currentListingId: null,
  setCurrentListingId: () => {},
  isChatOpen: false,
  setIsChatOpen: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentListingId, setCurrentListingId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        currentListingId,
        setCurrentListingId,
        isChatOpen,
        setIsChatOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
