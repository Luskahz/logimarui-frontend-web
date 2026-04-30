import "./globals.css";
import Script from "next/script";
import { buildUiThemeInitScript } from "@/features/ui/lib/uiTheme";

export const metadata = {
  title: {
    default: "Logimarui",
    template: "%s | Logimarui",
  },
  description: "Frontend web da Logimarui.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Script id="logimarui-ui-theme" strategy="beforeInteractive">
          {buildUiThemeInitScript()}
        </Script>
        {children}
      </body>
    </html>
  );
}
