"use client";

import { useEffect, useState } from "react";
import type { SelectedCustomer } from "@/components/partner/ShoppingForBanner";

export const SELECTED_CUSTOMER_KEY = "hook_partner_selected_customer";

/** Reads the Partner's currently-assisted customer from localStorage. */
export function useSelectedCustomer() {
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null);

  useEffect(() => {
    const read = () => {
      const raw = localStorage.getItem(SELECTED_CUSTOMER_KEY);
      if (!raw) {
        setCustomer(null);
        return;
      }
      try {
        setCustomer(JSON.parse(raw) as SelectedCustomer);
      } catch {
        localStorage.removeItem(SELECTED_CUSTOMER_KEY);
        setCustomer(null);
      }
    };
    // Deferred so the initial render matches the server (no localStorage there).
    const timer = window.setTimeout(read, 0);
    // Other tabs/components changing the selection (e.g. "Change" in the banner)
    // dispatch this so every mounted reader — including the header — stays in sync.
    window.addEventListener("hook-partner-customer-changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hook-partner-customer-changed", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  function select(customer: SelectedCustomer) {
    localStorage.setItem(SELECTED_CUSTOMER_KEY, JSON.stringify(customer));
    setCustomer(customer);
    window.dispatchEvent(new Event("hook-partner-customer-changed"));
  }

  function clear() {
    localStorage.removeItem(SELECTED_CUSTOMER_KEY);
    setCustomer(null);
    window.dispatchEvent(new Event("hook-partner-customer-changed"));
  }

  return { customer, select, clear };
}
