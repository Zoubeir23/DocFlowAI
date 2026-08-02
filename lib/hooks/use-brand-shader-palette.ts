"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/** Valeurs du token `--primary` en thème clair, utilisées avant lecture du DOM. */
const DEFAULT_PRIMARY_COLOR: HslColor = { hue: 173, saturation: 80, lightness: 30 };

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

/**
 * Recette d'un dégradé : chaque entrée décale la teinte, module la saturation
 * et déplace la luminosité par rapport à la couleur de marque.
 */
interface ColorStopRecipe {
  hueShift: number;
  saturationScale: number;
  lightnessOffset: number;
}

/** Trois déclinaisons, pour que les cartes voisines ne soient pas identiques. */
const SHADER_STOP_RECIPES: readonly (readonly ColorStopRecipe[])[] = [
  [
    { hueShift: 17, saturationScale: 0.88, lightnessOffset: -16 },
    { hueShift: 0, saturationScale: 1, lightnessOffset: 0 },
    { hueShift: -5, saturationScale: 0.78, lightnessOffset: 22 },
    { hueShift: -13, saturationScale: 0.69, lightnessOffset: 42 },
  ],
  [
    { hueShift: 27, saturationScale: 0.85, lightnessOffset: -14 },
    { hueShift: 13, saturationScale: 0.94, lightnessOffset: -2 },
    { hueShift: 1, saturationScale: 0.75, lightnessOffset: 25 },
    { hueShift: -7, saturationScale: 0.72, lightnessOffset: 46 },
  ],
  [
    { hueShift: 5, saturationScale: 0.9, lightnessOffset: -17 },
    { hueShift: -7, saturationScale: 0.98, lightnessOffset: 0 },
    { hueShift: -15, saturationScale: 0.73, lightnessOffset: 24 },
    { hueShift: -23, saturationScale: 0.65, lightnessOffset: 44 },
  ],
] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Lit un token de couleur du design system, stocké au format « H S% L% ».
 * Renvoie `null` si la variable est absente ou dans un format inattendu.
 */
function readHslToken(variableName: string): HslColor | null {
  if (typeof window === "undefined") return null;

  const rawValue = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  const match = rawValue.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return null;

  return {
    hue: Number(match[1]),
    saturation: Number(match[2]),
    lightness: Number(match[3]),
  };
}

function buildColorStop(baseColor: HslColor, recipe: ColorStopRecipe): string {
  const hue = (baseColor.hue + recipe.hueShift + 360) % 360;
  const saturation = clamp(baseColor.saturation * recipe.saturationScale, 0, 100);
  const lightness = clamp(baseColor.lightness + recipe.lightnessOffset, 4, 96);

  return `hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`;
}

interface BrandShaderPalette {
  /** Quatre arrêts de couleur transmis au shader. */
  colors: string[];
  /** Dégradé CSS équivalent, servant de repli sans WebGL ni animation. */
  gradient: string;
}

function buildPalette(baseColor: HslColor, variantIndex: number): BrandShaderPalette {
  const recipe = SHADER_STOP_RECIPES[variantIndex % SHADER_STOP_RECIPES.length];
  const colors = recipe.map((stop) => buildColorStop(baseColor, stop));

  return {
    colors,
    gradient: `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 45%, ${colors[3]})`,
  };
}

/**
 * Palette de shader dérivée du token `--primary` du design system.
 *
 * Les couleurs sont recalculées à chaque changement de thème : le teal du mode
 * sombre étant plus clair que celui du mode clair, un dégradé figé jurerait
 * dans l'un des deux. Avant lecture du DOM, la palette part des valeurs par
 * défaut du thème clair, ce qui évite tout écart d'hydratation.
 */
export function useBrandShaderPalette(variantIndex: number): BrandShaderPalette {
  const { resolvedTheme } = useTheme();
  const [baseColor, setBaseColor] = useState<HslColor>(DEFAULT_PRIMARY_COLOR);

  useEffect(() => {
    const tokenColor = readHslToken("--primary");
    if (tokenColor) setBaseColor(tokenColor);
  }, [resolvedTheme]);

  return buildPalette(baseColor, variantIndex);
}
