/** What a product in a category asks for. Mirrors the Backend's CategoryAttribute. */
export type AttributeType = "size" | "colour" | "select" | "text";
export type SizePreset = "clothing" | "shoes" | "kids-shoes" | "bra" | "general";

export interface CategoryAttribute {
  key: string;
  label: string;
  type: AttributeType;
  required: boolean;
  options?: string[];
  preset?: SizePreset;
  /** Different values are different purchasable variants (size, colour, capacity). */
  variantAxis: boolean;
}

export const ATTRIBUTE_TYPE_LABEL: Record<AttributeType, string> = {
  size: "Size",
  colour: "Colour",
  select: "Choose from a list",
  text: "Free text",
};

export const SIZE_PRESET_LABEL: Record<SizePreset, string> = {
  clothing: "Clothing (XS to 3XL)",
  shoes: "Shoes (EU 36 to 46)",
  "kids-shoes": "Kids shoes (EU 20 to 35)",
  bra: "Bra sizes",
  general: "One size, Small, Medium, Large",
};

/** camelCase key from a label, used to store the value on a variant. */
export function attributeKey(label: string) {
  const words = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
  const key = words.map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1))).join("");
  return /^[a-z]/.test(key) ? key : `attr${key}`;
}

export function attributeSummary(attributes: CategoryAttribute[]) {
  return attributes.length ? attributes.map((attribute) => attribute.label).join(" · ") : "";
}

export const SIZE_PRESET_VALUES: Record<SizePreset, string[]> = {
  clothing: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  "kids-shoes": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"],
  bra: ["32A", "32B", "32C", "34A", "34B", "34C", "34D", "36B", "36C", "36D", "38C", "38D", "40C", "40D"],
  general: ["One size", "Small", "Medium", "Large"],
};

/** A category as the pickers see it: flat, with its parent and own attributes. */
export interface CategoryOption {
  id: string;
  publicId?: string;
  name: string;
  isActive?: boolean;
  parentId?: string | null;
  childCount?: number;
  attributes?: CategoryAttribute[];
}

/** A leaf's attributes: its own, or its parent's when it defines none. */
export function resolveAttributes(category: CategoryOption | undefined, all: CategoryOption[]): CategoryAttribute[] {
  if (!category) return [];
  if (category.attributes?.length) return category.attributes;
  const parent = category.parentId ? all.find((item) => item.id === category.parentId) : undefined;
  return parent ? resolveAttributes(parent, all) : [];
}

/** Allowed values for an attribute: explicit options or its size preset. */
export function attributeOptions(attribute: CategoryAttribute): string[] | undefined {
  if (attribute.options?.length) return attribute.options;
  if (attribute.type === "size" && attribute.preset) return SIZE_PRESET_VALUES[attribute.preset];
  return undefined;
}
