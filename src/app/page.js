import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/features/navigation/lib/appRoutes";

export default function HomePage() {
  redirect(APP_ROUTES.HOME);
}
