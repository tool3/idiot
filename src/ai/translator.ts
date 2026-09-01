import type { Backend, WorkerResponse } from './protocol';
import type { Stage } from './prompt';
import { defaultFor, type ModelId } from './models';

export type Status =
  | { readonly phase: 'cold' }
  | { readonly phase: 'fetching'; readonly percent: number; readonly loaded: number; readonly total: number }
  | { readonly phase: 'compiling' }
  | { readonly phase: 'ready' }
  | { readonly phase: 'broken'; readonly message: string };

export type Reading = { readonly draft: string; readonly text: string | null };

export type Entry = {
  readonly ticket: string;
  readonly typed: string;
  readonly phrase: string;
  readonly figurative: boolean;
  readonly meaning: Reading;
  readonly literal: Reading;
  readonly example: Reading;
  readonly elapsedMs: number | null;
  readonly error: string | null;
};

export type State = {
  readonly status: Status;
  readonly backend: Backend | null;
  readonly vram: number;
  readonly model: ModelId;
  readonly customRepo: string;
  readonly chosen: boolean;
  readonly entries: readonly Entry[];
  readonly pending: string | null;
};

export type Action =
  | WorkerResponse
  | { readonly kind: 'ask'; readonly ticket: string; readonly phrase: string }
  | { readonly kind: 'switch'; readonly model: ModelId }
  | { readonly kind: 'custom-repo'; readonly repo: string }
  | { readonly kind: 'clear' };

const BLANK: Reading = { draft: '', text: null };

export const initialState: State = {
  status: { phase: 'cold' },
  backend: null,
  vram: 0,
  model: defaultFor(null),
  customRepo: '',
  chosen: false,
  entries: [],
  pending: null,
};

const READING_KEYS: Record<Stage, keyof Entry | null> = {
  repair: null,
  verdict: null,
  meaning: 'meaning',
  literal: 'literal',
  example: 'example',
};

const amend = (
  entries: readonly Entry[],
  ticket: string,
  change: (entry: Entry) => Partial<Entry>,
): readonly Entry[] =>
  entries.map((entry) => (entry.ticket === ticket ? { ...entry, ...change(entry) } : entry));

const settleRemaining = (entry: Entry): Partial<Entry> => ({
  meaning: entry.meaning.text === null ? { ...entry.meaning, text: entry.meaning.draft } : entry.meaning,
  literal: entry.literal.text === null ? { ...entry.literal, text: '' } : entry.literal,
  example: entry.example.text === null ? { ...entry.example, text: '' } : entry.example,
});

export const reduce = (state: State, action: Action): State => {
  switch (action.kind) {
    case 'backend':
      return {
        ...state,
        backend: action.backend,
        vram: action.vram,
        model: state.chosen ? state.model : defaultFor(action.backend),
      };
    case 'fetching':
      return {
        ...state,
        status: { phase: 'fetching', percent: action.percent, loaded: action.loaded, total: action.total },
      };
    case 'compiling':
      return { ...state, status: { phase: 'compiling' } };
    case 'ready':
      return { ...state, status: { phase: 'ready' } };
    case 'switch':
      return { ...state, model: action.model, chosen: true, status: { phase: 'cold' }, pending: null };
    case 'custom-repo':
      return { ...state, customRepo: action.repo };
    case 'clear':
      return { ...state, entries: [], pending: null };
    case 'ask':
      return {
        ...state,
        pending: action.ticket,
        entries: [
          ...state.entries,
          {
            ticket: action.ticket,
            typed: action.phrase,
            phrase: action.phrase,
            figurative: true,
            meaning: BLANK,
            literal: BLANK,
            example: BLANK,
            elapsedMs: null,
            error: null,
          },
        ],
      };
    case 'repaired':
      return { ...state, entries: amend(state.entries, action.ticket, () => ({ phrase: action.phrase })) };
    case 'verdict':
      return {
        ...state,
        entries: amend(state.entries, action.ticket, () => ({ figurative: action.figurative })),
      };
    case 'token': {
      const key = READING_KEYS[action.stage];
      return key === null
        ? state
        : {
            ...state,
            entries: amend(state.entries, action.ticket, (entry) => ({
              [key]: { ...(entry[key] as Reading), draft: (entry[key] as Reading).draft + action.text },
            })),
          };
    }
    case 'staged': {
      const key = READING_KEYS[action.stage];
      return key === null
        ? state
        : {
            ...state,
            entries: amend(state.entries, action.ticket, (entry) => ({
              [key]: { ...(entry[key] as Reading), text: action.text },
            })),
          };
    }
    case 'settled':
      return {
        ...state,
        pending: null,
        entries: amend(state.entries, action.ticket, (entry) => ({
          ...settleRemaining(entry),
          elapsedMs: action.elapsedMs,
        })),
      };
    case 'failed':
      return action.ticket === null
        ? { ...state, pending: null, status: { phase: 'broken', message: action.message } }
        : {
            ...state,
            pending: null,
            entries: amend(state.entries, action.ticket, (entry) => ({
              ...settleRemaining(entry),
              error: action.message,
            })),
          };
  }
};
