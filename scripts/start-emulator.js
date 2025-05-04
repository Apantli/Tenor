const { spawn } = require('child_process');

const emulator = spawn(
  'npx',
  ['firebase', 'emulators:start', '--only', 'auth,firestore'],
  {
    stdio: 'inherit',
    shell: true,
  }
);

process.on('SIGINT', () => {
  emulator.kill('SIGINT');
  process.exit();
});
