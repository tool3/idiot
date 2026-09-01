export type Stage = 'repair' | 'verdict' | 'meaning' | 'literal' | 'example';

type Message = { readonly role: 'system' | 'user' | 'assistant'; readonly content: string };

type Recipe = {
  readonly system: string;
  readonly shots: readonly (readonly [string, string])[];
  readonly maxTokens: number;
  readonly temperature: number;
};

const RECIPES: Record<Stage, Recipe> = {
  repair: {
    system: [
      'You fix typing mistakes in English phrases.',
      'Reply with the corrected phrase and nothing else.',
      'Only repair misspelled words. Return exactly the same number of words, in the same order.',
      'Never swap a word for a different word, never add or remove words, and never replace the phrase',
      'with a different phrase — however strange the phrase looks, it is the one the user meant.',
      'If every word is already spelled correctly, repeat it back unchanged.',
    ].join(' '),
    shots: [
      ['blood is thicket than water', 'blood is thicker than water'],
      ['beating arround the bush', 'beating around the bush'],
      ['she threw me under the bus', 'she threw me under the bus'],
      ['the erly bird catchs the worm', 'the early bird catches the worm'],
      ['i went to the shop yesterday', 'i went to the shop yesterday'],
      ['brake a leg', 'break a leg'],
      ['well slap my ass and call me sally', 'well slap my ass and call me sally'],
      ['best thing since bread came sliced', 'best thing since bread came sliced'],
    ],
    maxTokens: 32,
    temperature: 0,
  },

  verdict: {
    system: [
      'You decide whether a phrase is a figure of speech — an idiom, proverb, saying or exclamation',
      'whose meaning is different from its literal words.',
      'Answer with one word: "figurative" or "plain".',
      'Assume figurative by default. Odd, vivid, violent or absurd phrases are almost always figurative.',
      'Only answer "plain" for a flat, ordinary statement of fact that means exactly what it says.',
    ].join(' '),
    shots: [
      ['blood is thicker than water', 'figurative'],
      ['i went to the shop yesterday', 'plain'],
      ['she threw me under the bus', 'figurative'],
      ['the meeting starts at four o’clock', 'plain'],
      ['once in a blue moon', 'figurative'],
      ['my sister has two dogs', 'plain'],
      ['he is sitting on the fence', 'figurative'],
      ['please close the window', 'plain'],
      ['well slap my ass and call me sally', 'figurative'],
      ['break a leg', 'figurative'],
      ['the best thing since sliced bread', 'figurative'],
      ['i paid the electricity bill', 'plain'],
    ],
    maxTokens: 6,
    temperature: 0,
  },

  meaning: {
    system: [
      'You are a plain-English glossary of English idioms.',
      'The user names a figure of speech. You state the meaning people actually intend by it.',
      'Never describe the literal picture in the words.',
      'A phrase about cats, buses or candles is not about cats, buses or candles.',
      'Many of these are set expressions whose meaning has nothing to do with the words in them.',
      'Some are wishes, greetings, insults or exclamations rather than descriptions — in those cases say',
      'what the speaker is doing, such as wishing someone luck or reacting with surprise.',
      'Answer with one or two short sentences of ordinary words.',
      'Never repeat the phrase back, never give examples, never explain your reasoning.',
      'If the phrase is unfamiliar, still give the most likely figurative meaning.',
    ].join(' '),
    shots: [
      ['a storm in a teacup', 'A lot of fuss about something that hardly matters.'],
      ['he let the cat out of the bag', 'He gave away a secret he was supposed to keep.'],
      ['it costs an arm and a leg', 'It is far more expensive than it ought to be.'],
      ['they were caught red handed', 'They were caught in the act, with no way to deny it.'],
      ['he is sitting on the fence', 'He is refusing to take a side, usually to avoid the consequences of picking one.'],
      ['don’t count your chickens before they hatch', 'Do not rely on something good until it has actually happened.'],
      ['that job is right up her street', 'The job suits her skills and interests perfectly.'],
      ['we are all on the same page', 'Everyone involved understands the situation the same way.'],
      ['break a leg', 'Good luck — said to someone just before they perform.'],
      ['the best thing since sliced bread', 'Something wonderful, treated as a huge improvement on whatever came before.'],
      ['well I never', 'The speaker is expressing surprise, not saying anything about themselves.'],
    ],
    maxTokens: 80,
    temperature: 0.5,
  },

  literal: {
    system: [
      'You describe the picture a phrase paints if you take every word at face value.',
      'One short, deadpan sentence describing the physical scene or fact.',
      'Never give the figurative meaning. Never say what it really means.',
    ].join(' '),
    shots: [
      ['it costs an arm and a leg', 'The asking price is two of your limbs.'],
      ['she threw me under the bus', 'A woman physically hurled someone beneath a moving bus.'],
      ['burning the candle at both ends', 'A candle is alight at the top and the bottom at the same time.'],
      ['blood is thicker than water', 'Blood is the denser of the two liquids.'],
      ['he let the cat out of the bag', 'A cat that was shut in a bag has been released.'],
      ['he cut the mustard', 'A man took a knife to a jar of mustard.'],
      ['once in a blue moon', 'The moon turns blue, and this happens a single time.'],
      ['beating around the bush', 'Someone is whacking the ground around a shrub with a stick.'],
      ['break a leg', 'May a bone in your leg snap.'],
      ['the early bird catches the worm', 'A bird that wakes up early gets to eat a worm.'],
    ],
    maxTokens: 48,
    temperature: 0.25,
  },

  example: {
    system: [
      'You write one natural sentence that uses the given phrase, the way a person would in conversation.',
      'The sentence must contain the phrase word for word, exactly as the user typed it.',
      'Never explain the phrase and never swap it for a paraphrase. Reply with the sentence only.',
    ].join(' '),
    shots: [
      ['it costs an arm and a leg', 'We wanted the flat on the corner, but it costs an arm and a leg.'],
      ['she threw me under the bus', 'The deadline slipped and she threw me under the bus in front of the whole team.'],
      ['once in a blue moon', 'He only calls once in a blue moon, so I was surprised to see his name.'],
      ['beating around the bush', 'Stop beating around the bush and tell me what the repair will cost.'],
      ['blood is thicker than water', 'He hired his nephew over three better candidates, because blood is thicker than water.'],
      ['the pot calling the kettle black', 'You calling me disorganised is the pot calling the kettle black.'],
      ['he cut the mustard', 'They gave him a month to prove he cut the mustard.'],
    ],
    maxTokens: 56,
    temperature: 0.6,
  },
};

