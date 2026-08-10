#!/usr/bin/env node
/**
 * validate-contributors.mjs
 *
 * Checks data/contributors.json before it can be merged.
 *
 * Run it yourself:      node scripts/validate-contributors.mjs
 * Run the self-tests:   node scripts/validate-contributors.mjs --self-test
 *
 * No dependencies. No npm install. Any Node 18 or newer will do.
 *
 * It reports EVERY problem it finds rather than stopping at the first one,
 * so you only have to run it once to see the full list.
 *
 * Exit code 0 = everything passed. Exit code 1 = something needs fixing.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'data', 'contributors.json');

/** Every contributor must have all of these, as non-empty strings. */
const REQUIRED_FIELDS = ['name', 'github', 'favoriteTech', 'goal'];

/** Fields we allow but do not require. Anything else gets a warning. */
const OPTIONAL_FIELDS = [];

/**
 * Generous upper bounds, so one entry cannot wreck the layout.
 * These are layout guardrails, not rules about who you are — if your honest
 * answer does not fit, raise the limit here and check the card still looks
 * right at phone width, rather than shortening the truth.
 */
const MAX_LENGTHS = { name: 60, github: 39, favoriteTech: 60, goal: 160 };

/**
 * GitHub's own username rule: 1-39 characters, letters/digits/hyphens only,
 * cannot start or end with a hyphen, and cannot contain two hyphens in a row.
 */
const GITHUB_USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/* -------------------------------------------------------------------------- */
/* Core validation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Validate the raw text of contributors.json.
 * Returns { errors: string[], warnings: string[], count: number }.
 * Never throws — a broken file is a result, not a crash.
 */
export function validateContributorsText(text, label = 'data/contributors.json') {
  const errors = [];
  const warnings = [];

  // --- 1. Is it valid JSON at all? -----------------------------------------
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    errors.push(
      `${label} is not valid JSON: ${error.message}\n` +
      `      Common causes: a trailing comma after the last entry, a missing ` +
      `comma between entries, single quotes instead of double quotes, or a ` +
      `comment (JSON does not allow comments).`
    );
    return { errors, warnings, count: 0 };
  }

  // --- 2. Is the top level an array? ---------------------------------------
  if (!Array.isArray(data)) {
    errors.push(
      `${label} must contain an array. The file should start with "[" and ` +
      `end with "]". Found ${data === null ? 'null' : typeof data} instead.`
    );
    return { errors, warnings, count: 0 };
  }

  if (data.length === 0) {
    warnings.push(`${label} is empty. That is valid, but nobody is listed yet.`);
  }

  // --- 3. Check each entry --------------------------------------------------
  const seenUsernames = new Map(); // lowercased username -> first index seen

  data.forEach((entry, index) => {
    // Point at the entry the way a human reads the file: entry #1, not [0].
    const where = `entry #${index + 1}`;

    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${where}: must be an object wrapped in { }.`);
      return;
    }

    // Missing / wrong-typed / empty required fields.
    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) {
        errors.push(`${where}: missing required property "${field}".`);
        continue;
      }

      const value = entry[field];

      if (typeof value !== 'string') {
        errors.push(
          `${where}: "${field}" must be text in double quotes, ` +
          `found ${Array.isArray(value) ? 'an array' : typeof value}.`
        );
        continue;
      }

      if (value.trim() === '') {
        errors.push(`${where}: "${field}" is empty. Please fill it in.`);
        continue;
      }

      if (value !== value.trim()) {
        warnings.push(`${where}: "${field}" has leading or trailing spaces.`);
      }

      if (value.trim().length > MAX_LENGTHS[field]) {
        errors.push(
          `${where}: "${field}" is ${value.trim().length} characters; ` +
          `the limit is ${MAX_LENGTHS[field]}.`
        );
      }
    }

    // Unknown properties: allowed, but probably a typo.
    for (const key of Object.keys(entry)) {
      if (!REQUIRED_FIELDS.includes(key) && !OPTIONAL_FIELDS.includes(key)) {
        warnings.push(
          `${where}: unexpected property "${key}". ` +
          `Expected only: ${REQUIRED_FIELDS.join(', ')}.`
        );
      }
    }

    // Username format + duplicates. Only worth checking if it is usable text.
    const username = typeof entry.github === 'string' ? entry.github.trim() : '';
    if (username === '') return;

    if (username.startsWith('@')) {
      errors.push(
        `${where}: "github" should be "${username.slice(1)}", not "${username}". ` +
        `Leave the @ off.`
      );
    } else if (username.includes('/') || username.includes('github.com')) {
      errors.push(
        `${where}: "github" should be just the username, not a URL. ` +
        `Found "${username}".`
      );
    } else if (!GITHUB_USERNAME.test(username)) {
      errors.push(
        `${where}: "${username}" is not a valid GitHub username. Usernames are ` +
        `1-39 characters, may contain only letters, numbers and single hyphens, ` +
        `and cannot start or end with a hyphen.`
      );
    }

    // GitHub usernames are case-insensitive, so compare in lower case.
    const key = username.toLowerCase();
    if (seenUsernames.has(key)) {
      errors.push(
        `${where}: duplicate GitHub username "${username}" — ` +
        `already listed as entry #${seenUsernames.get(key) + 1}. ` +
        `Please edit your existing entry instead of adding a second one.`
      );
    } else {
      seenUsernames.set(key, index);
    }
  });

  return { errors, warnings, count: data.length };
}

