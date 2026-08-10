# Current State

Achievement Playground is a small static HTML/CSS/JavaScript project for learning real GitHub collaboration.

Current characteristics:

- No application framework.
- No package install or build step.
- Contributor cards are loaded from `data/contributors.json`.
- `scripts/validate-contributors.mjs` validates contributor data.
- GitHub Actions validates the repository on pull requests.
- Local AI collaboration tooling lives under `scripts/`.
- `game/` holds Git Quest: Branchfall — `mission.js` is a pure, DOM-free state
  machine and `game.js` renders it. Rules live only in `mission.js`.
- `scripts/test-mission.mjs` tests the mission reducer headlessly in CI.
- Generated AI context snapshots live at the repository root and are ignored by Git.
- `ai-wiki/` is tracked and maintained by the AI builders as persistent project memory.

This page should describe the current system, not the history of how it got here.
