const fs = require("fs");
const path = require("path");

const sharedProjectFilePath = path.join(
  __dirname,
  "..",
  "tenor_web",
  "cypress",
  "fixtures",
  "sharedProjectURL.json"
);

const emptyProjectData = {
  url: "",
  createdAt: "",
  description: "Shared project URL for cross-spec testing",
};

try {
  if (fs.existsSync(sharedProjectFilePath)) {
    const existingContent = fs.readFileSync(sharedProjectFilePath, "utf8");
  }

  fs.writeFileSync(
    sharedProjectFilePath,
    JSON.stringify(emptyProjectData, null, 2)
  );
} catch (error) {
  const fixturesDir = path.dirname(sharedProjectFilePath);
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  try {
    fs.writeFileSync(
      sharedProjectFilePath,
      JSON.stringify(emptyProjectData, null, 2)
    );
  } catch (createError) {
    process.exit(1);
  }
}
