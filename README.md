<div align="center">

# idiot

**idi**om translat**or** — /ˈɪd.i.ət/

### Type a phrase. Find out what it actually means.

</div>

---

```
blood is thicker than water

  Means            Family ties are stronger than any other relationship.
  Taken literally  Blood is the denser of the two liquids.
  In a sentence    He hired his nephew over three better candidates,
                   because blood is thicker than water.

  1.5s · SmolLM2 1.7B · WebGPU
```

Every idiom is a small conspiracy. The words say one thing, everyone agrees they mean another, and
nobody tells you when the switch happened. **idiot** shows you both halves at once: the plain
meaning, the picture the words literally paint, and a sentence that uses it the way a person would.

It does this with a language model **running inside your browser tab**. No API key. No account. No
server. Nothing you type leaves your machine — you can pull the network cable after the first load
and it keeps working.

## Try it

```sh
git clone <this repo> && cd idiot
npm install
npm run dev
```

Open the page, pick a brain, press **Download and start**. That is the whole setup.

The first load fetches the model — 260 MB to 2.3 GB depending on which one you choose — and caches
it in the browser. Every load after that is instant. On a GPU you get a full answer in about a
second and a half.

## Things worth trying

| Type this | Why |
| --- | --- |
| `blood is thicket than water` | Misspell it. It fixes the typo first, and shows you what it corrected |
| `I went to the shop yesterday` | Not an idiom. It notices, and says so |
| `break a leg` | A wish disguised as a curse. See the literal reading |
| `she threw me under the bus` | Watch it stream in, field by field |
| the same phrase twice | The definition holds steady; the example and the literal reading change |

## Pick your own brain

Four curated models, from a 260 MB one that mostly guesses to a 2.3 GB one that gets *"well slap my
ass and call me Sally"* right. Or paste **any Hugging Face repo with an ONNX build** — the app reads
the available precision and download size straight from the repo.

| Model | Size | Per answer | Gets it right |
| --- | --- | --- | --- |
| Llama 3.2 3B | 2296 MB | ~2.6 s | 12/12 |
| **SmolLM2 1.7B** *(default)* | 1057 MB | ~1.5 s | 10/12 |
| Gemma 3 1B | 728 MB | ~1.4 s | ~7/12 |
| SmolLM2 360M | 260 MB | — | mostly guessing |

## Make it yours

Three themes — **Ink**, **Slate**, **Paper** — and two visual treatments, **Deep** (layered, with an
ambient wash) and **Flat** (plain system surfaces). Both switch instantly in the header and are
remembered.

## Built with

TypeScript · Vite · React 19 · SCSS modules · [transformers.js](https://github.com/huggingface/transformers.js)

No webfonts, no UI library, no analytics, no tracking. The whole app is 68 KB gzipped; the model is
the only large download, and it is yours to keep.

## Under the hood

One phrase runs through five focused generations — repair, classify, meaning, literal, example —
each with its own few-shot set and temperature, wrapped in guards that catch the specific ways small
models fail. That story, including the ONNX build that silently returns `NaN` on Apple GPUs, is in
**[ENGINEERING.md](ENGINEERING.md)**.

## Honest limits

Rare, regional and vulgar idioms are past what a small model knows. The 1.7B default reads *"well
slap my ass and call me Sally"* as agreement rather than astonishment; the 3B gets it. A dictionary
lookup would fix the long tail, and deliberately is not wired up — the point of this project is to
find out how far a model that fits in a browser tab can actually get.

Further than you would think.
