import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { curatedBuild, modelById, resolveBuild, type ModelId } from './models';
import type { WorkerRequest, WorkerResponse } from './protocol';
import { initialState, reduce, type State } from './translator';

const labelFor = (model: ModelId) => {
  const spec = modelById(model);
  return `${spec.name} ${spec.params}`;
};

const spawn = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

export type Translator = State & {
  readonly busy: boolean;
  readonly summon: () => void;
  readonly setCustomRepo: (repo: string) => void;
  readonly ask: (phrase: string) => void;
  readonly interrupt: () => void;
  readonly choose: (model: ModelId) => void;
  readonly clear: () => void;
};

export const useTranslator = (): Translator => {
  const [state, dispatch] = useReducer(reduce, initialState);
  const worker = useRef<Worker>(null);

  useEffect(() => {
    worker.current ??= spawn();
    const node = worker.current;
    const receive = ({ data }: MessageEvent<WorkerResponse>) => dispatch(data);
    node.addEventListener('message', receive);
    node.postMessage({ kind: 'probe' } satisfies WorkerRequest);
    return () => node.removeEventListener('message', receive);
  }, []);

  const send = useCallback((request: WorkerRequest) => worker.current?.postMessage(request), []);

  const summon = useCallback(() => {
    const backend = state.backend ?? 'webgpu';
    dispatch({ kind: 'fetching', percent: 0, loaded: 0, total: 0 });

    const resolve =
      state.model === 'custom'
        ? resolveBuild(state.customRepo, backend)
        : Promise.resolve(curatedBuild(state.model, backend));

    resolve
      .then((build) =>
        send({
          kind: 'load',
          model: state.model,
          repo: build.repo,
          dtype: build.dtype,
          label: state.model === 'custom' ? build.repo : labelFor(state.model),
        }),
      )
      .catch((error: unknown) =>
        dispatch({
          kind: 'failed',
          ticket: null,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
  }, [send, state.backend, state.customRepo, state.model]);

  const setCustomRepo = useCallback((repo: string) => dispatch({ kind: 'custom-repo', repo }), []);

  const ask = useCallback(
    (phrase: string) => {
      const ticket = crypto.randomUUID();
      dispatch({ kind: 'ask', ticket, phrase });
      send({ kind: 'translate', ticket, phrase });
    },
    [send],
  );

  const interrupt = useCallback(() => send({ kind: 'interrupt' }), [send]);

  const choose = useCallback(
    (model: ModelId) => {
      send({ kind: 'interrupt' });
      dispatch({ kind: 'switch', model });
    },
    [send],
  );

  const clear = useCallback(() => dispatch({ kind: 'clear' }), []);

  return useMemo(
    () => ({
      ...state,
      busy: state.pending !== null,
      summon,
      setCustomRepo,
      ask,
      interrupt,
      choose,
      clear,
    }),
    [state, summon, setCustomRepo, ask, interrupt, choose, clear],
  );
};
