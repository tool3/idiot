import { THEMES, type ThemeId } from '@/theme/themes';
import styles from './ThemeSwitch.module.scss';

type Props = { readonly theme: ThemeId; readonly onChoose: (theme: ThemeId) => void };

export const ThemeSwitch = ({ theme, onChoose }: Props) => (
  <div className={styles.switcher} role="radiogroup" aria-label="Colour theme">
    {THEMES.map((option) => (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={option.id === theme}
        className={styles.option}
        data-active={option.id === theme}
        onClick={() => onChoose(option.id)}
      >
        <span className={styles.swatch} style={{ background: option.swatch }} aria-hidden="true" />
        <span className={styles.name}>{option.name}</span>
      </button>
    ))}
  </div>
);
