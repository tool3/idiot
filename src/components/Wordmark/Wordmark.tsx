import { QUOTE } from '@/theme/mark';
import styles from './Wordmark.module.scss';

const Mark = () => (
  <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="idiot-tile" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" className={styles.from} />
        <stop offset="1" className={styles.to} />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="7.4" fill="url(#idiot-tile)" />
    <path d={`M7.1 13.4 ${QUOTE}`} className={styles.glyph} />
    <path d={`M16.6 13.4 ${QUOTE}`} className={styles.glyph} opacity="0.55" />
  </svg>
);

export const Wordmark = () => (
  <h1 className={styles.wordmark}>
    <Mark />
    <span className={styles.name}>idiot</span>
    <span className={styles.gloss}>
      <span className={styles.phonetic}>/ˈɪd.i.ət/</span>
      <span className={styles.expansion}>idiom translator</span>
    </span>
  </h1>
);
