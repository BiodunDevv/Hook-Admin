import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, Tag, AlertCircle, Check, Edit2 } from "lucide-react";

export interface QAItem {
  id: number;
  category: string;
  title: string;
  time: string;
  location: string;
  agent: string;
  costPrice: string;
  markup: string;
  sellingPrice: string;
  details: string;
  image: string;
  flagged: boolean;
  alertMsg?: string;
}

interface AgentReviewCardProps {
  item: QAItem;
}

export function AgentReviewCard({ item }: AgentReviewCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border-zinc-200 shadow-sm">
      {/* Image Section */}
      <div className="relative h-48 bg-zinc-100">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
          <Tag size={12} className="text-brand-gold" />
          <span className="text-xs font-semibold text-zinc-700">{item.category}</span>
        </div>
        {item.flagged && (
          <Badge className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-red-500 px-2.5 py-1 text-white shadow-sm">
            <AlertCircle size={12} />
            Flagged
          </Badge>
        )}
      </div>

      {/* Content Section */}
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="pr-2 text-base font-bold leading-tight text-zinc-900">{item.title}</h3>
          <span className="whitespace-nowrap pt-1 text-[11px] text-zinc-400">{item.time}</span>
        </div>

        <div className="mb-4 flex items-center gap-1 text-[13px] text-zinc-500">
          <MapPin size={12} />
          <span>{item.location}</span>
          <span className="mx-0.5">•</span>
          <span>{item.agent}</span>
        </div>

        {item.flagged && item.alertMsg && (
          <Alert className="mb-4 border-red-100 bg-red-50">
            <AlertCircle size={14} className="text-red-500" />
            <AlertDescription className="text-xs font-medium leading-relaxed text-red-600">
              {item.alertMsg}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 mt-auto space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-zinc-500">Market Cost Price</span>
            <span className="font-semibold text-zinc-900">{item.costPrice}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-zinc-500">Hook Mark-up</span>
            <span className="font-semibold text-emerald-500">{item.markup}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
            <span className="font-bold text-zinc-900">Selling Price</span>
            <span className="text-base font-bold text-zinc-900">{item.sellingPrice}</span>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
          <p className="text-center text-[12px] font-medium text-zinc-500">{item.details}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex flex-1 items-center justify-center gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600">
            <Check size={16} /> Approve Listing
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-1.5 px-4">
            <Edit2 size={14} /> Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
