import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/constants/auth";

export default function Home() {
  redirect(AUTH_ROUTES.LOGIN);
}
