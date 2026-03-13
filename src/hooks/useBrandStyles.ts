import { useAppSettings } from "@/hooks/useAppSettings";

export function useBrandStyles() {
  const { cssVars } = useAppSettings();
  return cssVars;
}
