// const { execSync } = require('child_process');
// const fs = require('fs');
// const path = require('path');

// const STATE_FILE = '.agent-state.json';
// const APPROVED_FLAG = 'APPROVED.flag';
// const IMPROVEMENTS_FILE = 'improvements.txt';
// const MAX_ROUNDS = 5;
// const PROJECT_ROOT = process.cwd();

// function runAgent(promptFile, actor, sandboxMode) {
//   console.log(`\n===== Running ${actor.toUpperCase()} Agent =====`);
//   console.log(`Sandbox Mode: ${sandboxMode}\n`);

//   const prompt = fs.readFileSync(promptFile, 'utf-8');

//   execSync(`codex exec --sandbox ${sandboxMode} -C "${PROJECT_ROOT}"`, {
//     input: prompt,
//     stdio: ['pipe', 'inherit', 'inherit'],
//     maxBuffer: 1024 * 1024 * 20,
//     env: process.env,
//   });
// }

// function loadState() {
//   if (!fs.existsSync(STATE_FILE)) {
//     return { round: 0 };
//   }
//   return JSON.parse(fs.readFileSync(STATE_FILE));
// }

// function saveState(state) {
//   fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
// }

// function resetState() {
//   if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
// }

// function devMadeChanges() {
//   try {
//     execSync('git diff --quiet');
//     return false; // no changes
//   } catch {
//     return true; // changes detected
//   }
// }

// function reviewerStatus() {
//   if (!fs.existsSync(IMPROVEMENTS_FILE)) return 'UNKNOWN';

//   const content = fs.readFileSync(IMPROVEMENTS_FILE, 'utf-8');

//   if (content.includes('STATUS: APPROVED')) return 'APPROVED';
//   if (content.includes('STATUS: CHANGES_REQUIRED')) return 'CHANGES_REQUIRED';

//   return 'UNKNOWN';
// }

// function main() {
//   if (process.env.SKIP_AGENT === 'true') process.exit(0);

//   if (fs.existsSync(APPROVED_FLAG)) {
//     console.log('✅ Already approved.');
//     resetState();
//     process.exit(0);
//   }

//   let state = loadState();

//   while (state.round < MAX_ROUNDS) {
//     state.round += 1;
//     saveState(state);

//     console.log(`\n🔁 ROUND ${state.round} / ${MAX_ROUNDS}`);

//     // ---- DEV STEP ----
//     runAgent(
//       path.join('agent', 'developer.prompt.txt'),
//       'Dev',
//       'danger-full-access',
//     );

//     if (!devMadeChanges()) {
//       console.log('⚠️ Dev made no changes. Stopping loop.');
//       break;
//     }

//     // ---- REVIEW STEP ----
//     runAgent(
//       path.join('agent', 'reviewer.prompt.txt'),
//       'Reviewer',
//       'read-only',
//     );

//     if (fs.existsSync(APPROVED_FLAG)) {
//       console.log('\n🎉 APPROVED via flag.');
//       resetState();
//       process.exit(0);
//     }

//     const status = reviewerStatus();

//     if (status === 'APPROVED') {
//       console.log('\n🎉 APPROVED via reviewer status.');
//       resetState();
//       process.exit(0);
//     }

//     if (status !== 'CHANGES_REQUIRED') {
//       console.log('⚠️ Reviewer returned unclear status. Stopping.');
//       break;
//     }

//     console.log('🔄 Reviewer requested changes. Continuing...');
//   }

//   console.log('\n❌ Max rounds reached or convergence detected.');
//   resetState();
//   process.exit(1);
// }

// main();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APPROVED_FLAG = 'APPROVED.flag';
const IMPROVEMENTS_FILE = 'improvements.txt';
const MAX_ROUNDS = 5;
const PROJECT_ROOT = process.cwd();

/**
 * Execute Codex agent with given prompt and sandbox mode
 */
