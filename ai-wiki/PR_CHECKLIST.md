# PR Checklist Reference

The automated PR body should be narrative and specific to the actual change.

This checklist is retained as a review reference rather than used as the PR description.

## Validation

- Run `node scripts/validate-contributors.mjs`.
- Run `node scripts/validate-contributors.mjs --self-test`.
- Syntax-check relevant JavaScript.
- Syntax-check shell tooling when changed.
- Open the site locally for visible UI changes.
- Check narrow-screen behavior for visible UI changes.
- Confirm the GitHub Validate workflow is green.

## Collaboration

- The builder should not review their own PR.
- The assigned reviewer should inspect the real diff.
- Co-author trailers are only for genuine co-authorship.
- Do not commit secrets or private information.
- Every PR must contain a real coherent improvement.

## PR description standard

A useful PR should explain:

- what changed
- why it matters
- important implementation choices
- how it was tested
- what the reviewer should pay attention to
- what the next AI is being handed

Avoid blank template headings and checkbox walls as the main description.
