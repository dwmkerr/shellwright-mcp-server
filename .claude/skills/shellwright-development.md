---
name: shellwright-development
description: Development workflows for Shellwright including themes, screenshots, and scripts
---

# Shellwright Development Skill

Development workflows and scripts for the Shellwright MCP server.

## Theme Development

Themes define terminal color palettes for screenshots and recordings.

### Theme Structure

Themes are defined in `src/lib/themes.ts`:

```typescript
export interface Theme {
  name: string;                    // e.g., "one-dark"
  type: "dark" | "light";
  description: string;
  tip?: string;
  ansiColors: [/* 16 ANSI colors */];
  background: string;              // Terminal background
  foreground: string;              // Default text color
}
```

### Adding a New Theme

1. Add theme definition to `src/lib/themes.ts`
2. Export in the `themes` record
3. Regenerate screenshots: `npx tsx scripts/generate-theme-screenshots.ts`
4. Regenerate demo GIF: `./scripts/theme-demo.sh`

### Color Mapping

xterm's `getFgColor()`/`getBgColor()` returns:
- `-1` for default (no explicit color)
- `0-255` for palette colors (0=black, 1=red, 2=green, etc.)
- `>255` for RGB colors (raw RGB value)

The `colorToHex()` function in `src/lib/buffer-to-svg.ts` handles this mapping.

## Scripts

### generate-theme-screenshots.ts

Generates SVG screenshots for each theme with embedded labels.

```bash
npx tsx scripts/generate-theme-screenshots.ts
```

Output: `docs/themes/{theme-name}.svg`

Features:
- Colorful terminal output with ANSI codes
- Theme name label at bottom (26pt monospace, white/black)
- Uses xterm headless for buffer rendering

### theme-demo.sh

Generates a cycling GIF from theme SVGs.

```bash
./scripts/theme-demo.sh
```

Output: `docs/themes/themes-demo.gif`

Requirements:
- ImageMagick (`brew install imagemagick`)

Settings:
- 3 second delay per frame (`-delay 300`)
- 2x scale for clarity (`-scale 200%`)
- 200 DPI density

## Build Commands

```bash
npm install       # Install dependencies
npm run build     # Build TypeScript
npm run dev       # Development with hot-reload
```

## Testing Changes

After modifying themes or screenshot generation:

1. Build: `npm run build`
2. Generate screenshots: `npx tsx scripts/generate-theme-screenshots.ts`
3. Generate GIF: `./scripts/theme-demo.sh`
4. Preview: `open docs/themes/themes-demo.gif`
