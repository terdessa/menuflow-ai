import "./globals.css";

export const metadata = {
  title: "MenuFlow AI",
  description: "Scan restaurant menus, apply allergen filters, and generate dish visuals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
