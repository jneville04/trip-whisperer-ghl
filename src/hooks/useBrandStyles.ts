import { useMemo } from "react";

function hexToHsl(hex: string): string | null {
  if (!hex || !hex.startsWith("#")) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useBrandStyles() {
  return useMemo(() => {
    const styles: Record<string, string> = {};
    try {
      const saved = localStorage.getItem("proposal-builder-data");
      if (saved) {
        const data = JSON.parse(saved);
        const brand = data.brand || {};
        if (brand.primaryColor) {
          const hsl = hexToHsl(brand.primaryColor);
          if (hsl) styles["--primary"] = hsl;
        }
        if (brand.secondaryColor) {
          const hsl = hexToHsl(brand.secondaryColor);
          if (hsl) styles["--secondary"] = hsl;
        }
        if (brand.accentColor) {
          const hsl = hexToHsl(brand.accentColor);
          if (hsl) styles["--accent"] = hsl;
        }
      }
    } catch {}
    return styles;
  }, []);
}
