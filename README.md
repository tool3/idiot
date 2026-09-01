# idiot

**idi**om translat**or**. Type a phrase, get one flat sentence saying what it actually means.

> blood is thicker than water → Family ties are stronger than ordinary relationships.

No API, no server, no key. A small instruct model is downloaded once, cached by the browser, and
run locally in a Web Worker — on WebGPU where the browser offers it, CPU (WASM) otherwise.

## Stack

TypeScript · Vite · React 19 · SCSS modules · [transformers.js](https://github.com/huggingface/transformers.js) v4

No webfonts. Type is SF Pro via the system stack (`-apple-system`), falling back to Inter and then
`system-ui`, so the interface renders in the platform's own face at zero network cost.

## Themes

Three, switchable in the header and remembered in `localStorage`: **Ink** (true black), **Slate**
(blue-grey) and **Paper** (white). Every colour is a CSS custom property defined once per theme in
`src/styles/global.scss`; no component hard-codes a colour. The starting theme follows
`prefers-color-scheme` until the visitor picks one, and is applied before first paint in
`main.tsx` so there is no flash.

## Staying pinned to the bottom

`src/hooks/useStickToBottom.ts`. The subtlety is that a `scroll` listener must never *un*-pin:
the smooth scroll fired on submit generates scroll events of its own, and reading position from
them mid-animation drops the pin and strands the reader mid-answer. So scroll events can only
ever re-pin on reaching the bottom, and the pin is released solely by real user intent — `wheel`
upward, an upward `touchmove`, or PageUp/Home/ArrowUp. A `ResizeObserver` on the content follows
its growth while pinned. Measured during streaming, the gap to the bottom holds at 0 px.

## Run it

```sh
npm install
npm run dev
```

First load asks which model to fetch, then downloads it. Nothing is fetched until you click.

## Models

| Option | Repo | WebGPU | CPU | Quality |
| --- | --- | --- | --- | --- |
| SmolLM2 1.7B *(default on GPU)* | `HuggingFaceTB/SmolLM2-1.7B-Instruct` | 1057 MB | 1347 MB | 10/10 on the test set |
| Gemma 3 1B | `onnx-community/gemma-3-1b-it-ONNX` | 728 MB | 819 MB | ~7/10, quickest of the useful ones |
| SmolLM2 360M *(default on CPU)* | `HuggingFaceTB/SmolLM2-360M-Instruct` | 260 MB | 370 MB | Mostly guessing |

Two things drove this lineup.

**Sub-billion models read idioms literally.** Qwen2.5 0.5B answers "the pot calling the kettle black"
with *"the kettle is boiling, but the pot is cold."* Eight few-shot pairs and a system prompt that
bans literal readings moved it from 3/10 to 4/10 and no further — prompting cannot inject knowledge
a model does not have. Qwen3 0.6B with thinking disabled was worse still (1/10).

**Not every ONNX build survives WebGPU.** `Qwen2.5-1.5B-Instruct` scores 10/10 on CPU but its
`q4f16` build returns NaN logits on Apple Silicon, so every token decodes to id 0 — a wall of `!`.
Its `q4` build then fails to allocate (1.7 GB over the WebGPU buffer limit). It is excluded for that
reason, not for quality. SmolLM2 1.7B matches it at 10/10, is numerically sound on WebGPU, and
answers in about 0.4 s.

### The garbled-output guard

Because that failure is silent and GPU-specific, `src/ai/worker.ts` generates a canary phrase
immediately after loading and inspects it. If the result has almost no letters or repeats a single
character, the model is disposed and the picker comes back with an explanation, rather than
streaming `!!!!!!!` at you.

## The answer pipeline

One phrase runs through up to five focused generations rather than one general-purpose prompt.
Small models are far more reliable at a narrow task with its own few-shot set than at a broad one.
Each stage lives in `src/ai/prompt.ts` with its own system prompt, shots, token budget and
temperature.

| Stage | Job | Temp |
| --- | --- | --- |
| `repair` | Fix typos only, never reword. `blood is thicket than water` → `blood is thicker than water` | 0 |
| `verdict` | Is this figurative or a plain sentence? | 0 |
| `meaning` | The plain-English meaning | 0.5 |
| `literal` | What the words describe at face value — the gap the app is named after | 0.25 |
| `example` | One natural sentence using the phrase | 0.6 |

`repair` runs first and everything downstream uses the corrected phrase, so a misspelling no longer
poisons the answer. `verdict` catches ordinary sentences — typing *"I went to the shop yesterday"*
gets a paraphrase and a note, not an invented idiom reading.

Four guards sit around the model, because prompting alone does not hold:

- **Repair can only fix typos, never reword.** Told to "only fix spelling", a 1B model will happily
  turn *"well slap my ass and call me sally"* into *"break your leg"* — a different phrase entirely.
  `acceptableRepair` makes that impossible rather than unlikely: the candidate must have the same
  word count, every word within a small Levenshtein budget of the original, and a total edit
  distance under a quarter of the phrase. Anything else is discarded and the phrase runs as typed.
- **The meaning may not just restate the phrase.** *"best thing since bread came sliced"* came back
  as *"The sliced bread is the best."* `echoesPhrase` catches a meaning that reuses half the
  phrase's own words and regenerates it.
- **The example must contain the phrase.** Small models love to paraphrase instead of quoting, so
  `mentionsPhrase` checks for it, retries once, and drops the field rather than showing a sentence
  that never uses the words.
- **A canary runs after loading.** If the output has almost no letters or repeats one character,
  the model is disposed and the picker returns with an explanation. This catches `q4f16` builds
  that return NaN logits on a particular GPU — see below.

Temperatures are deliberately uneven. Repair and classification must be repeatable, so they are
greedy. The meaning is a definition and should stay semantically stable, so it sits low. The
literal reading and the example are where variety belongs, so they run hotter — ask the same phrase
twice and those two visibly change.

Few-shot phrases are deliberately different from the placeholder and the on-screen suggestions —
when they overlapped, the model parroted the example instead of answering. The exception is a
handful of idioms that teach a *category* rather than themselves: `break a leg` teaches that some
idioms are wishes rather than descriptions, which is why the model used to answer "to injure
someone physically".

`verdict` is deliberately biased toward figurative. A false "plain" on a real idiom loses the whole
answer; a false "figurative" on a plain sentence just adds an odd literal reading.

## Known ceiling

Rare, regional or vulgar idioms are past what a 1.7B model knows. *"Well slap my ass and call me
Sally"* still comes back as agreement rather than astonishment, and no prompt fixes that — the
knowledge is not in the weights. The obvious escape hatch is grounding the answer in a real
dictionary: `en.wiktionary.org`'s REST API is CORS-open, needs no key, and has clean entries for
*break a leg*, *blood is thicker than water* and *the best thing since sliced bread*. That would
trade the offline guarantee for correctness on the long tail. Deliberately not wired up.

## Layout

```
src/
  ai/          worker, protocol, reducer, prompt — all the model plumbing
  components/  Wordmark · Warmup · Seeds · Entry · Composer
  styles/      tokens + global reset
```

The worker owns the model and streams tokens back; the main thread holds an immutable reducer
(`src/ai/translator.ts`) and never touches ONNX. The worker probes for WebGPU on startup, so the
picker shows real download sizes for your backend and defaults to a model that is actually usable
on it.
