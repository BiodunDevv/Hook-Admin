// Row shape shared by the product list; the table UI itself moved to ProductGrid.tsx.
export interface ProductRow {
  id: string;
  hookId?: string;
  title: string;
  category?: { name?: string; parentName?: string | null };
  marketName?: string | null;
  discountedPrice?: number;
  orderCount?: number;
  viewCount?: number;
  updatedAt?: string;
  vendor?: { businessName?: string };
  images?: string[];
  sellingPrice?: number;
  quantity?: number;
  status: string;
  createdAt?: string;
  managers?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string | null;
    role: string;
  }>;
}
