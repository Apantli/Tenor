const fs = require('fs');
const path = require('path');

const sharedFilePaths = [
  path.join(
    __dirname,
    '..',
    'tenor_web',
    'cypress',
    'fixtures',
    'sharedProjectURL.json'
  ),
  path.join(
    __dirname,
    '..',
    'tenor_web',
    'cypress',
    'fixtures',
    'sharedUser.json'
  ),
];

const emptyData = [
  {
    url: '',
    createdAt: '',
    description: 'Shared project URL for cross-spec testing',
  },
  {
    exists: false,
    createdAt: '',
    description: 'Shared user for cross-spec testing',
  },
];

try {
  for (let i = 0; i < sharedFilePaths.length; i++) {
    if (fs.existsSync(sharedFilePaths[i])) {
      const existingContent = fs.readFileSync(sharedFilePaths[i], 'utf8');
    }

    fs.writeFileSync(sharedFilePaths[i], JSON.stringify(emptyData[i], null, 2));
  }
} catch (error) {
  for (let i = 0; i < sharedFilePaths.length; i++) {
    const fixturesDir = path.dirname(sharedFilePaths[i]);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    try {
      fs.writeFileSync(
        sharedFilePaths[i],
        JSON.stringify(emptyData[i], null, 2)
      );
    } catch (createError) {
      process.exit(1);
    }
  }
}
