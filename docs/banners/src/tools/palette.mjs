// Writes a Material Theme Builder style palette (the shape of SalesHeatmap/Styles/ColorPaletteOverride.json, which the
// Uno.Sdk "Dsp" feature turns into ColorPaletteOverride.xaml at build time) from one seed colour, with Google's
// material-color-utilities. Used only for the palette-swap builds, in a git-archive export, never in the repository.
//
//   NODE_PATH=<dir with @material/material-color-utilities> node palette.mjs <#seed> <name> [variant] > ColorPaletteOverride.json
//   variant: fidelity (default: Primary keeps the seed's own chroma, like the shipped violet) or tonalspot
import { createRequire } from 'module';
const require = createRequire(process.env.NODE_PATH.split(':')[0] + '/');
const m = await import(require.resolve('@material/material-color-utilities'));
const { argbFromHex, hexFromArgb, Hct, SchemeFidelity, SchemeTonalSpot, MaterialDynamicColors: C } = m;

const [seedHex, name, variant = 'fidelity'] = process.argv.slice(2);
const seed = Hct.fromInt(argbFromHex(seedHex));
const Make = variant === 'tonalspot' ? SchemeTonalSpot : SchemeFidelity;
const roles = {
  primary: C.primary, surfaceTint: C.surfaceTint, onPrimary: C.onPrimary, primaryContainer: C.primaryContainer,
  onPrimaryContainer: C.onPrimaryContainer, secondary: C.secondary, onSecondary: C.onSecondary,
  secondaryContainer: C.secondaryContainer, onSecondaryContainer: C.onSecondaryContainer, tertiary: C.tertiary,
  onTertiary: C.onTertiary, tertiaryContainer: C.tertiaryContainer, onTertiaryContainer: C.onTertiaryContainer,
  error: C.error, onError: C.onError, errorContainer: C.errorContainer, onErrorContainer: C.onErrorContainer,
  background: C.background, onBackground: C.onBackground, surface: C.surface, onSurface: C.onSurface,
  surfaceVariant: C.surfaceVariant, onSurfaceVariant: C.onSurfaceVariant, outline: C.outline,
  outlineVariant: C.outlineVariant, shadow: C.shadow, scrim: C.scrim, inverseSurface: C.inverseSurface,
  inverseOnSurface: C.inverseOnSurface, inversePrimary: C.inversePrimary,
};
const scheme = dark => {
  const s = new Make(seed, dark, 0);
  return Object.fromEntries(Object.entries(roles).map(([k, r]) => [k, hexFromArgb(r.getArgb(s)).toLowerCase()]));
};
const light = scheme(false), dark = scheme(true);
console.log(JSON.stringify({
  description: `${name} (seed ${seedHex}, ${variant}) for the palette-swap banner build`,
  seed: seedHex.toLowerCase(),
  coreColors: { primary: seedHex.toLowerCase() },
  extendedColors: [],
  schemes: { light, dark },
  palettes: {},
}, null, 4));
