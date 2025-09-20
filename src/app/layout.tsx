import "./globals.css";
import TopBar from "@/components/TopBar";
import GlobalLocaleSwitcher from "@/components/GlobalLocaleSwitcher";
import { LocaleProvider, Mode } from "@/lib/localePref";
import { cookies } from "next/headers";
import { ScrapProvider } from "@/contexts/ScrapContext";

export const metadata = { title: "GOVNEWS" };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const raw = jar.get("localeMode")?.value || "en";
  const initialMode: Mode = raw === "ko" ? "ko" : "en";

  return (
    <html lang="en">
      <body>
        <LocaleProvider initialMode={initialMode}>
          <ScrapProvider>
            <TopBar />
            {children}
            <GlobalLocaleSwitcher />
          </ScrapProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
