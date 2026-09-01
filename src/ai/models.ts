export type ModelId = 'small' | 'balanced' | 'sharp';

export type ModelSpec = {
  readonly id: ModelId;
  readonly repo: string;
  readonly name: string;
  readonly params: string;
  readonly note: string;
  readonly megabytes: { readonly webgpu: number; readonly wasm: number };
};

export const MODELS: readonly ModelSpec[] = [
  {
    id: 'small',
    repo: 'HuggingFaceTB/SmolLM2-360M-Instruct',
    name: 'SmolLM2',
    params: '360M',
    note: 'Guesses more than it knows. Only if the download has to be tiny.',
    megabytes: { webgpu: 260, wasm: 370 },
  },
  {
    id: 'balanced',
    repo: 'onnx-community/gemma-3-1b-it-ONNX',
    name: 'Gemma 3',
    params: '1B',
    note: 'Two thirds the download, and it shows — expect some wrong readings.',
    megabytes: { webgpu: 728, wasm: 819 },
  },
  {
    id: 'sharp',
    repo: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
    name: 'SmolLM2',
    params: '1.7B',
    note: 'Clearly the best of the three. Worth the download on a GPU.',
    megabytes: { webgpu: 1057, wasm: 1347 },
  },
] as const;

export const modelById = (id: ModelId): ModelSpec =>
  MODELS.find((model) => model.id === id) ?? MODELS[2];

export const defaultFor = (backend: 'webgpu' | 'wasm' | null): ModelId =>
  backend === 'wasm' ? 'small' : 'sharp';
