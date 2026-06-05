import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/features/navigation/lib/appRoutes";

export default function ExtratorGlobalQueuePage() {
  redirect(`${APP_ROUTES.EXTRATOR_MANAGER}?aba=globalQueue`);
}
