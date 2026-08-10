# Achievement Playground

A small, real project where a group of friends learns how GitHub actually works
— branches, pull requests, code review, merges and co-authored commits — by
making genuine improvements to a static website.

It is also a place to earn some of GitHub's profile achievements honestly. See
[ACHIEVEMENTS.md](ACHIEVEMENTS.md) for which ones are realistically obtainable
and which ones have been retired.

[![Validate](https://github.com/Isaiahchonchoramirez/achievement-playground/actions/workflows/validate.yml/badge.svg)](https://github.com/Isaiahchonchoramirez/achievement-playground/actions/workflows/validate.yml)

---

## What this is

A single-page site — plain HTML, CSS and JavaScript, no frameworks, no build
step, no dependencies — that renders a contributor card for every person listed
in `data/contributors.json`.

Adding yourself to that file is your first pull request. Everything after that
is real work on a real (if small) project.

## What this is not

This is not a way to fake activity. No empty commits, no filler pull requests,
no asking strangers for stars, no fabricated Discussion questions. Every rule
about that is in the [Code of Conduct](CODE_OF_CONDUCT.md), and the reasoning is
in [ACHIEVEMENTS.md](ACHIEVEMENTS.md).

---

## Run it locally

You need [Node.js 18+](https://nodejs.org) for the validator and any static
server for the site. There is nothing to install.

```bash
git clone https://github.com/Isaiahchonchoramirez/achievement-playground.git
cd achievement-playground

# Check the contributor data
node scripts/validate-contributors.mjs

# Serve the site — do NOT just double-click index.html
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

> **Why not just open the file?** `app.js` loads `data/contributors.json` with
> `fetch()`, and browsers block that on `file://` URLs for security reasons.
> The page will show an error telling you the same thing.

Any static server works — `npx serve`, `php -S localhost:8000`, the VS Code
Live Server extension, whatever you already have.

---

## Project layout

```
.
├── index.html                          The whole site — one page
├── styles.css                          All styling; the tweakable values are at the top
├── app.js                              Reads contributors.json, builds the cards
├── data/
│   └── contributors.json               ← the file you edit to add yourself
├── scripts/
│   └── validate-contributors.mjs       Checks that file; run it before you push
├── .github/
│   ├── workflows/validate.yml          Runs the checks on every pull request
│   ├── pull_request_template.md        Auto-fills when you open a PR
│   └── ISSUE_TEMPLATE/
│       ├── add-contributor.yml         Use this for your first contribution
│       └── bug-report.yml              Use this when something is broken
├── README.md                           You are here
├── CONTRIBUTING.md                     Step-by-step git guide for beginners
├── CODE_OF_CONDUCT.md                  How we treat each other, and the no-faking rules
├── ACHIEVEMENTS.md                     What is obtainable, what is retired, who does what
├── LICENSE                             MIT
└── .gitignore
```

---

## The contributor data

`data/contributors.json` is an array of objects. Every entry needs all four
fields:

```json
[
  {
    "name": "Ada Lovelace",
    "github": "ada-lovelace",
    "favoriteTech": "Analytical Engine",
    "goal": "Learn how to review a pull request without panicking."
  }
]
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Non-empty, up to 60 characters |
| `github` | string | A valid GitHub username — no `@`, no URL, must be unique |
| `favoriteTech` | string | Non-empty, up to 60 characters |
| `goal` | string | Non-empty, up to 160 characters |

The validator rejects invalid JSON, missing fields, empty values, duplicate
usernames (case-insensitively) and malformed usernames — with a message telling
you which entry and what to do about it.

```bash
node scripts/validate-contributors.mjs             # check the real file
node scripts/validate-contributors.mjs --self-test # check the validator itself
```

---

## How to contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md). The short version:

1. Open an issue (**Issues → New issue → Add me as a contributor**)
2. `git switch -c add-your-username`
3. Add yourself to `data/contributors.json`
4. `node scripts/validate-contributors.mjs`
5. Commit, push, open a pull request, write `Closes #<your issue number>`
6. Wait for the green check, get a review, and someone else merges it

Then take your next turn in the [rotation](ACHIEVEMENTS.md#the-rotation).

Stuck? Open a **Discussion**. Asking is part of how this works — and answering
someone else's question is a contribution in its own right.

---

## Automated checks

Every push and pull request runs [`.github/workflows/validate.yml`](.github/workflows/validate.yml),
which:

* confirms every required project file still exists
* runs the validator's own self-tests
* validates `data/contributors.json`
* syntax-checks the JavaScript
* sanity-checks the YAML templates

No secrets, no paid services, read-only permissions.

---

## License

[MIT](LICENSE). Take anything here and use it for your own group.
