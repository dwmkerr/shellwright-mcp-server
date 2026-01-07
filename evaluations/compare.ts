#!/usr/bin/env npx tsx
/**
 * Generate comparison table for evaluation recordings.
 * Compares baseline (committed) vs recorded (generated) GIFs.
 * Outputs markdown suitable for GitHub Actions summary.
 */

import * as fs from "fs/promises";
import * as path from "path";

const SCENARIOS_DIR = path.join(import.meta.dirname, "scenarios");

interface ScenarioComparison {
  name: string;
  baseline: { exists: boolean; sizeKb?: string };
  recorded: { exists: boolean; sizeKb?: string };
}

async function getFileStats(filePath: string): Promise<{ exists: boolean; sizeKb?: string }> {
  try {
    const stat = await fs.stat(filePath);
    return {
      exists: true,
      sizeKb: `${(stat.size / 1024).toFixed(1)}KB`,
    };
  } catch {
    return { exists: false };
  }
}

async function getScenarioComparison(scenarioPath: string): Promise<ScenarioComparison> {
  const name = path.basename(scenarioPath);
  const baselinePath = path.join(scenarioPath, "baseline.gif");
  const recordedPath = path.join(scenarioPath, "recording.gif");

  return {
    name,
    baseline: await getFileStats(baselinePath),
    recorded: await getFileStats(recordedPath),
  };
}

function getBaselineUrl(scenario: string): string {
  const repo = process.env.GITHUB_REPOSITORY || "dwmkerr/shellwright";
  const branch = process.env.GITHUB_HEAD_REF || "main";
  return `https://raw.githubusercontent.com/${repo}/${branch}/evaluations/scenarios/${scenario}/baseline.gif`;
}

function getRecordedUrl(scenario: string): string | null {
  const previewUrl = process.env.PREVIEW_URL;
  if (!previewUrl) return null;
  return `${previewUrl}${scenario}/recording.gif`;
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

  console.log("## Recording Evaluation\n");
  console.log("| Scenario | Baseline | PR |");
  console.log("|----------|----------|-----|");

  for (const c of comparisons) {
    const baselineSize = c.baseline.exists ? c.baseline.sizeKb : "❌ Missing";
    const baselineImg = c.baseline.exists
      ? `![baseline](${getBaselineUrl(c.name)})`
      : "";

    const recordedUrl = getRecordedUrl(c.name);
    const recordedSize = c.recorded.exists ? c.recorded.sizeKb : "❌ Missing";
    const recordedImg = c.recorded.exists && recordedUrl
      ? `![recorded](${recordedUrl})`
      : c.recorded.exists
        ? "*(download artifact)*"
        : "";

    console.log(`| **${c.name}** | ${baselineSize}<br/>${baselineImg} | ${recordedSize}<br/>${recordedImg} |`);
  }

  // Notes
  const hasFailures = comparisons.some(c => !c.recorded.exists);
  const hasNew = comparisons.some(c => !c.baseline.exists && c.recorded.exists);

  if (hasNew || hasFailures) console.log("");
  if (hasNew) {
    console.log("> **Note:** New recordings need baseline files. Run locally and commit baseline.gif files.");
  }
  if (hasFailures) {
    console.log("> **Warning:** Some recordings failed to generate.");
  }
}

main().catch(console.error);
