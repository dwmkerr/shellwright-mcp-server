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
import ansiToSvg from "ansi-to-svg";
import { Resvg } from "@resvg/resvg-js";

const COLS = 120;
const ROWS = 40;
const OUTPUT_DIR = path.join(import.meta.dirname, "output");

// Create terminal emulator
const terminal = new Terminal({
  cols: COLS,
  rows: ROWS,
  allowProposedApi: true,
});

// Raw ANSI buffer for colored screenshots
const rawBuffer: string[] = [];

// Screenshot function - saves current screen to .txt, .svg, .png files
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
  const textContent = lines.join("\n");
  const basePath = path.join(OUTPUT_DIR, name);

  // Save text file
  fs.writeFileSync(`${basePath}.txt`, textContent);
  console.log(`Screenshot saved: ${basePath}.txt`);

  // Generate SVG from raw ANSI
  const rawContent = rawBuffer.join("");
  const svg = ansiToSvg(rawContent);
  fs.writeFileSync(`${basePath}.svg`, svg);
  console.log(`Screenshot saved: ${basePath}.svg`);

  // Generate PNG from SVG
  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();
  fs.writeFileSync(`${basePath}.png`, png);
  console.log(`Screenshot saved: ${basePath}.png`);
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

// Feed PTY data to terminal emulator and raw buffer
shell.onData((data) => {
  terminal.write(data);
  rawBuffer.push(data);
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
