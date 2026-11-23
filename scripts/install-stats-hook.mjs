import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Install the local refresh for this clone, respecting any custom hooks already in use.
if (!process.env.CI) {
  const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
  const root = git('rev-parse', '--show-toplevel');
  if (root.status === 0 && root.stdout.trim() === process.cwd()) {
    const existing = git('config', '--get', 'core.hooksPath');
    const hook = git('rev-parse', '--git-path', 'hooks/pre-commit');
    if (existing.status === 1 && hook.status === 0 && !existsSync(hook.stdout.trim())) {
      const setup = git('config', '--local', 'core.hooksPath', '.githooks');
      if (setup.status !== 0) console.warn('Could not configure local profile-statistics hook; the deployment will still refresh.');
    }
  }
}
