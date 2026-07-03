import { FileText, FileSpreadsheet } from "lucide-react";

export interface Report {
  id: number;
  title: string;
  date: string;
  author: string;
  size: string;
  type: "pdf" | "sheet";
  iconColor: string;
  iconBg: string;
}

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <div className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-zinc-50">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${report.iconBg} ${report.iconColor}`}>
          {report.type === "pdf" ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
        </div>
        <div>
          <h4 className="mb-0.5 text-sm font-semibold leading-tight text-zinc-900">{report.title}</h4>
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span>{report.date}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>{report.author}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>{report.size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
