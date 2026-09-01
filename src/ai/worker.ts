import {
  AutoModelForCausalLM,
  AutoTokenizer,
  InterruptableStoppingCriteria,
  TextStreamer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  type ProgressInfo,
} from '@huggingface/transformers';
import { modelById, type ModelId } from './models';
import {
  acceptableRepair,
  buildMessages,
  echoesPhrase,
  isFigurative,
  mentionsPhrase,
  recipeFor,
  tidy,
  type Stage,
} from './prompt';
import type { Backend, WorkerRequest, WorkerResponse } from './protocol';

type Engine = {
  readonly tokenizer: PreTrainedTokenizer;
  readonly model: PreTrainedModel;
  readonly stopper: InterruptableStoppingCriteria;
};

const CANARY = 'it costs an arm and a leg';
const FIGURATIVE_READINGS: readonly Stage[] = ['meaning', 'literal', 'example'];
const PLAIN_READINGS: readonly Stage[] = ['meaning'];

const engines = new Map<ModelId, Promise<Engine>>();
const active = new Map<'engine', Engine>();

const post = self.postMessage.bind(self) as (message: WorkerResponse) => void;

const reply = (message: WorkerResponse) => post(message);

const detectBackend = async (): Promise<Backend> =>
  'gpu' in navigator && (await navigator.gpu.requestAdapter().catch(() => null)) ? 'webgpu' : 'wasm';

const relayProgress = (info: ProgressInfo) =>
  info.status === 'progress_total'
    ? reply({ kind: 'fetching', percent: info.progress, loaded: info.loaded, total: info.total })
    : undefined;

const run = async (
  engine: Engine,
  stage: Stage,
  phrase: string,
  onToken: (text: string) => void,
): Promise<string> => {
  const recipe = recipeFor(stage);
  const inputs = engine.tokenizer.apply_chat_template([...buildMessages(stage, phrase)], {
    add_generation_prompt: true,
    return_dict: true,
  });

  const output = await engine.model.generate({
    ...inputs,
    max_new_tokens: recipe.maxTokens,
    ...(recipe.temperature > 0
      ? { do_sample: true, temperature: recipe.temperature, top_p: 0.9 }
      : { do_sample: false }),
    repetition_penalty: 1.05,
    stopping_criteria: engine.stopper,
    streamer: new TextStreamer(engine.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: onToken,
    }),
  });

  const width = Number(inputs.input_ids.dims.at(-1));
  const [text] = engine.tokenizer.batch_decode(
    (output as { tolist: () => number[][] }).tolist().map((row) => row.slice(width)),
    { skip_special_tokens: true },
  );
  return tidy(stage, text);
};

const isGarbled = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.replace(/[^a-z]/gi, '').length < 4 || new Set(trimmed.replace(/\s/g, '')).size <= 2;
};

const createEngine = async (id: ModelId): Promise<Engine> => {
  const backend = await detectBackend();
  reply({ kind: 'backend', backend });

  const spec = modelById(id);
  const [tokenizer, model] = await Promise.all([
    AutoTokenizer.from_pretrained(spec.repo, { progress_callback: relayProgress }),
    AutoModelForCausalLM.from_pretrained(spec.repo, {
      dtype: backend === 'webgpu' ? 'q4f16' : 'q4',
      device: backend,
      progress_callback: relayProgress,
    }),
  ]);

  reply({ kind: 'compiling' });
  const engine = { tokenizer, model, stopper: new InterruptableStoppingCriteria() };

  if (isGarbled(await run(engine, 'meaning', CANARY, () => {}))) {
    await model.dispose();
    throw new Error(
      `${spec.name} ${spec.params} came back garbled on this device, which happens when a model's ` +
        'half-precision build misbehaves on the GPU. Pick a different model.',
    );
  }
  return engine;
};

const load = async (id: ModelId) => {
  const pending = engines.get(id) ?? createEngine(id);
  engines.set(id, pending);
  const engine = await pending.catch((error: unknown) => {
    engines.delete(id);
    throw error;
  });
  active.set('engine', engine);
  reply({ kind: 'ready' });
};

const settle = async (
  engine: Engine,
  stage: Stage,
  subject: string,
  first: string,
  emit: (chunk: string) => void,
): Promise<string> => {
  if (stage === 'example')
    return mentionsPhrase(subject, first)
      ? first
      : run(engine, stage, subject, emit).then((retry) =>
          mentionsPhrase(subject, retry) ? retry : '',
        );

  if (stage === 'meaning' && echoesPhrase(subject, first))
    return run(engine, stage, subject, emit).then((retry) =>
      echoesPhrase(subject, retry) ? first : retry,
    );

  return first;
};

const sameWords = (a: string, b: string) =>
  a.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim() ===
  b.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const translate = async (ticket: string, phrase: string) => {
  const engine = active.get('engine');
  if (!engine) throw new Error('The model has not finished loading.');

  engine.stopper.reset();
  const started = performance.now();

  const repaired = await run(engine, 'repair', phrase, () => {});
  const subject =
    acceptableRepair(phrase, repaired) && !sameWords(repaired, phrase) ? repaired : phrase;
  if (subject !== phrase) reply({ kind: 'repaired', ticket, phrase: subject });

  const figurative = isFigurative(await run(engine, 'verdict', subject, () => {}));
  reply({ kind: 'verdict', ticket, figurative });

  const readings = figurative ? FIGURATIVE_READINGS : PLAIN_READINGS;

  await readings.reduce(
    (chain, stage) =>
      chain.then(async () => {
        if (engine.stopper.interrupted) return;
        const emit = (chunk: string) => reply({ kind: 'token', ticket, stage, text: chunk });
        const first = await run(engine, stage, subject, emit);
        const text = await settle(engine, stage, subject, first, emit);
        reply({ kind: 'staged', ticket, stage, text });
      }),
    Promise.resolve(),
  );

  reply({ kind: 'settled', ticket, elapsedMs: performance.now() - started });
};

const handle = async (request: WorkerRequest): Promise<unknown> => {
  if (request.kind === 'probe') return reply({ kind: 'backend', backend: await detectBackend() });
  if (request.kind === 'load') return load(request.model);
  if (request.kind === 'translate') return translate(request.ticket, request.phrase);
  return active.get('engine')?.stopper.interrupt();
};

self.addEventListener('message', ({ data }: MessageEvent<WorkerRequest>) =>
  handle(data).catch((error: unknown) =>
    reply({
      kind: 'failed',
      ticket: data.kind === 'translate' ? data.ticket : null,
      message: error instanceof Error ? error.message : String(error),
    }),
  ),
);
