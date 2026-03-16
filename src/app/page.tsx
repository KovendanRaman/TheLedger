import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";

export default async function HomePage() {
  const session = await auth();
  redirect(session ? "/dashboard" : "/login");
}
