"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminSession, useApiQuery } from "@/lib/query";

type Page<T> = { data: T[] };
type State = { id: string; publicId: string; name: string; status: string };
type Hub = { id: string; publicId: string; name: string; stateId: string; status: string };

const ALL_STATES = "all";

export function PlatformContextSelector() {
  const { data: user } = useAdminSession();
  const [stateId, setStateId] = useState(() =>
    typeof window === "undefined" ? ALL_STATES : localStorage.getItem("hook_admin_state_id") || ALL_STATES,
  );
  const [hubId, setHubId] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("hook_admin_hub_id") || "",
  );
  const states = useApiQuery<Page<State>>(["platform-context", "states"], "/admin/states?limit=100");
  const hubs = useApiQuery<Page<Hub>>(
    ["platform-context", "hubs", stateId],
    `/admin/hubs?limit=100${stateId && stateId !== ALL_STATES ? `&stateId=${stateId}` : ""}`,
    stateId !== ALL_STATES,
  );
  const visibleStates = useMemo(() => {
    const rows = states.data?.data || [];
    if (user?.scopeType === "global") return rows;
    const assignedStateIds = new Set((user?.assignedStateIds || []).map(String));
    return rows.filter((item) => assignedStateIds.has(String(item.id)) || assignedStateIds.has(String(item.publicId)));
  }, [states.data, user]);

  function changeState(value: string) {
    setStateId(value);
    setHubId("");
    if (value === ALL_STATES) {
      localStorage.removeItem("hook_admin_state_id");
    } else {
      localStorage.setItem("hook_admin_state_id", value);
    }
    localStorage.removeItem("hook_admin_hub_id");
    window.location.reload();
  }
  function changeHub(value: string) {
    setHubId(value);
    localStorage.setItem("hook_admin_hub_id", value);
    window.location.reload();
  }

  if (!user?.accountType || user.accountType !== "staff") return null;
  return <div className="hidden items-center gap-2 xl:flex">
    <Select value={stateId} onValueChange={changeState}>
      <SelectTrigger className="h-9 w-40" aria-label="Filter by operating state">
        <SelectValue placeholder="All states" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_STATES}>All states</SelectItem>
        {visibleStates.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
      </SelectContent>
    </Select>
    {(user.scopeType === "hub" || hubId) && stateId !== ALL_STATES && <Select value={hubId} onValueChange={changeHub}><SelectTrigger className="h-9 w-40"><SelectValue placeholder="Select Hub" /></SelectTrigger><SelectContent>{(hubs.data?.data || []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>}
  </div>;
}
