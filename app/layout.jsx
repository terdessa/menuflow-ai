import "./globals.css";

export const metadata = {
  title: "MenuFlow AI",
  description: "Scan restaurant menus, apply dietary filters, and generate dish visuals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
