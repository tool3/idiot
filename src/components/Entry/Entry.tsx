import { tidyLive } from '@/ai/prompt';
import type { Entry as EntryData, Reading } from '@/ai/translator';
import styles from './Entry.module.scss';

type Props = { readonly entry: EntryData; readonly modelLabel: string };

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

const shown = (reading: Reading, live: string) => reading.text ?? live;

export const Entry = ({ entry, modelLabel }: Props) => {
  const meaning = shown(entry.meaning, tidyLive('meaning', entry.meaning.draft));
  const literal = shown(entry.literal, tidyLive('literal', entry.literal.draft));
  const example = shown(entry.example, tidyLive('example', entry.example.draft));
  const working = entry.elapsedMs === null && entry.error === null;
  const streaming = (reading: Reading) => working && reading.text === null && reading.draft.length > 0;

  return (
    <article className={styles.entry}>
      <p className={styles.phrase}>{entry.phrase}</p>

      {entry.phrase !== entry.typed && (
        <p className={styles.repair}>
          Corrected from <span className={styles.typed}>{entry.typed}</span>
        </p>
      )}

      <div className={styles.card}>
        {entry.error ? (
          <p className={styles.broken}>{entry.error}</p>
        ) : (
          <>
            {!entry.figurative && (
              <p className={styles.plain}>
                This reads as a plain sentence, not a figure of speech. Here it is in other words.
              </p>
            )}

            <section className={styles.reading} data-tone="primary">
              <h3 className={styles.label}>{entry.figurative ? 'Means' : 'In other words'}</h3>
              <p className={styles.text} aria-live="polite" aria-busy={working}>
                {meaning}
                {streaming(entry.meaning) && <span className={styles.caret} aria-hidden="true" />}
              </p>
            </section>

            {entry.figurative && literal.length > 0 && (
              <section className={styles.reading} data-tone="muted">
                <h3 className={styles.label}>Taken literally</h3>
                <p className={styles.text}>
                  {literal}
                  {streaming(entry.literal) && <span className={styles.caret} aria-hidden="true" />}
                </p>
              </section>
            )}

            {entry.figurative && example.length > 0 && (
              <section className={styles.reading} data-tone="muted">
                <h3 className={styles.label}>In a sentence</h3>
                <p className={styles.text}>
                  {example}
                  {streaming(entry.example) && <span className={styles.caret} aria-hidden="true" />}
                </p>
              </section>
            )}
          </>
        )}

      </div>

      {entry.elapsedMs !== null && (
        <p className={styles.meta}>
          {seconds(entry.elapsedMs)} · {modelLabel}
        </p>
      )}
    </article>
  );
};
