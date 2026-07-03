import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MoreVertical, type LucideIcon } from "lucide-react";

interface HardwareItem {
  icon: LucideIcon;
  color: string;
}

export interface BoothData {
  id: string;
  name: string;
  bgImage: string;
  statusColor: string;
  statusBg: string;
  walkIns: number;
  revenue: string;
  waiting: number;
  waitingColor: string;
  waitingAlert?: boolean;
  attendantImg?: string;
  attendantInitials?: string;
  attendantName: string;
  hardware: HardwareItem[];
  reconStatus: string;
  reconColor: string;
  expected: string;
  actual: string;
}

interface BoothCardProps {
  booth: BoothData;
}

export function BoothCard({ booth }: BoothCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border-zinc-200 shadow-sm">
      {/* Card Header Background */}
      <div className="relative flex h-24 flex-col justify-end p-4">
        <img
          src={booth.bgImage}
          alt={booth.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <h3 className="mb-1.5 text-lg font-bold leading-tight text-white">{booth.name}</h3>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-sm ${booth.statusBg}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${booth.statusColor}`} />
              {booth.id}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
          >
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4 border-b border-zinc-100 p-5 text-center">
        <div>
          <h4 className="text-2xl font-bold text-zinc-900">{booth.walkIns}</h4>
          <p className="mt-0.5 text-xs text-zinc-500">Walk-ins</p>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-zinc-900">{booth.revenue}</h4>
          <p className="mt-0.5 text-xs text-zinc-500">Revenue</p>
        </div>
        <div className="relative">
          <h4 className={`text-2xl font-bold ${booth.waitingColor}`}>{booth.waiting}</h4>
          <p className="mt-0.5 text-xs text-zinc-500">Waiting</p>
          {booth.waitingAlert && (
            <div className="absolute right-3 top-1 h-2 w-2 rounded-full border border-white bg-red-500" />
          )}
        </div>
      </div>

      {/* Staff & Hardware */}
      <CardContent className="flex gap-4 border-b border-zinc-100 p-5">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-zinc-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-bold text-zinc-500">
            {booth.attendantImg ? (
              <img src={booth.attendantImg} alt="Attendant" className="h-full w-full object-cover" />
            ) : (
              booth.attendantInitials
            )}
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Attendant on Duty</p>
            <p className="text-sm font-semibold leading-tight text-zinc-900">{booth.attendantName}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center rounded-xl bg-zinc-50 p-3">
          <div className="w-full text-center">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Hardware Health</p>
            <div className="flex justify-center gap-3">
              {booth.hardware.map((hw, i) => (
                <hw.icon key={i} size={16} className={hw.color} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Reconciliation */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <DollarSign size={16} className="text-zinc-400" />
            Cash Reconciliation
          </div>
          <Badge className={`rounded px-2.5 py-0.5 text-[11px] font-bold ${booth.reconColor}`}>
            {booth.reconStatus}
          </Badge>
        </div>
        <div className="flex divide-x divide-zinc-200 rounded-lg bg-zinc-50 p-3">
          <div className="flex flex-1 items-center justify-between pr-4">
            <span className="text-xs text-zinc-500">Expected</span>
            <span className="text-sm font-bold text-zinc-900">{booth.expected}</span>
          </div>
          <div className="flex flex-1 items-center justify-between pl-4">
            <span className="text-xs text-zinc-500">Actual Drawer</span>
            <span className="text-sm font-bold text-zinc-900">{booth.actual}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
