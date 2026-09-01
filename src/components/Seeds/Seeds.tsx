import styles from './Seeds.module.scss';

const SEEDS = [
  'the pot calling the kettle black',
  'she threw me under the bus',
  'burning the candle at both ends',
  'a wild goose chase',
  'he cut the mustard',
] as const;

type Props = { readonly onPick: (phrase: string) => void };

const Chevron = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M4.25 2.5 7.75 6l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Seeds = ({ onPick }: Props) => (
  <section className={styles.seeds}>
    <h2 className={styles.heading}>Say something you don’t mean.</h2>
    <p className={styles.lede}>
      Type any idiom or turn of phrase. You get the plain meaning, the picture the words actually
      paint, and a sentence that uses it properly. Typos are fixed before anything else.
    </p>
    <ul className={styles.list}>
      {SEEDS.map((seed) => (
        <li key={seed}>
          <button type="button" className={styles.seed} onClick={() => onPick(seed)}>
            <span className={styles.text}>{seed}</span>
            <span className={styles.cue}>
              <Chevron />
            </span>
          </button>
        </li>
      ))}
    </ul>
  </section>
);
