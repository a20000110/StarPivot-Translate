const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

const parts = currentVersion.split('.').map(Number);

// Increment the last part
let i = parts.length - 1;
parts[i]++;

// Handle carry over
while (i > 0) {
    if (parts[i] >= 10) {
        parts[i] = 0;
        parts[i - 1]++;
        i--;
    } else {
        break;
    }
}

const newVersion = parts.join('.');
console.log(`New version: ${newVersion}`);

packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
