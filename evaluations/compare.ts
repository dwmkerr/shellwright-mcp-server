#!/usr/bin/env npx tsx
/**
 * Generate HTML comparison page for evaluation recordings.
 * Reads template.html and injects scenario rows.
 */

import * as fs from "fs/promises";
import * as path from "path";

const SCENARIOS_DIR = path.join(import.meta.dirname, "scenarios");
const TEMPLATE_PATH = path.join(import.meta.dirname, "template.html");

interface Scenario {
  name: string;
  baselineSize: string | null;
  recordedSize: string | null;
}

async function getFileSize(filePath: string): Promise<string | null> {
  try {
    const stat = await fs.stat(filePath);
    return `${(stat.size / 1024).toFixed(1)}KB`;
  } catch {
    return null;
  }
}

async function getScenarios(): Promise<Scenario[]> {
  const entries = await fs.readdir(SCENARIOS_DIR, { withFileTypes: true });
  const scenarios: Scenario[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    scenarios.push({
      name: entry.name,
      baselineSize: await getFileSize(path.join(SCENARIOS_DIR, entry.name, "baseline.gif")),
      recordedSize: await getFileSize(path.join(SCENARIOS_DIR, entry.name, "recording.gif")),
    });
  }
  return scenarios;
}

function baselineUrl(scenario: string): string {
  const repo = process.env.GITHUB_REPOSITORY || "dwmkerr/shellwright";
  const branch = process.env.GITHUB_HEAD_REF || "main";
  return `https://raw.githubusercontent.com/${repo}/${branch}/evaluations/scenarios/${scenario}/baseline.gif`;
}

function generateRow(s: Scenario): string {
  const baselineImg = s.baselineSize
    ? `<img src="${baselineUrl(s.name)}" alt="baseline">`
    : '<span class="missing">No baseline</span>';

  const recordedImg = s.recordedSize
    ? `<img src="./${s.name}/recording.gif" alt="recorded">`
    : '<span class="missing">Not generated</span>';

  return `
      <tr>
        <td class="scenario"><strong>${s.name}</strong></td>
        <td class="preview">
          <div class="size">${s.baselineSize || "Missing"}</div>
          ${baselineImg}
        </td>
        <td class="preview">
          <div class="size">${s.recordedSize || "Missing"}</div>
          ${recordedImg}
        </td>
      </tr>`;
}

async function main() {
  const scenarios = await getScenarios();
  const template = await fs.readFile(TEMPLATE_PATH, "utf-8");
  const rows = scenarios.map(generateRow).join("\n");
  const html = template.replace("<!-- ROWS -->", rows);

  await fs.writeFile(path.join(SCENARIOS_DIR, "index.html"), html);
  console.log("Generated index.html");
}

main().catch(console.error);
