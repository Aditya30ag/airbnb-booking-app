import { apiClient } from '@/lib/apiClient';
import type { ChatResponse } from '@/types';

export const chatApi = {
  sendMessage: (
    message: string,
    listingId?: string | null,
    pageContext: string = 'general',
    city?: string | null
  ): Promise<ChatResponse> => {
    return apiClient<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        listing_id: listingId || null,
        city: city || null,
        page_context: pageContext,
      }),
    });
  },
};
