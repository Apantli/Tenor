const fs = require("fs");
const path = require("path");

const API_DOCS_DIR = path.resolve(__dirname, "../docs/api");

function formatTitle(name) {
  if (name.includes("/")) {
    name = name.split("/").pop();
  }

  if (name.toLowerCase() === "ai") {
    return "AI API";
  }

  return (
    name
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      .trim() + " API"
  );
}

/**
 * Process all module README files recursively
 */
function processModuleFiles() {
  const mainReadmePath = path.join(API_DOCS_DIR, "README.md");

  if (fs.existsSync(mainReadmePath)) {
    let content = fs.readFileSync(mainReadmePath, "utf8");

    if (!content.startsWith("---")) {
      content = `---
sidebar_label: "API Reference"
sidebar_position: 1
---

${content}`;

      fs.writeFileSync(mainReadmePath, content);
      console.log(`Processed main API index`);
    }
  }

  const dirs = getAllDirectories(API_DOCS_DIR);

  for (const dir of dirs) {
    processDirectory(dir);
  }
}

/**
 * Get all directories recursively under a base path
 * @param {string} basePath - The base path to search
 * @returns {string[]} - Array of directory paths
 */
function getAllDirectories(basePath) {
  const result = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const dirPath = path.join(currentPath, item.name);
        result.push(dirPath);
        traverse(dirPath);
      }
    }
  }

  traverse(basePath);
  return result;
}

/**
 * Process a specific directory and its README files
 * @param {string} dirPath - The directory path
 */
function processDirectory(dirPath) {
  const moduleName = path.basename(dirPath);
  const readmePath = path.join(dirPath, "README.md");

  if (fs.existsSync(readmePath)) {
    processReadmeFile(readmePath, moduleName);
  }

  const classesDir = path.join(dirPath, "classes");
  if (fs.existsSync(classesDir)) {
    processClassesDirectory(classesDir);
  }

  const interfacesDir = path.join(dirPath, "interfaces");
  if (fs.existsSync(interfacesDir)) {
    processInterfacesDirectory(interfacesDir);
  }

  const functionsDir = path.join(dirPath, "functions");
  if (fs.existsSync(functionsDir)) {
    processFunctionsDirectory(functionsDir);
  }
}

/**
 * Process a README.md file to add proper front matter
 * @param {string} readmePath - Path to the README.md file
 * @param {string} moduleName - Name of the module
 */
function processReadmeFile(readmePath, moduleName) {
  let content = fs.readFileSync(readmePath, "utf8");

  const title = formatTitle(moduleName);

  if (!content.startsWith("---")) {
    content = `---
sidebar_label: "${title}"
sidebar_position: 1
---

${content}`;
  } else {
    content = content.replace(
      /---[\s\S]*?---/,
      `---
sidebar_label: "${title}"
sidebar_position: 1
---`
    );
  }

  fs.writeFileSync(readmePath, content);
  console.log(`Processed ${path.relative(API_DOCS_DIR, readmePath)}`);
}

/**
 * Process files in the classes directory
 * @param {string} classesDir - Path to the classes directory
 */
function processClassesDirectory(classesDir) {
  const files = fs.readdirSync(classesDir);

  for (const file of files) {
    if (file === "README.md") {
      const readmePath = path.join(classesDir, file);

      let content = fs.readFileSync(readmePath, "utf8");

      if (!content.startsWith("---")) {
        content = `---
sidebar_label: "Classes"
sidebar_position: 2
---

${content}`;
      } else {
        content = content.replace(
          /---[\s\S]*?---/,
          `---
sidebar_label: "Classes"
sidebar_position: 2
---`
        );
      }

      fs.writeFileSync(readmePath, content);
      console.log(`Processed classes index`);
    } else if (file.endsWith(".md")) {
      processClassOrInterfaceFile(path.join(classesDir, file), "Class");
    }
  }
}

/**
 * Process files in the interfaces directory
 * @param {string} interfacesDir - Path to the interfaces directory
 */
function processInterfacesDirectory(interfacesDir) {
  const files = fs.readdirSync(interfacesDir);

  for (const file of files) {
    if (file === "README.md") {
      const readmePath = path.join(interfacesDir, file);

      let content = fs.readFileSync(readmePath, "utf8");

      if (!content.startsWith("---")) {
        content = `---
sidebar_label: "Interfaces"
sidebar_position: 3
---

${content}`;
      } else {
        content = content.replace(
          /---[\s\S]*?---/,
          `---
sidebar_label: "Interfaces"
sidebar_position: 3
---`
        );
      }

      fs.writeFileSync(readmePath, content);
      console.log(`Processed interfaces index`);
    } else if (file.endsWith(".md")) {
      processClassOrInterfaceFile(path.join(interfacesDir, file), "Interface");
    }
  }
}

/**
 * Process files in the functions directory
 * @param {string} functionsDir - Path to the functions directory
 */
function processFunctionsDirectory(functionsDir) {
  const files = fs.readdirSync(functionsDir);

  for (const file of files) {
    if (file === "README.md") {
      const readmePath = path.join(functionsDir, file);

      let content = fs.readFileSync(readmePath, "utf8");

      if (!content.startsWith("---")) {
        content = `---
sidebar_label: "Functions"
sidebar_position: 4
---

${content}`;
      } else {
        content = content.replace(
          /---[\s\S]*?---/,
          `---
sidebar_label: "Functions"
sidebar_position: 4
---`
        );
      }

      fs.writeFileSync(readmePath, content);
      console.log(`Processed functions index`);
    } else if (file.endsWith(".md")) {
      processFunctionFile(path.join(functionsDir, file));
    }
  }
}

/**
 * Process an individual class or interface file
 * @param {string} filePath - Path to the file
 * @param {string} type - Either 'Class' or 'Interface'
 */
function processClassOrInterfaceFile(filePath, type) {
  let content = fs.readFileSync(filePath, "utf8");
  const baseName = path.basename(filePath, ".md");

  const cleanName = baseName
    .replace(/^(interface|class)-/, "")
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (!content.startsWith("---")) {
    content = `---
sidebar_label: "${cleanName}"
---

# ${type}: ${cleanName}

${content}`;
  } else {
    content = content.replace(
      /---[\s\S]*?---/,
      `---
sidebar_label: "${cleanName}"
---`
    );

    if (!content.includes(`# ${type}:`)) {
      content = content.replace(
        /---[\s\S]*?---\s*/,
        `---
sidebar_label: "${cleanName}"
---

# ${type}: ${cleanName}

`
      );
    }
  }

  fs.writeFileSync(filePath, content);
}

/**
 * Process an individual function file
 * @param {string} filePath - Path to the file
 */
function processFunctionFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const baseName = path.basename(filePath, ".md");

  const cleanName = baseName
    .replace(/^function-/, "")
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (!content.startsWith("---")) {
    content = `---
sidebar_label: "${cleanName}"
---

# Function: ${cleanName}

${content}`;
  } else {
    content = content.replace(
      /---[\s\S]*?---/,
      `---
sidebar_label: "${cleanName}"
---`
    );

    if (!content.includes(`# Function:`)) {
      content = content.replace(
        /---[\s\S]*?---\s*/,
        `---
sidebar_label: "${cleanName}"
---

# Function: ${cleanName}

`
      );
    }
  }

  fs.writeFileSync(filePath, content);
}

// Run the processor
try {
  processModuleFiles();
  console.log("✅ TypeDoc documentation processing complete!");
} catch (error) {
  console.error("❌ Error processing TypeDoc documentation:", error);
  process.exit(1);
}
