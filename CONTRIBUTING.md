# Contributing to Achievement Playground

This guide assumes you have never sent a pull request before. If you have,
skip to [The short version](#the-short-version).

Nothing here can break anything permanently. Every mistake in this guide has a
fix, and the fixes are at the bottom in
[When something goes wrong](#when-something-goes-wrong).

---

## What you need first

| Thing | How to check | If you do not have it |
|---|---|---|
| A GitHub account | Log in to <https://github.com> | Sign up — it is free |
| Git | `git --version` | <https://git-scm.com/downloads> |
| Node.js 18 or newer | `node --version` | <https://nodejs.org> (LTS version) |
| A text editor | — | VS Code is a good default |

One-time setup, if you have never used git on this machine:

```bash
git config --global user.name "Your Name"
git config --global user.email "YOUR-NOREPLY-EMAIL"
```

> **About that email.** Use your GitHub **no-reply** address so your real email
> never appears in a public commit. Find yours at
> <https://github.com/settings/emails> — it looks like
> `12345678+your-username@users.noreply.github.com`. Tick
> *"Keep my email addresses private"* on that page too.
>
> This matters beyond privacy: GitHub only counts a commit as yours if the
> commit email is attached to your account. Using a random email means your
> contributions do not show up on your profile at all.

---

## The short version

```bash
git clone https://github.com/Isaiahchonchoramirez/achievement-playground.git
cd achievement-playground
git switch -c add-YOUR-USERNAME
# ...make your change...
node scripts/validate-contributors.mjs
git add -A
git commit -m "Add contributor card for YOUR-USERNAME"
git push -u origin add-YOUR-USERNAME
```

Then open the pull request from the link git prints, or from the GitHub website.

---

## Your first contribution, step by step

### Step 1 — Open an issue first

Go to the **Issues** tab → **New issue** → **Add me as a contributor**, and
fill in the form.

Note the issue number GitHub gives you (something like `#7`). You will need it
in step 7.

> Why an issue first? Because that is how real projects work: the issue is the
> conversation about *whether* to make a change, and the pull request is the
> proposal for *how*. It also means someone else can see you are already working
> on it, so two people do not do the same job.

### Step 2 — Get the code onto your computer

```bash
git clone https://github.com/Isaiahchonchoramirez/achievement-playground.git
cd achievement-playground
```

If you are not a collaborator on the repository, **fork** it first (the Fork
button, top right of the GitHub page) and clone your fork instead. Everything
after this is identical.

### Step 3 — Make a branch

Never work directly on `main`. Make a branch named after what you are doing:

```bash
git switch -c add-ada-lovelace
```

Good branch names: `add-ada-lovelace`, `fix-footer-contrast`,
`docs-typo-in-readme`.
Bad branch names: `patch-1`, `test`, `stuff`.

Check you are on it:

```bash
git status      # should say: On branch add-ada-lovelace
```

### Step 4 — Make the change

To add yourself, open `data/contributors.json` and add your object to the
array. If the file currently looks like this:

```json
[]
```

make it look like this:

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

If there are already people in the list, add a **comma** after the last `}` and
put yours after it:

```json
[
  {
    "name": "Ada Lovelace",
    "github": "ada-lovelace",
    "favoriteTech": "Analytical Engine",
    "goal": "Learn how to review a pull request without panicking."
  },
  {
    "name": "Grace Hopper",
    "github": "grace-hopper",
    "favoriteTech": "COBOL",
    "goal": "Ship one accessibility fix."
  }
]
```

Rules for your entry:

| Field | Rules |
|---|---|
| `name` | How you want to be shown. Up to 60 characters. |
| `github` | Your username only — no `@`, no URL. |
| `favoriteTech` | Up to 60 characters. |
| `goal` | One sentence, up to 160 characters. |

JSON is fussy. The three mistakes everyone makes:

* A **comma after the last item** — not allowed.
* A **missing comma between items** — required.
* **Single quotes** — JSON only accepts double quotes.

The validator in step 5 catches all three and tells you which line.

### Step 5 — Check your work

```bash
node scripts/validate-contributors.mjs
```

You want to see:

```
✔ contributors.json is valid — 3 contributor(s).
```

If it prints problems, fix them and run it again. It lists every problem at
once, so you do not have to run it repeatedly.

Then look at the site. **Do not double-click `index.html`** — browsers block the
data loading when you open a file directly. Run a tiny server instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Press `Ctrl+C` in the terminal to stop it.

Squash the window down to phone width and check your card still looks right.

### Step 6 — Commit

```bash
git add -A
git commit -m "Add contributor card for ada-lovelace"
```

A good commit message finishes the sentence *"This commit will..."*:

* ✅ `Add contributor card for ada-lovelace`
* ✅ `Fix low contrast on footer links`
* ❌ `update`
* ❌ `asdf`

**If someone genuinely helped you write this**, give them credit — see
[Co-authored commits](#co-authored-commits) below.

### Step 7 — Push

```bash
git push -u origin add-ada-lovelace
```

Git prints a link. Open it.

### Step 8 — Open the pull request

The pull request template fills in automatically. Fill in each section, and in
particular write:

```
Closes #7
```

using **your** issue number from step 1. That single line makes GitHub close the
issue automatically the moment your pull request merges.

Fill in the **Role rotation** section so everyone can see whose turn it is to
review and merge. See [ACHIEVEMENTS.md](ACHIEVEMENTS.md) for the rotation.

### Step 9 — Wait for the checks

The **Validate** workflow runs automatically. Give it about a minute.

* ✅ Green — you are ready for review.
* ❌ Red — click **Details** to see what failed, fix it locally, then
  `git add -A`, `git commit`, `git push`. The pull request updates itself; you
  do not open a new one.

### Step 10 — Review, and be reviewed

Whoever is assigned as reviewer reads your change and either approves it or
asks for changes. Then whoever is assigned as merger merges it.

When you are the reviewer, a useful review answers three questions:

1. Does it do what the pull request says it does?
2. Would someone reading this in six months understand it?
3. Did the automated check pass?

Leave a comment even when you approve. "Looks good, nice clear commit message"
is a real review.

---

## Other things you can contribute

Adding your card is one pull request. Here are real jobs that still need doing.
Claim one by opening an issue for it first.

**Beginner**

* Fix a typo or an unclear sentence in any `.md` file
* Add your card (everyone's first task)
* Improve a `alt` text or `aria-label` somewhere in `index.html`
* Add a new "What you will learn" card to the Learn section

**Comfortable**

* Improve colour contrast anywhere it is borderline
* Make the header navigation work better on very narrow screens
* Add a keyboard shortcut, or improve focus order
* Add a new test case to `scripts/validate-contributors.mjs --self-test`
* Add a `prefers-contrast: more` block to `styles.css`

**Stretch**

* Add a search or filter box for the contributor cards
* Add a "sort by name / by technology" toggle
* Add a new field to the contributor schema — and update the validator, the
  card renderer, the issue template and this guide to match

**Never do this**

* Do not create empty commits (`git commit --allow-empty`) to bump a counter
* Do not open a pull request that changes nothing meaningful
* Do not reformat a whole file just to create a large diff
* Do not merge someone else's pull request without being the assigned merger

---

## Co-authored commits

When two people genuinely work on something together, both should get credit.
Git does this with a **trailer** at the end of the commit message.

### The exact format

```
Add contributor card for ada-lovelace

Ada and Grace paired on this over a call.

Co-authored-by: Grace Hopper <12345678+grace-hopper@users.noreply.github.com>
```

Rules that trip people up:

1. There must be a **blank line** before the trailer.
2. The spelling is exactly `Co-authored-by:` — one capital C, hyphens, colon.
3. The email goes in **angle brackets** `< >`.
4. One line per co-author. Multiple co-authors get multiple lines, no blank
   lines between them.

### The email must be right

> ⚠️ **The email must be one that is attached to the co-author's GitHub
> account.** If it is not, GitHub cannot match the commit to them, and they get
> no credit at all.

**Never guess someone's email. Never look it up in an old commit log and use it
without asking.** Ask them for it. They can find theirs here:

<https://github.com/settings/emails>

Their no-reply address is the one that looks like
`12345678+username@users.noreply.github.com` — that is the one to use. It is
safe to share, it is designed to be public, and it keeps their real address
private.

### A copyable command

Replace the three placeholders. The `-m` flags stack up into one message:

```bash
git commit \
  -m "SHORT SUMMARY OF THE CHANGE" \
  -m "Co-authored-by: CO_AUTHOR_NAME <CO_AUTHOR_NOREPLY_EMAIL>"
```

A worked example:

```bash
git commit \
  -m "Fix low contrast on footer links" \
  -m "Co-authored-by: Grace Hopper <12345678+grace-hopper@users.noreply.github.com>"
```

### Checking it worked

```bash
git log -1 --format=full
```

You should see the trailer at the bottom of the message. After you push, the
GitHub pull request page shows both avatars on the commit. If it shows only
yours, the email is wrong — ask the co-author to check it and fix it with:

```bash
git commit --amend      # edit the message, then save and close
git push --force-with-lease
```

(`--force-with-lease` is the safe version of force push: it refuses to run if
someone else has pushed to your branch in the meantime.)

---

## When something goes wrong

Everything here is recoverable. Find your situation.

### "I committed to `main` by accident"

Nothing is lost. Move the commit to a branch:

```bash
git branch my-fix          # bookmark the current state
git reset --hard origin/main   # put main back where it was
git switch my-fix          # your work is here
```

### "I want to undo my last commit but keep the changes"

```bash
git reset --soft HEAD~1
```

Your files are untouched; only the commit is gone. `--soft` keeps the changes
staged. Use `--mixed` (or no flag) to unstage them too.

### "I want to throw away my uncommitted changes to one file"

```bash
git restore data/contributors.json
```

To throw away **everything** uncommitted (this one is not undoable — be sure):

```bash
git restore .
```

### "I got a merge conflict in contributors.json"

This is the most common one, and it happens because two people added themselves
to the end of the same file. It is normal. Nothing is broken.

```bash
git switch main
git pull
git switch your-branch-name
git merge main
```

Git will tell you `CONFLICT (content): Merge conflict in data/contributors.json`.
Open the file and you will see:

```
<<<<<<< HEAD
  { ...your entry... }
=======
  { ...their entry... }
>>>>>>> main
```

You want **both**. Delete the three marker lines (`<<<<<<<`, `=======`,
`>>>>>>>`) and make sure there is a comma between the two objects:

```json
  { ...your entry... },
  { ...their entry... }
```

Then:

```bash
node scripts/validate-contributors.mjs   # confirm the JSON is valid again
git add data/contributors.json
git commit                               # git writes the merge message for you
git push
```

If you panic mid-conflict, `git merge --abort` puts everything back exactly as
it was before you started.

### "I pushed something I should not have"

Tell the repository owner immediately — do not try to hide it. If it was a
password, an API key or a private email address, **it must be treated as leaked
even after you delete it**, because it is in the git history and possibly in
someone's clone. Rotate the credential first, then worry about the history.

### "My branch is a mess and I want to start over"

```bash
git switch main
git pull
git branch -D messy-branch-name     # delete it locally
git switch -c fresh-branch-name     # start again
```

### "The Validate check is red and I do not understand why"

Click **Details** on the failed check. Then run the same thing locally:

```bash
node scripts/validate-contributors.mjs
node scripts/validate-contributors.mjs --self-test
node --check app.js
```

Still stuck? Open a **Discussion**. Asking is not a failure; it is how the
project works. And answering someone's Discussion question is itself a
contribution.

---

## Ground rules recap

* Branch off `main`, never commit to `main` directly.
* One pull request, one idea.
* Run the validator before you push.
* Real changes only — the [Code of Conduct](CODE_OF_CONDUCT.md) covers why.
* Never share anyone's private email, including your own.
* Ask questions in Discussions.
