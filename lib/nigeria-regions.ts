/** Delivery regions used to price and group Nigerian States. */
export type DeliveryRegion = "north" | "south" | "east" | "west";

export const REGION_LABEL: Record<DeliveryRegion, string> = { north: "North", south: "South", east: "East", west: "West" };
/** Default customer delivery price per region, in kobo. */
export const REGION_DEFAULT_FEE_MINOR: Record<DeliveryRegion, number> = { north: 400_000, south: 300_000, east: 350_000, west: 350_000 };

const REGION_STATES: Record<DeliveryRegion, string[]> = {
  north: ["adamawa", "bauchi", "benue", "borno", "fct", "federalcapitalterritory", "abuja", "gombe", "jigawa", "kaduna", "kano", "katsina", "kebbi", "kogi", "kwara", "nasarawa", "niger", "plateau", "sokoto", "taraba", "yobe", "zamfara"],
  south: ["akwaibom", "bayelsa", "crossriver", "delta", "edo", "rivers"],
  east: ["abia", "anambra", "ebonyi", "enugu", "imo"],
  west: ["ekiti", "lagos", "ogun", "ondo", "osun", "oyo"],
};

const normalise = (value: string) => value.toLowerCase().replace(/\bstate\b/g, "").replace(/[^a-z]/g, "");

export function regionOf(stateName: string): DeliveryRegion | undefined {
  const key = normalise(stateName);
  return (Object.keys(REGION_STATES) as DeliveryRegion[]).find((region) => REGION_STATES[region].includes(key));
}
