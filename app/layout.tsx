import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { DirectionProvider } from "@/components/ui/direction";

const Vazir = localFont({
  src: "../public/fonts/Vazir.woff",
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
      className={cn("h-full", "antialiased", Vazir.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <DirectionProvider>
          <div>{children}</div>
        </DirectionProvider>
      </body>
    </html>
  );
}
