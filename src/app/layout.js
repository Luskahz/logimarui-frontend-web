import "./globals.css";

export const metadata = {
  title: {
    default: "Logimarui Auth",
    template: "%s | Logimarui Auth",
  },
  description: "Base inicial das rotas de autenticacao da Logimarui.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
