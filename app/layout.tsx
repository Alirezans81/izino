import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { DirectionProvider } from "@/components/ui/direction";

const iranSans = localFont({
  src: "../public/fonts/IranSans.ttf",
  variable: "--font-persian",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ایزینو | پلتفرم رزرو سالن های زیبایی",
  description: "پلتفرم رزرو سالن های زیبایی",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn("h-full", "antialiased", iranSans.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <DirectionProvider>{children}</DirectionProvider>
      </body>
    </html>
  );
}
