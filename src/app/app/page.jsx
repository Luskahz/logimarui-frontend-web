import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/features/navigation/lib/appRoutes";

export default function AppRootPage() {
  redirect(APP_ROUTES.HOME);
}
