#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { achievements, RECHECK_AT, validateAchievementRecords } from '../data/achievements.js';
import { practiceMissions, getMission, initialPracticeState, reducePractice } from '../game/practice-missions.js';

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) { passed += 1; console.log(`  pass  ${name}`); }
  else { failed += 1; console.error(`  FAIL  ${name}`); }
}

console.log('Achievement Command Center\n');
check('achievement schema is valid', validateAchievementRecords().length === 0);
check('exactly two records are earned', achievements.filter((a) => a.status === 'earned').length === 2);
check('Pull Shark is earned', achievements.find((a) => a.id === 'pull-shark')?.status === 'earned');
check('Quickdraw is earned', achievements.find((a) => a.id === 'quickdraw')?.status === 'earned');
const yolo = achievements.find((a) => a.id === 'yolo');
check('YOLO remains pending', yolo?.status === 'pending');
check('YOLO recheck timestamp is exact', RECHECK_AT === '2026-08-11T22:25:48Z');
check('YOLO rejects causal claims about Sourcery', yolo?.evidence.some((e) => e.value.includes('No causation is claimed')));
check('earned records contain evidence', achievements.filter((a) => a.status === 'earned').every((a) => a.evidence.length > 0));
check('unavailable records render explicitly', achievements.filter((a) => a.status === 'unavailable').length === 2);
check('historical records render explicitly', achievements.filter((a) => a.status === 'historical').length === 2);
check('eight practice missions exist', practiceMissions.length === 8);
check('unknown mission routes safely', getMission('missing').id === 'branch');
for (const mission of practiceMissions) {
  let state = initialPracticeState(mission.id);
  for (let index = 0; index < mission.steps.length; index += 1) state = reducePractice(state, { type: 'ADVANCE' });
  check(`${mission.id} can complete and reset`, state.complete && !reducePractice(state, { type: 'RESET' }).complete);
}

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const command = await readFile(new URL('../command-center.js', import.meta.url), 'utf8');
const practice = await readFile(new URL('../game/practice.js', import.meta.url), 'utf8');
const allSource = `${index}\n${command}\n${await readFile(new URL('../app.js', import.meta.url), 'utf8')}`;
check('page contains no password or token input', !/<input[^>]+(password|token)/i.test(allSource));
check('page contains no PAT collection language', !/personal access token|github token/i.test(allSource));
check('safe external links use a new isolated tab', command.includes("target = '_blank'") && command.includes("rel = 'noopener noreferrer'"));
check('GitHub Pages assets use relative paths', !/(?:src|href)="\/(?!\/)/.test(index));
check('reduced motion is supported', (await readFile(new URL('../styles.css', import.meta.url), 'utf8')).includes('prefers-reduced-motion: reduce'));
check('mission tabs support arrow-key navigation', practice.includes("'ArrowLeft', 'ArrowRight', 'Home', 'End'"));

console.log(`\n${passed}/${passed + failed} command-center tests passed.`);
if (failed) process.exit(1);
