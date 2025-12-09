/**
 * K9s Integration Test
 *
 * Opens k9s, takes screenshots, navigates to deployments, takes more screenshots.
 * Run: npx tsx tests/04-k9s/run.ts
 */

import * as pty from "node-pty";
import * as fs from "fs";
import * as path from "path";
import xterm from "@xterm/headless";
const { Terminal } = xterm;

const COLS = 120;
const ROWS = 40;
const OUTPUT_DIR = path.join(import.meta.dirname, "output");

// Create terminal emulator
const terminal = new Terminal({
  cols: COLS,
  rows: ROWS,
  allowProposedApi: true,
});

// Screenshot function - saves current screen to .txt file
function screenshot(name: string): void {
  const buffer = terminal.buffer.active;
  const lines: string[] = [];
  for (let i = 0; i < ROWS; i++) {
    const line = buffer.getLine(i);
    if (line) {
      lines.push(line.translateToString(true).padEnd(COLS));
    } else {
      lines.push("".padEnd(COLS));
    }
  }
  const content = lines.join("\n");
  const filepath = path.join(OUTPUT_DIR, `${name}.txt`);
  fs.writeFileSync(filepath, content);
  console.log(`Screenshot saved: ${filepath}`);
}

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Check if k9s is available
const k9sPath = process.env.K9S_PATH || "k9s";

console.log(`Starting k9s (${COLS}x${ROWS})...`);

const shell = pty.spawn(k9sPath, [], {
  name: "xterm-256color",
  cols: COLS,
  rows: ROWS,
  cwd: process.cwd(),
  env: { ...process.env, TERM: "xterm-256color" },
});

// Feed PTY data to terminal emulator
shell.onData((data) => {
  terminal.write(data);
});

// Sequence of actions
const actions = [
  { delay: 3000, action: () => screenshot("step-01-k9s") },
  { delay: 500, action: () => { shell.write(":deploy\r"); console.log("Sent: :deploy"); } },
  { delay: 2000, action: () => screenshot("step-02-deployments") },
  { delay: 500, action: () => { shell.write(":q\r"); console.log("Sent: :q (exit)"); } },
];

async function runActions() {
  for (const { delay, action } of actions) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    action();
  }

  // Wait for k9s to exit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("\nDone. Output files in:", OUTPUT_DIR);
  process.exit(0);
}

shell.onExit(() => {
  console.log("k9s exited");
});

runActions();
