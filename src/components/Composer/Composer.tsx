import type { KeyboardEvent } from 'react';
import styles from './Composer.module.scss';

type Props = {
  readonly value: string;
  readonly busy: boolean;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onStop: () => void;
};

const ArrowUp = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 13V3.5m0 0L3.75 7.75M8 3.5l4.25 4.25"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Square = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" fill="currentColor" />
  </svg>
);

export const Composer = ({ value, busy, onChange, onSubmit, onStop }: Props) => {
  const ready = value.trim().length > 0 && !busy;

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) =>
    event.key === 'Enter' && !event.shiftKey && ready
      ? (event.preventDefault(), onSubmit())
      : undefined;

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => (event.preventDefault(), ready ? onSubmit() : undefined)}
    >
      <div className={styles.field}>
        <div className={styles.row}>
          <div className={styles.grow} data-shadow={value}>
            <textarea
              className={styles.input}
              rows={1}
              value={value}
              spellCheck={false}
              placeholder="Blood is thicker than water"
              aria-label="Phrase to translate"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          {busy ? (
            <button type="button" className={styles.stop} onClick={onStop} aria-label="Stop">
              <Square />
            </button>
          ) : (
            <button type="submit" className={styles.send} disabled={!ready} aria-label="Translate">
              <ArrowUp />
            </button>
          )}
        </div>
      </div>
      <p className={styles.hint}>
        <kbd>Return</kbd> to translate · <kbd>Shift</kbd> <kbd>Return</kbd> for a new line
      </p>
    </form>
  );
};
