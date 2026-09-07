'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MessageCircle, X, Sparkles, Send, Bot, 
  MapPin, Star, ChevronRight 
} from 'lucide-react';
import { chatApi } from '@/services/chatApi';
import { useChat } from '@/context/ChatContext';
import type { ChatMessage, ListingCardResponse } from '@/types';

const STARTER_PROMPTS = [
  "Find me a villa in Goa under ₹8000",
  "Best stays in Manali for 2 guests",
  "What's a good beach stay?",
  "Help me plan a weekend trip to Udaipur",
];

export function ChatWidget({ listingIdProp }: { listingIdProp?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentListingId, isChatOpen, setIsChatOpen } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with context if opened from external trigger
  useEffect(() => {
    if (isChatOpen) {
      setIsOpen(true);
    }
  }, [isChatOpen]);

  // Determine active listing id: prop > context > URL pattern
  const activeListingId = listingIdProp || currentListingId || (
    pathname?.startsWith('/listings/') ? pathname.split('/listings/')[1]?.split('/')[0] : null
  );

  // Determine page context string
  let pageContext = 'general';
  if (pathname === '/') pageContext = 'explore';
  else if (pathname?.startsWith('/listings/')) pageContext = 'listing';
  else if (pathname?.startsWith('/trips')) pageContext = 'trips';

  // Auto-scroll when messages update or loading changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setIsChatOpen(false);
    }
  }, [isOpen, setIsChatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await chatApi.sendMessage(text, activeListingId, pageContext);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply || "I couldn't find specific details for that, but feel free to ask about other stays!",
        listings: res.suggested_listings,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I had trouble reaching the assistant server. Please check your connection or try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleListingClick = (id: string) => {
    router.push(`/listings/${id}`);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[380px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in mb-3">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF5A5F] to-[#FF385C] text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  StayFinder AI
                  <span className="text-[10px] uppercase font-semibold bg-white/25 px-1.5 py-0.5 rounded-full">Beta</span>
                </h3>
                <p className="text-xs text-white/80 font-normal">Ask me anything about stays in India</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Pill Banner (if on a specific listing) */}
          {activeListingId && (
            <div className="bg-rose-50/70 border-b border-rose-100 px-3 py-1.5 text-[11px] text-[#FF5A5F] font-medium flex items-center justify-between">
              <span>Chatting with context of current property</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40 text-sm">
            
            {/* Empty State / Starter Prompts */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#FF5A5F] flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Welcome to StayFinder AI!</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                    I can recommend personalized stays, check amenities, or help you plan your itinerary.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-left pl-1">Suggested questions:</p>
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#FF5A5F] hover:text-[#FF5A5F] transition text-xs font-medium text-gray-700 shadow-xs flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A5F] shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Conversation Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                {msg.role === 'user' ? (
                  <div className="bg-[#FF5A5F] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm max-w-[85%] shadow-xs leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-[95%]">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div className="bg-white border border-gray-100 text-gray-900 rounded-2xl rounded-tl-xs px-4 py-3 text-sm shadow-xs leading-relaxed whitespace-pre-line">
                        {msg.content}
                      </div>

                      {/* Suggested Mini Listing Cards Carousel */}
                      {msg.listings && msg.listings.length > 0 && (
                        <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-[310px] hide-scrollbar pt-1">
                          {msg.listings.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleListingClick(item.id)}
                              className="w-48 shrink-0 bg-white border border-gray-200 hover:border-gray-900 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col group"
                            >
                              <div className="h-24 w-full bg-gray-100 overflow-hidden relative">
                                {item.cover_image_url ? (
                                  <img
                                    src={item.cover_image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200" />
                                )}
                                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                                  {item.city}
                                </span>
                              </div>
                              <div className="p-2.5 flex flex-col gap-1">
                                <h5 className="font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-[#FF5A5F] transition">
                                  {item.title}
                                </h5>
                                <div className="flex items-center justify-between text-[11px] text-gray-600">
                                  <span className="font-semibold text-gray-900">
                                    ₹{Number(item.price_per_night).toLocaleString('en-IN')}<span className="text-gray-400 font-normal">/n</span>
                                  </span>
                                  <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    {item.rating_avg > 0 ? item.rating_avg.toFixed(1) : 'New'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF5A5F] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#FF5A5F] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#FF5A5F] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about stays, prices, amenities..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 text-xs border border-gray-200 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent transition bg-gray-50/50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className="w-9 h-9 rounded-full bg-[#FF5A5F] hover:bg-[#E0484D] disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Collapsed Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open StayFinder AI Assistant"
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#FF5A5F] to-[#FF385C] hover:scale-105 active:scale-95 text-white shadow-2xl flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-200 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          {/* Pulsing Dot indicating AI available */}
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white" />
          </span>
        </button>
      )}
    </div>
  );
}
