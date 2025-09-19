import "./globals.css";
import TopBar from "@/components/TopBar";
import GlobalLocaleSwitcher from "@/components/GlobalLocaleSwitcher";
import { LocaleProvider, Mode } from "@/lib/localePref";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabaseServer";
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

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialScraps: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("scraps")
      .select("article_id")
      .eq("user_id", user.id);
    initialScraps = (data ?? []).map((r: any) => r.article_id);
  }

  return (
    <html lang="en">
      <body>
        <LocaleProvider initialMode={initialMode}>
          <ScrapProvider
            initialUserId={user?.id ?? null}
            initialScraps={initialScraps}
          >
            <TopBar />
            {children}
            <GlobalLocaleSwitcher />
          </ScrapProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
