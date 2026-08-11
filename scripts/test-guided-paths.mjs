#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { achievements } from '../data/achievements.js';
import { guidedPaths, getGuidedPath, validateGuidedPaths } from '../data/guided-paths.js';
import { MODES, PROGRESS_STATES, interpolateCommand, isValidGitHubEvidence, quoteForMode, validPlaceholder } from '../guided-paths.js';

let passed = 0; let failed = 0;
function check(name, condition) { if (condition) { passed += 1; console.log(`  pass  ${name}`); } else { failed += 1; console.error(`  FAIL  ${name}`); } }

console.log('Guided Achievement Paths\n');
check('guide schema is valid', validateGuidedPaths().length === 0);
check('every achievement has exactly one guide', guidedPaths.length === achievements.length && new Set(guidedPaths.map((path) => path.id)).size === achievements.length);
check('every guide links a current primary reference', guidedPaths.every((path) => path.references.length > 0 && path.references.every((reference) => /^https:\/\/(?:docs\.github\.com|archiveprogram\.github\.com)\//.test(reference.href))));
check('guide status comes from shared achievement records', guidedPaths.every((path) => path.status === achievements.find((record) => record.id === path.id)?.status));
check('unknown guide route falls back safely', getGuidedPath('not-real').id === 'pull-shark');
check('all instruction modes exist', ['shell', 'powershell', 'gh', 'website'].every((mode) => MODES.some((item) => item.id === mode)));
check('shell values are single-quoted safely', quoteForMode("feature/it's-safe", 'shell') === `'feature/it'"'"'s-safe'`);
check('PowerShell values double embedded quotes', quoteForMode("fix it's", 'powershell') === `'fix it''s'`);
check('command interpolation leaves incomplete placeholders visible', interpolateCommand('git switch -c <branch-name>', {}, 'shell').includes('<branch-name>'));
check('command interpolation quotes completed values', interpolateCommand('git switch -c <branch-name>', { 'branch-name': 'feature/safe' }, 'shell') === "git switch -c 'feature/safe'");
check('unsafe branch input is rejected', !validPlaceholder('branch-name', 'feature/x; rm -rf'));
check('HTTPS GitHub repository URL is accepted', validPlaceholder('repository-url', 'https://github.com/octo/repo.git'));
check('credential-bearing repository URL is rejected', !validPlaceholder('repository-url', 'https://token@github.com/octo/repo.git'));
check('public PR evidence is accepted', isValidGitHubEvidence('https://github.com/octo/repo/pull/12'));
check('public Discussion evidence is accepted', isValidGitHubEvidence('https://github.com/octo/repo/discussions/4'));
check('profile achievements evidence is accepted', isValidGitHubEvidence('https://github.com/octo?tab=achievements'));
check('non-GitHub evidence is rejected', !isValidGitHubEvidence('https://example.com/octo/repo/pull/12'));
check('historical paths contain no commands', guidedPaths.filter((path) => path.status === 'historical').every((path) => path.commands.length === 0));
check('unavailable paths contain no commands', guidedPaths.filter((path) => path.status === 'unavailable').every((path) => path.commands.length === 0));
check('every community guide says completion is not guaranteed', guidedPaths.filter((path) => path.sourceLabel.includes('Community')).every((path) => path.guaranteed === false && /never guarantees/i.test(path.ethicalNotice)));
check('co-author guide requires truthful confirmation', getGuidedPath('pair-extraordinaire').requiresContributorConfirmation === true);
check('progress stores only the five allowed labels', PROGRESS_STATES.length === 5 && PROGRESS_STATES.includes('awaiting verification'));

const html = await readFile(new URL('../paths.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../guided-paths.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../guided-paths.css', import.meta.url), 'utf8');
const all = `${html}\n${script}`;
check('page has no password or token input', !/<input[^>]+(?:password|token)/i.test(all));
check('page does not request a PAT', !/personal access token|\bPAT\b/i.test(all));
check('page contains no GitHub write fetch', !/fetch\s*\(|api\.github\.com/i.test(script));
check('copy uses Clipboard API and never execution APIs', script.includes('navigator.clipboard.writeText') && !/child_process|exec\s*\(|spawn\s*\(/.test(script));
check('local storage keys are scoped to harmless preferences', script.includes('guided-progress:v1') && script.includes('guide-mode:v1') && !/localStorage[^\n]*(token|email|repository|evidence)/i.test(script));
check('accessible tab semantics and keyboard controls exist', html.includes('role="tablist"') && script.includes("'ArrowLeft', 'ArrowRight', 'Home', 'End'"));
check('copy buttons receive screen-reader labels', script.includes('copy.setAttribute(\'aria-label\', `Copy ${step.title} command`)'));
check('reduced motion is supported', css.includes('prefers-reduced-motion: reduce'));
check('GitHub Pages assets use relative paths', !/(?:src|href)="\/(?!\/)/.test(html));
check('seven required interface illustrations exist', ['pull-request', 'reviews', 'merge', 'issue', 'contributors', 'discussion', 'profile'].every((key) => script.includes(`${key}:`) || script.includes(`'${key}':`)));

console.log(`\n${passed}/${passed + failed} guided-path tests passed.`);
if (failed) process.exit(1);
