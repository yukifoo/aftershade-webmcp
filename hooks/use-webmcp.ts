'use client';

import { useEffect } from 'react';
import { registerAftershadeTools } from '@/lib/webmcp';

export function useWebMCP() {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void registerAftershadeTools(context, lifecycle.signal).catch((error) => {
      console.error('Aftershade WebMCP registration failed', error);
    });
    return () => lifecycle.abort();
  }, []);
}