/* -------------------------------------------------------------------------- */
/* Self-tests                                                                 */
/* -------------------------------------------------------------------------- */

/** Tiny test harness — no dependencies, no test framework to install. */
function selfTest() {
  const cases = [];
  const ok = (name, text, expectError) =>
    cases.push({ name, text, expectError });

  const valid = (over = {}) => JSON.stringify([{
    name: 'Ada Lovelace',
    github: 'ada-lovelace',
    favoriteTech: 'Analytical Engine',
    goal: 'Write the first program.',
    ...over,
  }]);

  ok('valid single entry',        valid(),                                     false);
  ok('empty array',               '[]',                                        false);
  ok('single-character username', valid({ github: 'a' }),                      false);
  ok('digits-only username',      valid({ github: '0' }),                      false);

  ok('invalid JSON (trailing comma)', '[{"name":"A",},]',                      true);
  ok('invalid JSON (single quotes)',  "[{'name':'A'}]",                        true);
  ok('not an array',              '{"name":"A"}',                              true);
  ok('entry is not an object',    '["ada"]',                                   true);

  ok('missing property',          '[{"name":"A","github":"a","goal":"g"}]',    true);
  ok('empty value',               valid({ goal: '' }),                         true);
  ok('whitespace-only value',     valid({ name: '   ' }),                      true);
  ok('non-string value',          valid({ favoriteTech: 42 }),                 true);
  ok('over-long value',           valid({ goal: 'x'.repeat(200) }),            true);

  ok('leading hyphen username',   valid({ github: '-ada' }),                   true);
  ok('trailing hyphen username',  valid({ github: 'ada-' }),                   true);
  ok('double hyphen username',    valid({ github: 'a--b' }),                   true);
  ok('underscore username',       valid({ github: 'ada_lovelace' }),           true);
  ok('too-long username',         valid({ github: 'a'.repeat(40) }),           true);
  ok('username with @',           valid({ github: '@ada' }),                   true);
  ok('username as URL',           valid({ github: 'github.com/ada' }),         true);

  ok('duplicate username', JSON.stringify([
    { name: 'A', github: 'ada', favoriteTech: 'JS', goal: 'Learn git.' },
    { name: 'B', github: 'ada', favoriteTech: 'Go', goal: 'Learn git.' },
  ]), true);

  ok('duplicate username, different case', JSON.stringify([
    { name: 'A', github: 'Ada', favoriteTech: 'JS', goal: 'Learn git.' },
    { name: 'B', github: 'ada', favoriteTech: 'Go', goal: 'Learn git.' },
  ]), true);

  let failed = 0;
  for (const { name, text, expectError } of cases) {
    const { errors } = validateContributorsText(text, 'test');
    const got = errors.length > 0;
    if (got !== expectError) {
      failed++;
      console.error(
        `  FAIL  ${name}\n        expected ${expectError ? 'an error' : 'no error'}, ` +
        `got ${got ? errors.join(' | ') : 'no error'}`
      );
    } else {
      console.log(`  pass  ${name}`);
    }
  }

  console.log(`\n${cases.length - failed}/${cases.length} self-tests passed.`);
  return failed === 0;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

async function main() {
  if (process.argv.includes('--self-test')) {
    console.log('Running validator self-tests…\n');
    process.exit(selfTest() ? 0 : 1);
  }

  let text;
  try {
    text = await readFile(DATA_PATH, 'utf8');
  } catch (error) {
    console.error(`✖ Could not read ${path.relative(ROOT, DATA_PATH)}: ${error.message}`);
    process.exit(1);
  }

  const { errors, warnings, count } = validateContributorsText(text);

  for (const warning of warnings) console.warn(`⚠ warning: ${warning}`);

  if (errors.length > 0) {
    console.error(`\n✖ contributors.json has ${errors.length} problem(s):\n`);
    for (const error of errors) console.error(`  • ${error}`);
    console.error(
      `\nFix the problems above and run this again. ` +
      `If you are stuck, open a Discussion — that is what it is there for.`
    );
    process.exit(1);
  }

  console.log(`✔ contributors.json is valid — ${count} contributor(s).`);
  if (warnings.length > 0) console.log(`  (${warnings.length} warning(s) above, not blocking.)`);
}

// Only run main() when executed directly, so tests can import the validator.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
