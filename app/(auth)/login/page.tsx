import { redirect } from "next/navigation";

interface LegacyLoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LegacyLoginPage({
  searchParams,
}: LegacyLoginPageProps) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  redirect(
    next
      ? `/auth/login?next=${encodeURIComponent(next)}`
      : "/auth/login",
  );
}
