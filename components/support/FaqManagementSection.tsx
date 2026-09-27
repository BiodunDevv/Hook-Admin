"use client";

import { useState } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { QueryState } from "@/components/shared/QueryState";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { cleanError } from "@/lib/admin-utils";
import { useApiQuery } from "@/lib/query";

interface FaqRecord {
  publicId: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

const EMPTY_FORM = { question: "", answer: "" };

export function FaqManagementSection() {
  const query = useApiQuery<{ data: FaqRecord[] }>(["admin", "faqs"], "/admin/faqs");
  const faqs = query.data?.data || [];
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function create() {
    if (form.question.trim().length < 3 || form.answer.trim().length < 3) return toast.error("Add a question and an answer");
    setSaving(true);
    try {
      await apiPost("/admin/faqs", { question: form.question.trim(), answer: form.answer.trim() });
      toast.success("FAQ added");
      setForm(EMPTY_FORM);
      setCreateOpen(false);
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error) || "Could not add this FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(faq: FaqRecord) {
    try {
      await apiPatch(`/admin/faqs/${faq.publicId}`, { isActive: !faq.isActive });
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error) || "Could not update this FAQ");
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/admin/faqs/${deleteTarget.publicId}`);
      toast.success("FAQ removed");
      setDeleteTarget(null);
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error) || "Could not remove this FAQ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-none">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Frequently asked questions</CardTitle>
        <p className="mt-0.5 text-sm text-muted-foreground">Shown on /help for customers, Market Associates, and Hook Partners.</p>
        <PermissionGuard permission="faq.manage">
          <CardAction><Button size="sm" onClick={() => setCreateOpen(true)}><Plus /> Add FAQ</Button></CardAction>
        </PermissionGuard>
      </CardHeader>
      <CardContent className="p-0">
        <QueryState
          loading={query.isLoading}
          error={query.error}
          empty={!query.isLoading && !query.isError && !faqs.length}
          loadingLabel="Loading FAQs…"
          errorTitle="FAQs could not be loaded"
          emptyTitle="No FAQs yet"
          emptyDescription="Add the first question customers ask most."
          emptyIcon={HelpCircle}
          onRetry={() => query.refetch()}
        >
          <div>
            {faqs.map((faq) => (
              <div key={faq.publicId} className="flex items-start gap-3 border-b p-4 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{faq.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
                <PermissionGuard permission="faq.manage">
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch checked={faq.isActive} onCheckedChange={() => void toggleActive(faq)} aria-label={faq.isActive ? "Hide from /help" : "Show on /help"} />
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete "${faq.question}"`} onClick={() => setDeleteTarget(faq)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </PermissionGuard>
              </div>
            ))}
          </div>
        </QueryState>
      </CardContent>

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open && !saving) { setCreateOpen(false); setForm(EMPTY_FORM); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a frequently asked question</DialogTitle>
            <DialogDescription>Appears on /help immediately, right after saving.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="faq-question">Question</Label><Input id="faq-question" value={form.question} onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} placeholder="Where is my order?" /></div>
            <div className="space-y-1.5"><Label htmlFor="faq-answer">Answer</Label><Textarea id="faq-answer" value={form.answer} onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))} placeholder="Open Orders in the Hook app..." rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="brand" onClick={() => void create()} disabled={saving}>{saving ? "Adding..." : "Add FAQ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget ? `"${deleteTarget.question}" will no longer show on /help.` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void remove(); }} disabled={deleting}>{deleting ? "Removing..." : "Remove"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
