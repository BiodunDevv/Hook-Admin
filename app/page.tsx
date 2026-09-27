import { redirect } from "next/navigation";

export default function Home() {
  // Redirects through /launch to route by role and show a real maintenance screen if the backend is down.
  redirect("/launch");
}
 