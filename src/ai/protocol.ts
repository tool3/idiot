import type { ModelId } from './models';
import type { Stage } from './prompt';

export type Backend = 'webgpu' | 'wasm';

export type WorkerRequest =
  | { readonly kind: 'probe' }
  | { readonly kind: 'load'; readonly model: ModelId }
  | { readonly kind: 'translate'; readonly ticket: string; readonly phrase: string }
  | { readonly kind: 'interrupt' };

export type WorkerResponse =
  | { readonly kind: 'backend'; readonly backend: Backend }
  | { readonly kind: 'fetching'; readonly percent: number; readonly loaded: number; readonly total: number }
  | { readonly kind: 'compiling' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'repaired'; readonly ticket: string; readonly phrase: string }
  | { readonly kind: 'verdict'; readonly ticket: string; readonly figurative: boolean }
  | { readonly kind: 'token'; readonly ticket: string; readonly stage: Stage; readonly text: string }
  | { readonly kind: 'staged'; readonly ticket: string; readonly stage: Stage; readonly text: string }
  | { readonly kind: 'settled'; readonly ticket: string; readonly elapsedMs: number }
  | { readonly kind: 'failed'; readonly ticket: string | null; readonly message: string };
