export type SizingPresetGroup = "clothing" | "shoes" | "kids-shoes" | "bra" | "general";

export type SizingGuide = {
  /** Admin switch. Undefined counts as on; false hides the guide everywhere. */
  enabled?: boolean;
  summary?: string;
  howToMeasure?: string;
  presetGroups: SizingPresetGroup[];
  chart?: Array<{ size: string; measurements: Record<string, string> }>;
};

export const SIZING_PRESET_GROUP_LABELS: Record<SizingPresetGroup, string> = {
  clothing: "Clothing",
  shoes: "Shoes",
  "kids-shoes": "Kids shoes",
  bra: "Bra sizes",
  general: "General",
};
