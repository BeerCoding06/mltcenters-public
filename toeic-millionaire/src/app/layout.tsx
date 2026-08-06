import type { Metadata } from "next";
import { Noto_Sans_Thai, Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/** Same stack as main MLTCENTERS site (`Poppins` + `Noto Sans Thai`). */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TOEIC เกมส์เศรษฐี | MLTCENTERS",
  description: "เกมตอบคำถามภาษาอังกฤษแบบกระดาน — ฝึก TOEIC แบบสนุก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${poppins.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
