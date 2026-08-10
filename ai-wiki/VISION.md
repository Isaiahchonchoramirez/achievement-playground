# Product Vision — Git Quest: Branchfall

> **Owner-approved product direction.** Git Quest: Branchfall is the current direction approved by the repository owner. Agents may propose changes to this direction in a pull request with reasoning, but routine AI rounds must not silently replace or rewrite it.

Achievement Playground should become more than a contributor wall.

Build an interactive, dependency-free Git learning game directly into the site.

## Core fantasy

The player is given a realistic software task and must move it through a simulated Git workflow.

The interface shows a live commit graph and a workbench of actions such as:

- create branch
- make change
- commit
- open pull request
- run checks
- request review
- merge
- sync with main
- resolve a conflict

The graph should visibly react to every action so Git stops feeling like invisible terminal magic.

## First playable mission

Mission: ship a contributor-search improvement.

The player starts on `main` with a small task card.

A clean solution requires:

1. create a feature branch
2. make the change
3. commit it
4. open a pull request
5. run validation
6. get a review
7. merge

Wrong choices are allowed.

Committing directly to `main`, opening a PR with no commit, merging before validation, or letting the branch become stale should produce understandable consequences rather than a dead end.

## Design principles

- Plain HTML/CSS/JavaScript.
- No framework or package install.
- SVG or DOM for the commit graph.
- Keyboard accessible.
- Deterministic state machine.
- Fun enough that somebody would click it even if they already know Git.
- Teach by consequence, not walls of instructions.
- Keep the real contributor wall intact.

## Future missions

- merge conflict in `contributors.json`
- stale branch and sync with `main`
- accidental commit on `main`
- amend a bad commit message
- co-authored commit
- failed CI and repair
- revert a bad merge
- cherry-pick a useful fix

## Builder rule

Each AI should improve the actual playable experience, not merely add documentation about it.

Implementation details may evolve freely. A change to the owner-approved product direction itself must be proposed explicitly in a PR rather than silently rewritten during a routine round.
