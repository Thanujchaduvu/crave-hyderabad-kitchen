
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CRAVE — Hyderabadi Kitchen",
    template: "%s | CRAVE Hyderabadi Kitchen",
  },

  description:
    "Experience authentic Hyderabadi dum biryani, delicious meals, catering and more. Freshly prepared with love at CRAVE.",

  keywords: [
    "CRAVE",
    "Hyderabadi Kitchen",
    "Hyderabadi Biryani",
    "Food Delivery",
    "Online Food Ordering",
    "Catering Hyderabad",
  ],

  applicationName: "CRAVE",

  openGraph: {
    title: "CRAVE — Hyderabadi Kitchen",
    description: "Layers of flavour. Made to be shared.",
    type: "website",
    locale: "en_IN",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

