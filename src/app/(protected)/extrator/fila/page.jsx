import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/shared/config/routes";

export const metadata = {
  title: "Fila do Extrator | Logimarui",
};

export default function ExtratorGlobalQueueRoutePage() {
  redirect(`${APP_ROUTES.EXTRATOR_MANAGER}?aba=globalQueue`);
}
