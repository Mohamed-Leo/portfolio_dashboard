import { spawnSync } from 'node:child_process';

const result = spawnSync('graphify', process.argv.slice(2), {
  stdio: 'inherit',
  env: {
    ...process.env,
    GRAPHIFY_NO_BACKUP: '1',
    GRAPHIFY_OUT: 'graphify-out',
  },
});

if (result.error) {
  console.error(result.error.message);
}

process.exitCode = result.status ?? 1;
