import "./globals.css";
import TopBar from "@/components/TopBar";
import GlobalLocaleSwitcher from "@/components/GlobalLocaleSwitcher";
import { LocaleProvider, Mode } from "@/lib/localePref";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabaseServer";
import { ScrapProvider } from "@/contexts/ScrapContext";
import Onboarding from "@/components/Onboarding";

export const metadata = { title: "GOVNEWS" };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const raw = jar.get("localeMode")?.value || "en";
  const initialMode: Mode = raw === "ko" ? "ko" : "en";

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body data-uid={user?.id ?? ""}>
        <LocaleProvider initialMode={initialMode}>
          <ScrapProvider>
            <TopBar />
            {children}
            <GlobalLocaleSwitcher />
            <Onboarding />
          </ScrapProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
