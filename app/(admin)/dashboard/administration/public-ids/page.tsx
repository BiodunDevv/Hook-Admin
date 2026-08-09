"use client";

import { Hash } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/lib/query";

type Counter = { id: string; prefix: string; year: number; sequence: number; updatedAt: string };

export default function PublicIdsPage() {
  const query = useApiQuery<Counter[]>(["platform", "public-id-counters"], "/admin/public-id-counters");
  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Public ID counters"
        description="Inspect annual Hook ID sequences. Repairs require a reason and are audited through the API."
      />
      <Card className="rounded-lg shadow-none">
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="flex min-h-52 items-center justify-center"><HookLoader label="Loading counters" /></div>
          ) : !query.data?.length ? (
            <EmptyState icon={Hash} title="No counters initialized" description="Counters appear after the first record is created in each domain." />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Prefix</TableHead><TableHead>Year</TableHead><TableHead>Current sequence</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
              <TableBody>{query.data.map((counter) => (
                <TableRow key={counter.id}>
                  <TableCell className="font-medium">{counter.prefix}</TableCell>
                  <TableCell>{counter.year}</TableCell>
                  <TableCell>{counter.sequence.toLocaleString()}</TableCell>
                  <TableCell>{new Date(counter.updatedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
