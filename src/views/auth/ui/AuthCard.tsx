import { useAuthFormStore } from "@/features/auth/store/useAuthFormStore";
import { Card, CardContent, CardFooter } from "@/shared/ui/card";
import { Eyebrow } from "@/shared/ui/typography";

type AuthCardProps = {
  children: React.ReactNode;
};

export default function AuthCard({ children }: AuthCardProps) {
  const footer = useAuthFormStore((state) => state.content?.footer ?? "");

  return (
    <main className="h-dvh overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <CardContent className="w-full max-w-[540px]">
          {children}
        <CardFooter className="text-center justify-center">
          <Eyebrow className="text-slate-500" >{footer}</Eyebrow>
        </CardFooter>
        </CardContent>
      </div>
    </main>
  );
}
