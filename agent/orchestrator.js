const { execSync } = require('child_process');
const fs = require('fs');

const STATE_FILE = '.agent-state.json';
const APPROVED_FLAG = 'APPROVED.flag';
const MAX_LOOPS = 30;

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit' });
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { lastActor: 'Reviewer', loopCount: 0 };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function resetState() {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}

function runAgent(promptFile, actor) {
  console.log(`\n===== Running ${actor.toUpperCase()} Agent =====\n`);
  run(`codex -f ${promptFile}`);
}

function main() {
  if (process.env.SKIP_AGENT === 'true') {
    process.exit(0);
  }

  if (fs.existsSync(APPROVED_FLAG)) {
    console.log('Project already approved. Skipping agents.');
    resetState();
    process.exit(0);
  }

  let state = loadState();

  if (state.loopCount >= MAX_LOOPS) {
    console.log('Max loop count reached. Aborting to prevent infinite loop.');
    resetState();
    process.exit(1);
  }

  const nextActor = state.lastActor === 'Dev' ? 'Reviewer' : 'Dev';

  const promptFile =
    nextActor === 'Dev'
      ? 'agent/developer.prompt.txt'
      : 'agent/reviewer.prompt.txt';

  runAgent(promptFile, nextActor);

  state.lastActor = nextActor;
  state.loopCount += 1;
  saveState(state);

  console.log(`Loop count: ${state.loopCount}`);

  // Continue loop automatically unless approved
  if (!fs.existsSync(APPROVED_FLAG)) {
    main();
  } else {
    console.log('Approval detected. Loop complete.');
    resetState();
  }
}

main();
