"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiPost } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";
import { StateDropdown } from "@/components/operations/StateDropdown";

export default function NewDriverPage() {
  const router = useRouter();
  const [stateCode, setStateCode] = useState("LA");
  const createDriver = useApiPost<{ id: string }, Record<string, unknown>>("/admin/dispatch/drivers", ["admin", "drivers"], { successMessage: "Driver created" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const driver = await createDriver.mutateAsync({ ...payload, isActive: true });
    router.push(`/dashboard/drivers/${driver.id}`);
  }

  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title="Add Driver" description="Create an EV driver account." actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      <form onSubmit={submit}>
        <Card className="max-w-3xl rounded-lg shadow-none">
          <CardContent className="grid gap-4 p-4 md:grid-cols-2">
            {[
              ["firstName", "First Name", "text"],
              ["lastName", "Last Name", "text"],
              ["email", "Email", "email"],
              ["phone", "Phone", "tel"],
              ["password", "Temporary Password", "password"],
            ].map(([name, label, type]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} name={name} type={type} required={name !== "phone"} defaultValue={name === "password" ? "123456" : ""} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Operating state</Label>
              <input type="hidden" name="stateCode" value={stateCode} />
              <StateDropdown mode="form" value={stateCode} onChange={setStateCode} className="h-9 w-full justify-between gap-2 text-zinc-700" />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" variant="brand" disabled={createDriver.isPending}>
                {createDriver.isPending ? <HookLoader size="button" label="Creating..." /> : "Create Driver"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
