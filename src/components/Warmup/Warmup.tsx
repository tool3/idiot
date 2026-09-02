import { MODELS, formatSize, type ModelId, type ModelSpec } from '@/ai/models';
import type { Backend } from '@/ai/protocol';
import type { Status } from '@/ai/translator';
import styles from './Warmup.module.scss';

type Props = {
  readonly status: Status;
  readonly backend: Backend | null;
  readonly vram: number;
  readonly model: ModelId;
  readonly customRepo: string;
  readonly onChoose: (model: ModelId) => void;
  readonly onCustomRepo: (repo: string) => void;
  readonly onStart: () => void;
};

const tooBig = (spec: ModelSpec, backend: Backend | null, vram: number) =>
  backend === 'webgpu' && vram > 0 && spec.megabytes.webgpu > vram;

const isDownloading = (status: Status) => status.phase === 'fetching' && status.percent < 99.5;

const stageLabel = (status: Status) =>
  status.phase === 'compiling'
    ? 'Warming the model up'
    : isDownloading(status)
      ? 'Downloading weights'
      : 'Compiling for your GPU';

const percentOf = (status: Status) => (status.phase === 'fetching' ? status.percent : 100);

export const Warmup = ({
  status,
  backend,
  vram,
  model,
  customRepo,
  onChoose,
  onCustomRepo,
  onStart,
}: Props) => {
  const busy = status.phase !== 'cold' && status.phase !== 'broken';
  const percent = percentOf(status);
  const downloading = isDownloading(status);

  return (
    <section className={styles.warmup}>
      <h2 className={styles.pitch}>A language model, running on your machine.</h2>
      <p className={styles.sub}>
        It downloads once, stays in your browser cache, and answers with the tab offline. Nothing
        you type is sent anywhere.
      </p>

      <h3 className={styles.legend}>Pick a brain</h3>
      <fieldset className={styles.picker} disabled={busy}>
        <legend className={styles.hidden}>Pick a brain</legend>
        {MODELS.map((spec) => (
          <label key={spec.id} className={styles.option} data-active={spec.id === model}>
            <input
              type="radio"
              name="model"
              value={spec.id}
              checked={spec.id === model}
              onChange={() => onChoose(spec.id)}
            />
            <span className={styles.tick} aria-hidden="true">
              <svg viewBox="0 0 10 10" fill="none">
                <path
                  d="M1.5 5.25 3.9 7.5 8.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={styles.optionName}>
              {spec.name} <span className={styles.params}>{spec.params}</span>
            </span>
            <span className={styles.optionNote}>
              {spec.note}
              {tooBig(spec, backend, vram) && (
                <span className={styles.caution}>
                  {' '}
                  Larger than the {formatSize(vram)} this GPU reports — it may fail to allocate.
                </span>
              )}
            </span>
            <span className={styles.optionSize}>
              {formatSize(spec.megabytes[backend ?? 'webgpu'])}
            </span>
          </label>
        ))}
        <label className={styles.option} data-active={model === 'custom'}>
          <input
            type="radio"
            name="model"
            value="custom"
            checked={model === 'custom'}
            onChange={() => onChoose('custom')}
          />
          <span className={styles.tick} aria-hidden="true">
            <svg viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5.25 3.9 7.5 8.5 2.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.optionName}>Any model on Hugging Face</span>
          <span className={styles.optionNote}>
            Paste a repo with an ONNX build. The download size and precision are read from the repo.
          </span>
        </label>
      </fieldset>

      {model === 'custom' && (
        <input
          className={styles.repo}
          type="text"
          value={customRepo}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="onnx-community/Llama-3.2-1B-Instruct-ONNX"
          aria-label="Hugging Face repo id"
          disabled={busy}
          onChange={(event) => onCustomRepo(event.target.value)}
        />
      )}

      {status.phase === 'broken' && <p className={styles.broken}>{status.message}</p>}

      {busy ? (
        <div className={styles.loading}>
          <div className={styles.readout}>
            {downloading ? (
              <>
                <span className={styles.percent}>{Math.round(percent)}</span>
                <span className={styles.percentMark}>%</span>
              </>
            ) : (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            <span className={styles.stage}>{stageLabel(status)}</span>
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuenow={downloading ? Math.round(percent) : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={stageLabel(status)}
          >
            <div
              className={styles.fill}
              data-indeterminate={!downloading}
              style={downloading ? { transform: `scaleX(${percent / 100})` } : undefined}
            />
          </div>
          {downloading && status.phase === 'fetching' && status.total > 0 && (
            <p className={styles.transferred}>
              {formatSize(Math.round(status.loaded / 1048576))} of{' '}
              {formatSize(Math.round(status.total / 1048576))}
            </p>
          )}
          {!downloading && (
            <p className={styles.transferred}>
              This takes a moment on a first run and is not repeated.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          className={styles.start}
          disabled={model === 'custom' && customRepo.trim().length === 0}
          onClick={onStart}
        >
          Download and start
        </button>
      )}

      <p className={styles.backend}>
        {backend === 'wasm'
          ? 'No WebGPU in this browser, so everything runs on the CPU. The small model is picked for you — the larger ones will crawl.'
          : `Running on WebGPU, which reports ${formatSize(vram)} of usable buffer. Answers land in about a second once the weights are in.`}
      </p>
    </section>
  );
};
