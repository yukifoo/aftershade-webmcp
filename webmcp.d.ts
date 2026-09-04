import type { ModelContextLike } from './lib/webmcp';

declare global {
  interface Document {
    readonly modelContext?: ModelContextLike;
  }
}

export {};

