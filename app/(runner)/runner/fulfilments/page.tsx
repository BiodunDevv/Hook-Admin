"use client";

import { Clock3, PackageCheck } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileEmpty, MobileHeader, MobileRow, MobileSection } from "@/components/mobile/MobileUI";
import { useApiQuery } from "@/lib/query";

type Row = {
  id?: string;
  publicId?: string;
  status?: string;
  marketId?: string;
  orderId?: string;
  acceptanceDueAt?: string;
};
type RunnerTasks = { data: Row[]; total: number };

function dueLabel(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return date < new Date() ? "Acceptance overdue" : `Accept by ${date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function RunnerFulfilmentsPage() {
  const query = useApiQuery<RunnerTasks>(["runner", "fulfilments"], "/runner/fulfilments?limit=100");
  const rows = query.data?.data || [];

  if (query.isLoading)
    return (
      <div className="grid min-h-80 place-items-center">
        <HookLoader label="Loading assigned fulfilments" />
      </div>
    );

  const urgent = rows.filter((row) => row.status === "ALERTED" || row.status === "BLOCKED");
  const active = rows.filter((row) => !urgent.includes(row));

  return (
    <div>
      <MobileHeader
        title="Orders"
        subtitle="Accept, source, pack, and hand over your assigned tasks."
        action={
          rows.length ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#8F8F8F]">
              {query.data?.total || rows.length}
            </span>
          ) : undefined
        }
      />

      {!rows.length ? (
        <MobileEmpty
          icon={PackageCheck}
          title="No tasks assigned"
          description="New orders from your assigned markets will appear here."
        />
      ) : (
        <>
          {urgent.length > 0 && (
            <MobileSection title="Needs your action">
              {urgent.map((task) => (
                <TaskRow key={task.publicId || task.id} task={task} urgent />
              ))}
            </MobileSection>
          )}
          {active.length > 0 && (
            <MobileSection title="In progress">
              {active.map((task) => (
                <TaskRow key={task.publicId || task.id} task={task} />
              ))}
            </MobileSection>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, urgent }: { task: Row; urgent?: boolean }) {
  const due = dueLabel(task.acceptanceDueAt);
  return (
    <MobileRow
      icon={urgent ? Clock3 : PackageCheck}
      tone={urgent ? "brand" : "neutral"}
      label={task.publicId || task.id || "Task"}
      description={due ? `Order ${task.orderId || "-"} · ${due}` : `Order ${task.orderId || "-"}`}
      href={`/runner/fulfilments/${task.publicId || task.id}`}
      value={<StatusBadge status={task.status || "PENDING"} />}
    />
  );
}