export const recipeFor = (stage: Stage): Recipe => RECIPES[stage];

export const buildMessages = (stage: Stage, phrase: string): readonly Message[] => {
  const recipe = RECIPES[stage];
  return [
    { role: 'system', content: recipe.system },
    ...recipe.shots.flatMap(([question, answer]) => [
      { role: 'user' as const, content: question },
      { role: 'assistant' as const, content: answer },
    ]),
    { role: 'user', content: phrase.trim() },
  ];
};

const PREAMBLE =
  /^(sure[,!.]?\s*)?(the (phrase|idiom|saying|expression)\s+.{0,60}?\s+)?(it |this )?(literally |basically |simply |essentially )?(means|refers to|is used to say|translates to)\b[:,]?\s*/i;

const LABEL = /^(meaning|answer|translation|plain english|explanation|literal|example)\s*[:\-–]\s*/i;

const unwrapQuotes = (text: string): string =>
  /^["'“‘](.*)["'”’]$/s.test(text) ? text.replace(/^["'“‘](.*)["'”’]$/s, '$1') : text;

const firstBlock = (text: string): string => text.split(/\n\s*\n/)[0].split('\n')[0];

const capSentences = (text: string, limit: number): string => {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  return parts ? parts.slice(0, limit).join('').trim() : text;
};

const sentenceCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const terminate = (text: string): string =>
  text.length > 0 && !/[.!?]$/.test(text) ? `${text}.` : text;

const strip = (raw: string): string =>
  unwrapQuotes(firstBlock(raw.trim())).replace(LABEL, '').replace(PREAMBLE, '').trim();

export const tidy = (stage: Stage, raw: string): string =>
  stage === 'repair'
    ? unwrapQuotes(firstBlock(raw.trim())).replace(/[.]$/, '').trim()
    : terminate(sentenceCase(unwrapQuotes(capSentences(strip(raw), 2)).trim()));

export const tidyLive = (stage: Stage, raw: string): string =>
  stage === 'repair' ? strip(raw) : sentenceCase(strip(raw).trimStart());

const contentWords = (phrase: string): readonly string[] =>
  phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);

const overlap = (phrase: string, sentence: string): number => {
  const words = contentWords(phrase);
  if (words.length === 0) return 1;
  const haystack = sentence.toLowerCase();
  return words.filter((word) => haystack.includes(word.slice(0, 4))).length / words.length;
};

export const mentionsPhrase = (phrase: string, sentence: string): boolean =>
  overlap(phrase, sentence) >= 0.7;

export const echoesPhrase = (phrase: string, sentence: string): boolean =>
  overlap(phrase, sentence) >= 0.5;

export const isFigurative = (verdict: string): boolean => !/^\s*plain\b/i.test(verdict);

const distance = (a: string, b: string): number =>
  [...a].reduce(
    (prev, ca) =>
      [...b].reduce(
        (row, cb, j) => [...row, Math.min(row[j] + 1, prev[j + 1] + 1, prev[j] + (ca === cb ? 0 : 1))],
        [prev[0] + 1],
      ),
    Array.from({ length: b.length + 1 }, (_, index) => index),
  )[b.length];

const words = (phrase: string): readonly string[] =>
  phrase.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);

const budgetFor = (word: string) => Math.min(2, Math.max(1, Math.ceil(word.length / 3)));

export const acceptableRepair = (original: string, candidate: string): boolean => {
  const before = words(original);
  const after = words(candidate);
  if (before.length === 0 || before.length !== after.length) return false;

  const gaps = before.map((word, index) => distance(word, after[index]));
  if (gaps.some((gap, index) => gap > budgetFor(before[index]))) return false;

  const letters = before.join('').length;
  return gaps.reduce((sum, gap) => sum + gap, 0) <= Math.max(2, Math.floor(letters * 0.25));
};
