#!/usr/bin/env npx tsx
/**
 * Generate comparison table for evaluation recordings.
 * Compares baseline (committed) vs recorded (generated) GIFs.
 * Outputs markdown suitable for GitHub Actions summary.
 */

import * as fs from "fs/promises";
import * as path from "path";

const SCENARIOS_DIR = path.join(import.meta.dirname, "scenarios");
const MAX_EMBED_SIZE = 500 * 1024; // 500KB max for base64 embedding

interface ScenarioComparison {
  name: string;
  baseline: { exists: boolean; sizeKb?: string; path?: string };
  recorded: { exists: boolean; sizeKb?: string; path?: string };
}

async function getFileStats(filePath: string): Promise<{ exists: boolean; sizeKb?: string; sizeBytes?: number }> {
  try {
    const stat = await fs.stat(filePath);
    return {
      exists: true,
      sizeKb: `${(stat.size / 1024).toFixed(1)}KB`,
      sizeBytes: stat.size,
    };
  } catch {
    return { exists: false };
  }
}

async function toBase64(filePath: string): Promise<string | null> {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_EMBED_SIZE) return null;
    const data = await fs.readFile(filePath);
    return `data:image/gif;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

async function getScenarioComparison(scenarioPath: string): Promise<ScenarioComparison> {
  const name = path.basename(scenarioPath);
  const baselinePath = path.join(scenarioPath, "baseline.gif");
  const recordedPath = path.join(scenarioPath, "recording.gif");

  const baseline = await getFileStats(baselinePath);
  const recorded = await getFileStats(recordedPath);

  return {
    name,
    baseline: { ...baseline, path: baselinePath },
    recorded: { ...recorded, path: recordedPath },
  };
}

async function main() {
  const scenarios = await fs.readdir(SCENARIOS_DIR);
  const comparisons: ScenarioComparison[] = [];

  for (const scenario of scenarios) {
    const scenarioPath = path.join(SCENARIOS_DIR, scenario);
    const stat = await fs.stat(scenarioPath);
    if (stat.isDirectory()) {
      comparisons.push(await getScenarioComparison(scenarioPath));
    }
  }

  // Output comparison table
  console.log("## Recording Evaluation Results\n");
  console.log("| Scenario | Baseline | Recorded | Status |");
  console.log("|----------|----------|----------|--------|");

  for (const c of comparisons) {
    const baselineSize = c.baseline.sizeKb || "❌ Missing";
    const recordedSize = c.recorded.sizeKb || "❌ Missing";
    let status = "⚠️ Review";
    if (!c.baseline.exists && c.recorded.exists) status = "🆕 New";
    if (c.baseline.exists && !c.recorded.exists) status = "❌ Failed";
    if (c.baseline.exists && c.recorded.exists) status = "✅ Compare";
    console.log(`| ${c.name} | ${baselineSize} | ${recordedSize} | ${status} |`);
  }

  // Show side-by-side comparisons with embedded images
  console.log("\n### Side-by-Side Comparisons\n");
  console.log("Download the `recordings` artifact to view generated GIFs.\n");

  for (const c of comparisons) {
    console.log(`<details><summary><strong>${c.name}</strong></summary>\n`);
    console.log("| Baseline | Recorded |");
    console.log("|----------|----------|");

    // Try to embed baseline (committed file, accessible via raw GitHub URL)
    const baselineCell = c.baseline.exists
      ? `![baseline](https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY || "dwmkerr/shellwright"}/${process.env.GITHUB_BASE_REF || "main"}/evaluations/scenarios/${c.name}/baseline.gif)`
      : "No baseline";

    // Recorded is in artifact, can't embed directly
    const recordedCell = c.recorded.exists
      ? `✅ Generated (${c.recorded.sizeKb}) - see artifact`
      : "❌ Not generated";

    console.log(`| ${baselineCell} | ${recordedCell} |`);
    console.log("\n</details>\n");
  }

  // Summary
  const hasFailures = comparisons.some(c => !c.recorded.exists);
  const hasNew = comparisons.some(c => !c.baseline.exists && c.recorded.exists);

  if (hasNew) {
    console.log("\n> **Note:** New recordings need baseline files. Run locally and commit baseline.gif files.\n");
  }
  if (hasFailures) {
    console.log("\n> **Warning:** Some recordings failed to generate.\n");
  }
}

main().catch(console.error);
