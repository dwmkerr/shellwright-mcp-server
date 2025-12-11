/**
 * Generate SVG from xterm.js buffer with colors
 *
 * Extracts styled content directly from the terminal buffer,
 * preserving colors for accurate terminal rendering.
 */

import type { Terminal } from "@xterm/headless";

// Standard 256-color palette (first 16 are theme-dependent, rest are fixed)
const ANSI_COLORS: string[] = [
  // Standard colors (0-7) - using typical dark theme
  "#000000", "#cd0000", "#00cd00", "#cdcd00", "#0000ee", "#cd00cd", "#00cdcd", "#e5e5e5",
  // Bright colors (8-15)
  "#7f7f7f", "#ff0000", "#00ff00", "#ffff00", "#5c5cff", "#ff00ff", "#00ffff", "#ffffff",
];

// Generate 216 color cube (16-231)
for (let r = 0; r < 6; r++) {
  for (let g = 0; g < 6; g++) {
    for (let b = 0; b < 6; b++) {
      const ri = r ? r * 40 + 55 : 0;
      const gi = g ? g * 40 + 55 : 0;
      const bi = b ? b * 40 + 55 : 0;
      ANSI_COLORS.push(`#${ri.toString(16).padStart(2, "0")}${gi.toString(16).padStart(2, "0")}${bi.toString(16).padStart(2, "0")}`);
    }
  }
}

// Generate grayscale (232-255)
for (let i = 0; i < 24; i++) {
  const v = i * 10 + 8;
  ANSI_COLORS.push(`#${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}`);
}

interface SvgOptions {
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
  defaultForeground?: string;
}

const DEFAULT_OPTIONS: Required<SvgOptions> = {
  fontSize: 14,
  fontFamily: "SauceCodePro Nerd Font, Source Code Pro, Courier, monospace",
  backgroundColor: "#1e1e1e",
  defaultForeground: "#d4d4d4",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function colorToHex(colorCode: number, isForeground: boolean, defaultColor: string): string {
  if (colorCode === 0) {
    return defaultColor;
  }
  if (colorCode >= 1 && colorCode <= 256) {
    return ANSI_COLORS[colorCode - 1] || defaultColor;
  }
  // RGB color (encoded as 0x1RRGGBB)
  if (colorCode > 0x1000000) {
    const rgb = colorCode & 0xffffff;
    return `#${rgb.toString(16).padStart(6, "0")}`;
  }
  return defaultColor;
}

export function bufferToSvg(
  terminal: InstanceType<typeof Terminal>,
  cols: number,
  rows: number,
  options: SvgOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const charWidth = opts.fontSize * 0.6;
  const lineHeight = opts.fontSize * 1.2;
  const padding = 10;

  const width = cols * charWidth + padding * 2;
  const height = rows * lineHeight + padding * 2;

  const buffer = terminal.buffer.active;
  const lines: string[] = [];

  for (let y = 0; y < rows; y++) {
    const line = buffer.getLine(y);
    if (!line) continue;

    let x = 0;
    while (x < cols) {
      const cell = line.getCell(x);
      if (!cell) {
        x++;
        continue;
      }

      const char = cell.getChars() || " ";
      const cellWidth = cell.getWidth() || 1;

      // Skip continuation cells (wide chars)
      if (cellWidth === 0) {
        x++;
        continue;
      }

      const fgCode = cell.getFgColor();
      const bgCode = cell.getBgColor();
      const isBold = cell.isBold();
      const isItalic = cell.isItalic();
      const isUnderline = cell.isUnderline();

      const fg = colorToHex(fgCode, true, opts.defaultForeground);
      const bg = colorToHex(bgCode, false, "");

      const xPos = padding + x * charWidth;
      const yPos = padding + y * lineHeight + opts.fontSize;

      // Background rect if not default
      if (bg && bg !== opts.backgroundColor) {
        lines.push(
          `<rect x="${xPos}" y="${yPos - opts.fontSize}" width="${charWidth * cellWidth}" height="${lineHeight}" fill="${bg}"/>`
        );
      }

      // Text element
      const styles: string[] = [];
      if (fg !== opts.defaultForeground) styles.push(`fill="${fg}"`);
      if (isBold) styles.push('font-weight="bold"');
      if (isItalic) styles.push('font-style="italic"');
      if (isUnderline) styles.push('text-decoration="underline"');

      const styleAttr = styles.length > 0 ? " " + styles.join(" ") : "";
      const escapedChar = escapeXml(char);

      if (escapedChar.trim() || bg) {
        lines.push(`<text x="${xPos}" y="${yPos}"${styleAttr}>${escapedChar || " "}</text>`);
      }

      x += cellWidth;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="${opts.fontFamily}" font-size="${opts.fontSize}">
<rect width="100%" height="100%" fill="${opts.backgroundColor}"/>
<g fill="${opts.defaultForeground}">
${lines.join("\n")}
</g>
</svg>`;
}
