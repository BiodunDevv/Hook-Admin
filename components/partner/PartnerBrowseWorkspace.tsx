"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, ShoppingBag, Store, X } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileEmpty } from "@/components/mobile/MobileUI";
import { ProductCard, ProductImage } from "@/components/mobile/MobileCommerce";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useApiQuery } from "@/lib/query";
import { PartnerProductSheet } from "@/components/partner/PartnerProductSheet";
import { ShoppingForBanner, type SelectedCustomer } from "@/components/partner/ShoppingForBanner";

type Category = { publicId: string; name: string; slug?: string; iconUrl?: string | null };
type Market = { publicId: string; name: string; shortDisplayName?: string; imageUrl?: string | null };
type CatalogProduct = {
  publicId?: string;
  id?: string;
  title?: string;
  media?: Array<{ url?: string; alt?: string }>;
  market?: { name?: string };
  effectivePriceMinor?: number;
  sellingPriceMinor?: number;
  discountMinor?: number;
  negotiationAvailable?: boolean;
  isPurchasable?: boolean;
};
type DiscoverResponse = { categories: Category[]; products: CatalogProduct[]; resultCount: number };

const ALL_CATEGORY: Category = { publicId: "all", name: "All" };

/** Mirrors Hook-App's DiscoverScreen: a market picker + category strip + search. */
export function PartnerBrowseWorkspace({
  customer,
  onClearCustomer,
  basketCount,
}: {
  customer: SelectedCustomer | null;
  onClearCustomer: () => void;
  basketCount: number;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [marketId, setMarketId] = useState("all");
  const [marketSheetOpen, setMarketSheetOpen] = useState(false);
  const [openProductId, setOpenProductId] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  const markets = useApiQuery<Market[]>(["public", "markets"], "/public/markets");
  const marketRows = markets.data || [];
  const selectedMarket = marketRows.find((market) => market.publicId === marketId);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "30" });
    if (marketId !== "all") params.set("marketId", marketId);
    if (categoryId !== "all") params.set("categoryId", categoryId);
    if (debouncedSearch) params.set("q", debouncedSearch);
    return params.toString();
  }, [marketId, categoryId, debouncedSearch]);

  const discover = useApiQuery<DiscoverResponse>(
    ["partner", "discover", query],
    `/public/discover?${query}`,
  );
  const categoryRows = [ALL_CATEGORY, ...(discover.data?.categories || [])];
  const products = discover.data?.products || [];

  return (
    <div>
      {/* Yellow hero, mirroring the native Discover header. */}
      <div className="relative -mx-5 -mt-2 mb-5 rounded-b-[24px] bg-[#FFD93E] px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => setMarketSheetOpen(true)}
          className="flex flex-col items-start"
        >
          <span className="text-[12px] font-semibold text-black/65">Choose Market</span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="max-w-[220px] truncate text-[16px] font-bold text-black">
              {selectedMarket?.name || "All markets"}
            </span>
            <ChevronDown size={15} className="text-black" />
          </span>
        </button>

        <h1 className="mt-3 text-[28px] font-black leading-tight text-black">Browse Hook</h1>

        <div className="mt-4 flex h-13 items-center gap-2 rounded-[16px] bg-white px-4">
          <Search size={18} className="shrink-0 text-black/60" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="What are you looking for"
            className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-black/40"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={16} className="text-black/40" />
            </button>
          )}
        </div>
      </div>

      <ShoppingForBanner customer={customer} basketCount={basketCount} onClear={onClearCustomer} />

      {/* Category strip */}
      <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
        {categoryRows.map((category) => {
          const selected = category.publicId === categoryId;
          return (
            <button
              key={category.publicId}
              type="button"
              onClick={() => setCategoryId(category.publicId)}
              className="flex w-[62px] shrink-0 flex-col items-center"
            >
              <span
                className={`grid size-13 place-items-center overflow-hidden rounded-full border-[#FFC809] ${selected ? "border-[5px] bg-[#FFF4C7]" : "border-[3px] bg-white"}`}
              >
                {category.publicId === "all" ? (
                  <Store size={20} className="text-black/70" />
                ) : (
                  <ProductImage src={category.iconUrl || undefined} className="size-full" rounded="rounded-none" sizes="52px" />
                )}
              </span>
              <span className="mt-1.5 truncate text-[11px] font-semibold text-black">{category.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-[18px] font-black text-black">Explore</p>
        <p className="text-[12px] text-[#8F8F8F]">{discover.data?.resultCount ?? products.length} products</p>
      </div>

      {discover.isLoading ? (
        <div className="grid min-h-40 place-items-center">
          <HookLoader label="Finding products" />
        </div>
      ) : discover.isError ? (
        <MobileEmpty icon={ShoppingBag} title="Could not load products" description="Try again in a moment." />
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
          {products.map((product) => {
            const id = String(product.publicId || product.id || "");
            return (
              <ProductCard
                key={id}
                title={String(product.title || "Product")}
                imageUrl={product.media?.[0]?.url}
                effectivePriceMinor={product.effectivePriceMinor}
                sellingPriceMinor={product.sellingPriceMinor}
                discountMinor={product.discountMinor}
                marketName={product.market?.name}
                unavailable={product.isPurchasable === false}
                negotiable={product.negotiationAvailable}
                // Adding always opens the product sheet — every product now
                // has at least one variant, and the partner must see and pick
                // a size/colour there before it can be added to the cart.
                onAdd={() => setOpenProductId(id)}
                onOpen={() => setOpenProductId(id)}
              />
            );
          })}
        </div>
      ) : (
        <MobileEmpty
          icon={Search}
          title="No matching products"
          description="Try another search, category, or market."
        />
      )}

      <Sheet open={marketSheetOpen} onOpenChange={setMarketSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[80vh] w-full max-w-2xl flex-col rounded-t-2xl border-x bg-[#F5F5F5] p-0"
        >
          <SheetHeader className="shrink-0 px-5 pb-3 pt-5">
            <SheetTitle className="text-[19px] font-bold">Choose a market</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <button
              type="button"
              onClick={() => {
                setMarketId("all");
                setMarketSheetOpen(false);
              }}
              className={`mb-2 flex w-full items-center gap-3 rounded-[10px] p-3 text-left ${marketId === "all" ? "bg-white ring-2 ring-black" : "bg-white"}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#EAEBE7]">
                <Store size={18} />
              </span>
              <span className="text-[14px] font-semibold">All markets</span>
            </button>
            {marketRows.map((market) => (
              <button
                key={market.publicId}
                type="button"
                onClick={() => {
                  setMarketId(market.publicId);
                  setMarketSheetOpen(false);
                }}
                className={`mb-2 flex w-full items-center gap-3 rounded-[10px] p-3 text-left ${marketId === market.publicId ? "bg-white ring-2 ring-black" : "bg-white"}`}
              >
                <ProductImage src={market.imageUrl || undefined} className="size-11 shrink-0" rounded="rounded-full" sizes="44px" />
                <span className="truncate text-[14px] font-semibold">{market.name}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <PartnerProductSheet
        key={openProductId || "product-closed"}
        productId={openProductId}
        customerId={customer?.publicId}
        open={Boolean(openProductId)}
        onClose={() => setOpenProductId(undefined)}
      />
    </div>
  );
}
