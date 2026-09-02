import styles from './Wordmark.module.scss';

const QUOTE = 'a4.2 4.2 0 1 1 8.4 0 q0 5.4 -6.2 8.4 l-1.9 -3.1 q3.1 -1.6 3.6 -3.7 a4.2 4.2 0 0 1 -3.9 -1.6 z';

const Mark = () => (
  <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="idiot-tile" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0a84ff" />
        <stop offset="1" stopColor="#64d2ff" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="7.4" fill="url(#idiot-tile)" />
    <path d={`M7.1 13.4 ${QUOTE}`} fill="#fff" />
    <path d={`M16.6 13.4 ${QUOTE}`} fill="#fff" opacity="0.55" />
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
