export type SizingPresetGroup = "clothing" | "shoes" | "general";

export type SizingGuide = {
  summary?: string;
  howToMeasure?: string;
  presetGroups: SizingPresetGroup[];
  chart?: Array<{ size: string; measurements: Record<string, string> }>;
};

export const SIZING_PRESET_GROUP_LABELS: Record<SizingPresetGroup, string> = {
  clothing: "Clothing",
  shoes: "Shoes",
  general: "General",
};
