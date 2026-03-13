export interface BrandColors {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

const HEX_PARTIAL_REGEX = /^#?[0-9a-fA-F]{0,6}$/;
const HEX_FULL_REGEX = /^#[0-9a-fA-F]{6}$/;

export function normalizeHexInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!HEX_PARTIAL_REGEX.test(trimmed)) return trimmed.startsWith("#") ? "#" : "";

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const hexPart = withHash.slice(1).replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return `#${hexPart.toUpperCase()}`;
}

export function isValidHexColor(value?: string | null): value is string {
  if (!value) return false;
  return HEX_FULL_REGEX.test(value);
}

export function hexToHsl(hex: string): string | null {
  if (!isValidHexColor(hex)) return null;

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
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

export function buildBrandCssVars(brand?: BrandColors | null): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!brand) return styles;

  const primaryHsl = brand.primaryColor ? hexToHsl(brand.primaryColor) : null;
  const secondaryHsl = brand.secondaryColor ? hexToHsl(brand.secondaryColor) : null;
  const accentHsl = brand.accentColor ? hexToHsl(brand.accentColor) : null;

  if (primaryHsl) {
    styles["--primary"] = primaryHsl;
    styles["--ring"] = primaryHsl;
    styles["--sidebar-primary"] = primaryHsl;
    styles["--sidebar-ring"] = primaryHsl;
  }

  if (secondaryHsl) {
    styles["--secondary"] = secondaryHsl;
  }

  if (accentHsl) {
    styles["--accent"] = accentHsl;
  }

  return styles;
}
