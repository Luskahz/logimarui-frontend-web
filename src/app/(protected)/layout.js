import ProtectedAppShell from "@/app/(protected)/ProtectedAppShell";

export default function ProtectedLayout({ children }) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
