import { randomUUID } from 'crypto';

function generateFilenameWithDate() {
  return `audio_${Date.now()}.webm`;
}

function generateFilenameWithUUID() {
  return `audio_${randomUUID()}.webm`;
}

function checkCollisions(generator, iterations = 1000) {
  const filenames = new Set();
  let collisions = 0;
  for (let i = 0; i < iterations; i++) {
    const filename = generator();
    if (filenames.has(filename)) {
      collisions++;
    }
    filenames.add(filename);
  }
  return collisions;
}

console.log("Checking collisions for Date.now():");
const dateCollisions = checkCollisions(generateFilenameWithDate, 10000);
console.log(`Collisions: ${dateCollisions}`);

console.log("\nChecking collisions for randomUUID():");
const uuidCollisions = checkCollisions(generateFilenameWithUUID, 10000);
console.log(`Collisions: ${uuidCollisions}`);
