# `@biliblitz/blitz`

`@biliblitz/blitz` is a meta-framework (like [Remix][remix] and [Qwik City][qwik]) for preact.

## Getting Start

Clone `https://github.com/biliblitz/blitz-template`, there is three versions of the template, naming as [`minimal`][minimal], [`recommend`][recommend] and [`full`][full]. You can manually switch branch to check what features was enabled.

After cloning the project, you may manually remove `pnpm-lock.yaml` and use your favorite npm alternatives to install dependencies. Also remove `.git` folder and run `git init` to re-initialize git history.

```bash
git clone -b recommend https://github.com/biliblitz/blitz-template blitz-example
cd blitz-example
rm -rf pnpm-lock.yaml .git
pnpm install # or npm, yarn
git init
```

## Documents

See [docs (zh_CN)][docs].

[docs]: ./docs/index.md
[qwik]: https://qwik.dev/
[full]: https://github.com/biliblitz/blitz-template/tree/full
[remix]: https://remix.run/
[minimal]: https://github.com/biliblitz/blitz-template/tree/minimal
[recommend]: https://github.com/biliblitz/blitz-template/tree/recommend
