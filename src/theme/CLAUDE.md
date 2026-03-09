# Theme System

## Overview
Token-based design system with light/dark variant support. Based on Square Terminal/Register design language — clean, minimal, high-contrast, touch-optimized.

## Structure
- `src/constants/colors.ts` — LIGHT_COLORS and DARK_COLORS palettes (ColorTokens type)
- `src/constants/spacing.ts` — 8pt grid scale: xs(4) sm(8) md(16) lg(24) xl(32) 2xl(64)
- `src/constants/typography.ts` — Font size scale, line heights, font weights
- `src/theme/index.ts` — ThemeProvider (React context) + useTheme hook

## Usage
All components consume colors via `useTheme()`. No hardcoded color strings in component files.

```tsx
const { colors, spacing, typography } = useTheme();
```

## Adding New Tokens
1. Add to the relevant constants file (colors/spacing/typography)
2. Add to BOTH LIGHT_COLORS and DARK_COLORS if it is a color
3. Update the type export if the shape changes
4. Never add hardcoded values in components — always use tokens

## Governing Skills
- web-design-guidelines/SKILL.md — UI quality and accessibility rules
- vercel-react-native-skills/SKILL.md — RN UI patterns
