import { MODELS, modelById, type ModelId } from '@/ai/models';
import type { Backend } from '@/ai/protocol';
import type { Status } from '@/ai/translator';
import styles from './Warmup.module.scss';

type Props = {
  readonly status: Status;
  readonly backend: Backend | null;
  readonly model: ModelId;
  readonly onChoose: (model: ModelId) => void;
  readonly onStart: () => void;
};

const sizeFor = (model: ModelId, backend: Backend | null) =>
  modelById(model).megabytes[backend ?? 'webgpu'];

const percentOf = (status: Status) => (status.phase === 'fetching' ? status.percent : 100);

export const Warmup = ({ status, backend, model, onChoose, onStart }: Props) => {
  const busy = status.phase !== 'cold' && status.phase !== 'broken';
  const percent = percentOf(status);

  return (
    <section className={styles.warmup}>
      <h2 className={styles.pitch}>A language model, running on your machine.</h2>
      <p className={styles.sub}>
        {sizeFor(model, backend)} MB downloads once, stays in your browser cache, and answers with
        the tab offline. Nothing you type is sent anywhere.
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
            <span className={styles.optionNote}>{spec.note}</span>
            <span className={styles.optionSize}>{spec.megabytes[backend ?? 'webgpu']} MB</span>
          </label>
        ))}
      </fieldset>

      {status.phase === 'broken' && <p className={styles.broken}>{status.message}</p>}

      {busy ? (
        <div className={styles.loading}>
          <div className={styles.readout}>
            <span className={styles.percent}>{Math.round(percent)}</span>
            <span className={styles.percentMark}>%</span>
            <span className={styles.stage}>
              {status.phase === 'compiling' ? 'Warming up the graph' : 'Downloading weights'}
            </span>
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Model download"
          >
            <div
              className={styles.fill}
              data-indeterminate={status.phase === 'compiling'}
              style={{ transform: `scaleX(${percent / 100})` }}
            />
          </div>
        </div>
      ) : (
        <button type="button" className={styles.start} onClick={onStart}>
          Download and start
        </button>
      )}

      <p className={styles.backend}>
        {backend === 'wasm'
          ? 'No WebGPU in this browser, so everything runs on the CPU. The small model is picked for you — the larger two will crawl.'
          : 'Running on WebGPU. Answers land in well under a second once the weights are in.'}
      </p>
    </section>
  );
};
