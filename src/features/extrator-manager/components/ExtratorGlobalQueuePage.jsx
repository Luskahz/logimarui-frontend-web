import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/app/_config/routes";

export default function ExtratorGlobalQueuePage() {
  redirect(`${APP_ROUTES.EXTRATOR_MANAGER}?aba=globalQueue`);
}