function runAgent(promptFile, actor, sandboxMode) {
  console.log(`\n===== Running ${actor.toUpperCase()} Agent =====`);
  console.log(`Sandbox Mode: ${sandboxMode}\n`);

  if (!fs.existsSync(promptFile)) {
    console.error(`Prompt file not found: ${promptFile}`);
    process.exit(1);
  }

  const prompt = fs.readFileSync(promptFile, 'utf-8');

  try {
    execSync(`codex exec --sandbox ${sandboxMode} -C "${PROJECT_ROOT}"`, {
      input: prompt,
      stdio: ['pipe', 'inherit', 'inherit'],
      maxBuffer: 1024 * 1024 * 20,
      env: process.env,
    });
  } catch (err) {
    console.error(`❌ ${actor} agent execution failed.`);
    process.exit(1);
  }
}

/**
 * Check whether Dev made any changes to the repo
 */
function devMadeChanges() {
  try {
    execSync('git diff --quiet');
    return false; // no changes
  } catch {
    return true; // changes detected
  }
}

/**
 * Parse reviewer status from improvements file
 */
// function reviewerStatus() {
//   if (!fs.existsSync(IMPROVEMENTS_FILE)) return 'UNKNOWN';

//   const content = fs.readFileSync(IMPROVEMENTS_FILE, 'utf-8');

//   if (content.includes('STATUS: APPROVED')) return 'APPROVED';
//   if (content.includes('STATUS: CHANGES_REQUIRED')) return 'CHANGES_REQUIRED';

//   return 'UNKNOWN';
// }
function reviewerStatus() {
  if (!fs.existsSync(IMPROVEMENTS_FILE)) return 'UNKNOWN';

  const lines = fs
    .readFileSync(IMPROVEMENTS_FILE, 'utf-8')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim().toUpperCase());

  const statusLine = lines.reverse().find((l) => l.startsWith('STATUS:'));

  if (!statusLine) return 'UNKNOWN';

  if (statusLine.includes('APPROVED')) return 'APPROVED';
  if (statusLine.includes('CHANGES_REQUIRED')) return 'CHANGES_REQUIRED';

  return 'UNKNOWN';
}

/**
 * Cleanup artifacts between runs
 */
function cleanupArtifacts() {
  if (fs.existsSync(APPROVED_FLAG)) {
    fs.unlinkSync(APPROVED_FLAG);
  }
}

/**
 * Main orchestrator loop
 */
function main() {
  if (process.env.SKIP_AGENT === 'true') {
    console.log('⏭️  SKIP_AGENT enabled. Skipping AI review.');
    process.exit(0);
  }

  // Always start fresh for every commit invocation
  cleanupArtifacts();

  let round = 0;

  while (round < MAX_ROUNDS) {
    round++;
    console.log(`\n🔁 ROUND ${round} / ${MAX_ROUNDS}`);

    // ---- DEV STEP ----
    runAgent(
      path.join('agent', 'developer.prompt.txt'),
      'Dev',
      'danger-full-access',
    );

    if (!devMadeChanges()) {
      console.log('⚠️ Dev made no changes. Converged.');
      process.exit(0);
    }

    // ---- REVIEW STEP ----
    runAgent(
      path.join('agent', 'reviewer.prompt.txt'),
      'Reviewer',
      'read-only',
    );

    // Approval via flag
    if (fs.existsSync(APPROVED_FLAG)) {
      console.log('\n🎉 APPROVED (flag detected).');
      process.exit(0);
    }

    const status = reviewerStatus();

    if (status === 'APPROVED') {
      console.log('\n🎉 APPROVED (reviewer status).');
      process.exit(0);
    }

    if (status !== 'CHANGES_REQUIRED') {
      console.log('⚠️ Reviewer returned unclear status. Failing safely.');
      process.exit(1);
    }

    console.log('🔄 Reviewer requested changes. Continuing...');
  }

  console.log('\n❌ Max rounds reached without approval.');
  process.exit(1);
}

main();
