const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const supportedExts = new Set(['.html', '.css', '.js', '.ts', '.md', '.json']);
const mode = process.argv.includes('--write') ? 'write' : 'check';

// Common mojibake fragments produced when UTF-8 text is decoded as Latin-1/Windows-1252.
const suspiciousPatterns = [
  'Å',
  'Æ',
  'Ä',
  'É',
  'Ã',
  'â€”',
  'Ã',
  'Â',
  'Ð',
  'Ñ',
  'â€“',
  'â€”',
  'â€',
  'â„¢',
  'â‚¼',
  'â†',
];

const windows1252Map = new Map([
  [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02C6, 0x88], [0x2030, 0x89], [0x0160, 0x8A],
  [0x2039, 0x8B], [0x0152, 0x8C], [0x017D, 0x8E], [0x2018, 0x91], [0x2019, 0x92],
  [0x201C, 0x93], [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02DC, 0x98], [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B], [0x0153, 0x9C],
  [0x017E, 0x9E], [0x0178, 0x9F],
]);

function shouldSkip(entryName) {
  return entryName === 'node_modules' || entryName === '.git';
}

function listFiles(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(fullPath, output);
      continue;
    }

    if (supportedExts.has(path.extname(entry.name))) {
      output.push(fullPath);
    }
  }

  return output;
}

function hasSuspiciousEncoding(text) {
  return suspiciousPatterns.some((pattern) => text.includes(pattern));
}

function toWindows1252Buffer(text) {
  const bytes = [];

  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xFF) {
      bytes.push(codePoint);
      continue;
    }

    const mapped = windows1252Map.get(codePoint);
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }

    return null;
  }

  return Buffer.from(bytes);
}

function repairUtf8Mojibake(text) {
  const buffer = toWindows1252Buffer(text);
  if (!buffer) {
    return text;
  }

  return buffer.toString('utf8');
}

function score(text) {
  return suspiciousPatterns.reduce((count, pattern) => {
    return count + (text.includes(pattern) ? 1 : 0);
  }, 0);
}

function maybeRepair(text) {
  if (!hasSuspiciousEncoding(text)) {
    return { changed: false, text };
  }

  const repaired = repairUtf8Mojibake(text);
  const improved = score(repaired) < score(text);

  return improved && repaired !== text
    ? { changed: true, text: repaired }
    : { changed: false, text };
}

const files = listFiles(projectRoot);
const changedFiles = [];
const suspiciousFiles = [];

for (const file of files) {
  if (path.resolve(file) === path.resolve(__filename)) {
    continue;
  }

  const original = fs.readFileSync(file, 'utf8');
  const relative = path.relative(projectRoot, file);

  if (hasSuspiciousEncoding(original)) {
    suspiciousFiles.push(relative);
  }

  const result = maybeRepair(original);
  if (!result.changed) continue;

  changedFiles.push(relative);
  if (mode === 'write') {
    fs.writeFileSync(file, result.text, 'utf8');
  }
}

if (mode === 'check') {
  if (changedFiles.length === 0) {
    console.log('No repairable UTF-8 mojibake found.');
  } else {
    console.log('Repairable UTF-8 mojibake found in:');
    changedFiles.forEach((file) => console.log(`- ${file}`));
    process.exitCode = 1;
  }

  if (suspiciousFiles.length > 0 && changedFiles.length === 0) {
    console.log('');
    console.log('Suspicious text exists, but automatic repair was intentionally skipped:');
    suspiciousFiles.forEach((file) => console.log(`- ${file}`));
  }
} else if (changedFiles.length === 0) {
  console.log('No files needed repair.');
} else {
  console.log(`Repaired ${changedFiles.length} file(s):`);
  changedFiles.forEach((file) => console.log(`- ${file}`));
}
