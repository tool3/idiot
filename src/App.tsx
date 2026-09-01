import { useState } from 'react';
import { modelById } from '@/ai/models';
import { useTranslator } from '@/ai/useTranslator';
import { Composer } from '@/components/Composer/Composer';
import { Entry } from '@/components/Entry/Entry';
import { Seeds } from '@/components/Seeds/Seeds';
import { ThemeSwitch } from '@/components/ThemeSwitch/ThemeSwitch';
import { Warmup } from '@/components/Warmup/Warmup';
import { Wordmark } from '@/components/Wordmark/Wordmark';
import { useStickToBottom } from '@/hooks/useStickToBottom';
import { useTheme } from '@/theme/useTheme';
import styles from './App.module.scss';

export const App = () => {
  const translator = useTranslator();
  const [theme, chooseTheme] = useTheme();
  const [draft, setDraft] = useState('');
  const { scroller, pin, scrolled } = useStickToBottom();

  const { entries, status, backend, model, busy, ask, choose, clear } = translator;
  const spec = modelById(model);
  const chipLabel = model === 'custom' ? translator.customRepo.split('/').pop() : `${spec.name} ${spec.params}`;
  const live = status.phase === 'ready';

  const submit = (phrase: string) => {
    ask(phrase);
    setDraft('');
    pin();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Wordmark />
        <div className={styles.controls}>
          <ThemeSwitch theme={theme} onChoose={chooseTheme} />
          {live && entries.length > 0 && (
            <button type="button" className={styles.clear} onClick={clear}>
              Clear
            </button>
          )}
          {live && (
            <button type="button" className={styles.chip} onClick={() => choose(model)}>
              {chipLabel}
              <span className={styles.backend}>{backend}</span>
            </button>
          )}
        </div>
      </header>

      <div className={styles.rule} data-visible={scrolled} />

      <div className={styles.scroller} ref={scroller}>
        <div className={styles.column}>
          {live ? (
            entries.length === 0 ? (
              <Seeds onPick={submit} />
            ) : (
              <div className={styles.transcript}>
                {entries.map((entry) => (
                  <Entry key={entry.ticket} entry={entry} modelLabel={chipLabel ?? ''} />
                ))}
              </div>
            )
          ) : (
            <Warmup
              status={status}
              backend={backend}
              vram={translator.vram}
              model={model}
              customRepo={translator.customRepo}
              onChoose={choose}
              onCustomRepo={translator.setCustomRepo}
              onStart={translator.summon}
            />
          )}
        </div>
      </div>

      {live && (
        <div className={styles.dock}>
          <div className={styles.column}>
            <Composer
              value={draft}
              busy={busy}
              onChange={setDraft}
              onSubmit={() => submit(draft)}
              onStop={translator.interrupt}
            />
          </div>
        </div>
      )}
    </div>
  );
};
