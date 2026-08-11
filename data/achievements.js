export const RECHECK_AT = '2026-08-11T22:25:48Z';

export const achievements = Object.freeze([
  {
    id: 'pull-shark', name: 'Pull Shark', status: 'earned', statusLabel: 'Earned',
    source: 'Community-reported requirement · verified evidence', icon: 'PS',
    summary: 'Two authored pull requests were merged into Achievement Playground.',
    next: 'Keep shipping useful, separately reviewable improvements. Higher tiers are long-term milestones, not a reason to split work artificially.',
    mission: 'open-pr',
    evidence: [
      { label: 'Pull request #3', value: 'Make contributor issue ownership consistent', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/pull/3' },
      { label: 'PR #3 merge commit', value: 'ac17692951d5121d3afc1cfbf494f66b28e841b8', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/commit/ac17692951d5121d3afc1cfbf494f66b28e841b8' },
      { label: 'Pull request #6', value: 'Build the first playable Git Quest', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/pull/6' },
      { label: 'PR #6 merge commit', value: 'fceca9fa34d962e2d3bf03c9917dd7dae9dac25b', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/commit/fceca9fa34d962e2d3bf03c9917dd7dae9dac25b' },
      { label: 'Authorship', value: 'Both pull requests authored by @Isaiahchonchoramirez' },
      { label: 'Verified', value: '2026-08-10' },
    ],
  },
  {
    id: 'quickdraw', name: 'Quickdraw', status: 'earned', statusLabel: 'Earned',
    source: 'Community-reported requirement · verified evidence', icon: 'QD',
    summary: 'Issue #7 was closed by a real corrective commit 30 seconds after creation.',
    next: 'Treat this as complete. Future issues should follow the normal contribution workflow.',
    evidence: [
      { label: 'Issue #7', value: 'Correct stale achievement status', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/issues/7' },
      { label: 'Created', value: '2026-08-10 22:39:47 UTC' },
      { label: 'Closed', value: '2026-08-10 22:40:17 UTC' },
      { label: 'Elapsed', value: '30 seconds' },
      { label: 'Resolving commit', value: '440ea144c6afbbf90aa3fd625e87da2ea3f23231', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/commit/440ea144c6afbbf90aa3fd625e87da2ea3f23231' },
      { label: 'CI', value: 'All four checks completed successfully' },
    ],
  },
  {
    id: 'yolo', name: 'YOLO', status: 'pending', statusLabel: 'Pending verification',
    source: 'Community-reported requirement · outcome undetermined', icon: 'YO',
    summary: 'PR #6 was merged without a human review. The achievement must not be evaluated before the recheck time.',
    next: 'Recheck separately after the deadline and only when explicitly authorized. Do not create another test PR.',
    mission: 'merge-safely',
    evidence: [
      { label: 'Pull request #6', value: 'Build the first playable Git Quest', href: 'https://github.com/Isaiahchonchoramirez/achievement-playground/pull/6' },
      { label: 'Merged', value: '2026-08-10 22:25:48 UTC' },
      { label: 'Human reviews', value: 'None submitted' },
      { label: 'Automated review', value: 'Sourcery submitted a COMMENTED review' },
      { label: 'Recheck after', value: '2026-08-11 22:25:48 UTC (6:25:48 PM America/Detroit)' },
      { label: 'Important', value: 'Whether Sourcery affects eligibility is unconfirmed. No causation is claimed.' },
    ],
  },
  {
    id: 'pair-extraordinaire', name: 'Pair Extraordinaire', status: 'available', statusLabel: 'Genuine collaboration',
    source: 'Community-reported requirement', icon: 'PE',
    summary: 'Credit belongs only when two people actually create the same commit together.',
    next: 'Pair on one meaningful feature, agree on the final commit, and add one accurate Co-authored-by trailer.',
    mission: 'coauthor', evidence: [],
  },
  {
    id: 'galaxy-brain', name: 'Galaxy Brain', status: 'available', statusLabel: 'Accepted answers',
    source: 'Community-reported requirement', icon: 'GB',
    summary: 'Helpful GitHub Discussion answers may count only when the question author accepts them.',
    next: 'Answer questions you can genuinely solve. Never request acceptance as an achievement favor.',
    mission: 'discussion', evidence: [],
  },
  {
    id: 'starstruck', name: 'Starstruck', status: 'available', statusLabel: 'Genuine public interest',
    source: 'Community-reported requirement', icon: 'ST',
    summary: 'Stars must come from people who independently find a public project useful.',
    next: 'Launch useful, complete work with a clear README and demo. Do not ask for, trade, buy, or automate stars.',
    evidence: [],
  },
  {
    id: 'public-sponsor', name: 'Public Sponsor', status: 'optional', statusLabel: 'Optional · costs money',
    source: 'Community-reported requirement', icon: 'SP',
    summary: 'Public sponsorship is a real financial decision, not a required project step.',
    next: 'Sponsor only a maintainer whose work you use, at a price you independently choose.', evidence: [],
  },
  {
    id: 'heart-on-your-sleeve', name: 'Heart On Your Sleeve', status: 'unavailable', statusLabel: 'Experimental / unavailable',
    source: 'Community-reported status · not official', icon: 'HS',
    summary: 'Reported during an experimental rollout and not currently available as a supported achievement.',
    next: 'No action. Do not manufacture reactions.', evidence: [],
  },
  {
    id: 'open-sourcerer', name: 'Open Sourcerer', status: 'unavailable', statusLabel: 'Experimental / unavailable',
    source: 'Community-reported status · not official', icon: 'OS',
    summary: 'Reported during an experimental rollout and not currently available as a supported achievement.',
    next: 'Contribute across projects only when the work is genuinely useful.', evidence: [],
  },
  {
    id: 'arctic-code-vault', name: 'Arctic Code Vault Contributor', status: 'historical', statusLabel: 'Historical',
    source: 'Historical GitHub Archive Program event', icon: 'AC',
    summary: 'This recognized contributions included in GitHub’s one-off 2020 archive snapshot.',
    next: 'No current earning route exists.', evidence: [],
  },
  {
    id: 'mars-2020', name: 'Mars 2020 Contributor', status: 'historical', statusLabel: 'Historical',
    source: 'Official GitHub documentation', icon: 'M20',
    summary: 'GitHub states that this event ended and the badge is no longer available.',
    next: 'No action. Learn from the qualifying open-source work instead.',
    evidence: [{ label: 'Official reference', value: 'GitHub profile reference', href: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#list-of-qualifying-repositories-for-mars-2020-helicopter-contributor-achievement' }],
  },
]);

export const roadmap = Object.freeze([
  'Continue improving Branchfall through meaningful feature pull requests.',
  'Recheck YOLO separately after its deadline and only with explicit authorization.',
  'Help answer relevant GitHub Discussions where you have real expertise.',
  'Collaborate truthfully with another developer on shared work.',
  'Launch a useful public project for genuine users and organic stars.',
  'Consider Public Sponsor only if you independently choose to spend money.',
]);

export function validateAchievementRecords(records = achievements) {
  const statuses = new Set(['earned', 'pending', 'available', 'optional', 'unavailable', 'historical']);
  const ids = new Set();
  const errors = [];
  records.forEach((record, index) => {
    const at = `record ${index + 1}`;
    if (!record || typeof record !== 'object') errors.push(`${at} must be an object`);
    else {
      ['id', 'name', 'status', 'statusLabel', 'source', 'summary', 'next'].forEach((key) => {
        if (typeof record[key] !== 'string' || !record[key].trim()) errors.push(`${at} needs ${key}`);
      });
      if (!statuses.has(record.status)) errors.push(`${at} has unknown status`);
      if (ids.has(record.id)) errors.push(`${at} duplicates id ${record.id}`);
      ids.add(record.id);
      if (!Array.isArray(record.evidence)) errors.push(`${at} evidence must be an array`);
    }
  });
  return errors;
}
