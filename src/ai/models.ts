import type { Backend } from './protocol';

export type ModelId = 'small' | 'balanced' | 'sharp' | 'sharpest' | 'custom';

export type Dtype = 'q4f16' | 'q4' | 'q8' | 'int8' | 'fp16' | 'fp32';

const SUFFIX: Record<Dtype, string> = {
  q4f16: '_q4f16',
  q4: '_q4',
  q8: '_quantized',
  int8: '_int8',
  fp16: '_fp16',
  fp32: '',
};

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
    note: 'The balanced pick. Fast, and right on all but the rare ones.',
    megabytes: { webgpu: 1057, wasm: 1347 },
  },
  {
    id: 'sharpest',
    repo: 'onnx-community/Llama-3.2-3B-Instruct-ONNX',
    name: 'Llama 3.2',
    params: '3B',
    note: 'The only one that gets the rare ones right. Big, and about 3× slower.',
    megabytes: { webgpu: 2296, wasm: 2296 },
  },
] as const;

export const modelById = (id: ModelId): ModelSpec =>
  MODELS.find((model) => model.id === id) ?? MODELS[2];

export const defaultFor = (backend: Backend | null): ModelId =>
  backend === 'wasm' ? 'small' : 'sharp';

export type Build = {
  readonly repo: string;
  readonly dtype: Dtype;
  readonly megabytes: number;
};

const ORDER: Record<Backend, readonly Dtype[]> = {
  webgpu: ['q4f16', 'q4', 'fp16', 'q8', 'int8', 'fp32'],
  wasm: ['q4', 'q8', 'int8', 'q4f16', 'fp32', 'fp16'],
};

type Sibling = { readonly rfilename: string; readonly size?: number };

const weightsFor = (files: readonly Sibling[], dtype: Dtype): readonly Sibling[] =>
  files.filter((file) => {
    const base = file.rfilename.split('/').pop() ?? '';
    return base === `model${SUFFIX[dtype]}.onnx` || base === `model${SUFFIX[dtype]}.onnx_data`;
  });

export const curatedBuild = (id: ModelId, backend: Backend): Build => {
  const spec = modelById(id);
  return {
    repo: spec.repo,
    dtype: backend === 'webgpu' ? 'q4f16' : 'q4',
    megabytes: spec.megabytes[backend],
  };
};

export const resolveBuild = async (repo: string, backend: Backend): Promise<Build> => {
  const trimmed = repo.trim().replace(/^https?:\/\/huggingface\.co\//, '').replace(/\/+$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(trimmed))
    throw new Error(`"${repo}" is not a Hugging Face repo id. Use the owner/name form.`);

  const response = await fetch(`https://huggingface.co/api/models/${trimmed}?blobs=true`).catch(
    () => null,
  );
  if (!response?.ok) throw new Error(`Could not find ${trimmed} on Hugging Face.`);

  const data = (await response.json()) as { readonly siblings?: readonly Sibling[] };
  const files = data.siblings ?? [];

  const found = ORDER[backend]
    .map((dtype) => ({ dtype, weights: weightsFor(files, dtype) }))
    .find((option) => option.weights.length > 0);

  if (!found)
    throw new Error(
      `${trimmed} has no ONNX weights transformers.js can load. Look for a repo with an onnx/ folder.`,
    );

  return {
    repo: trimmed,
    dtype: found.dtype,
    megabytes: Math.round(
      found.weights.reduce((sum, file) => sum + (file.size ?? 0), 0) / 1048576,
    ),
  };
};
