import styles from './Wordmark.module.scss';

export const Wordmark = () => (
  <h1 className={styles.wordmark}>
    <span className={styles.name}>idiot</span>
    <span className={styles.gloss}>
      <span className={styles.phonetic}>/ˈɪd.i.ət/</span>
      <span className={styles.expansion}>idiom translator</span>
    </span>
  </h1>
);
