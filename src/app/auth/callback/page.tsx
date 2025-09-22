"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Signing in...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          setStatus("error");
          setMessage(errorDescription || error || "Authentication failed");
          setTimeout(() => {
            router.replace("/");
          }, 3000);
          return;
        }

        if (!code) {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            setStatus("success");
            setMessage("Already signed in! Redirecting...");
            setTimeout(() => {
              router.replace("/");
            }, 1000);
            return;
          }
          setStatus("error");
          setMessage("Please use a valid authentication link");
          setTimeout(() => {
            router.replace("/");
          }, 2000);
          return;
        }

        setMessage("Verifying authentication...");
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) throw exchangeError;

        if (!data.user) {
          throw new Error("No user data received");
        }

        setStatus("success");
        setMessage("Successfully signed in! Redirecting...");
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } catch (error: any) {
        setStatus("error");
        let errorMsg = "Authentication failed";
        if (error?.message) {
          if (error.message.includes("expired")) {
            errorMsg =
              "The authentication link has expired. Please try signing in again.";
          } else if (error.message.includes("invalid")) {
            errorMsg =
              "Invalid authentication link. Please try signing in again.";
          } else {
            errorMsg = error.message;
          }
        }
        setMessage(errorMsg);
        setTimeout(() => {
          router.replace("/");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <main className="min-h-[60vh] grid place-items-center">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
            </div>
            <div className="text-slate-600 text-sm" aria-live="polite">
              {message}
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div
              className="text-green-700 text-sm font-medium"
              aria-live="polite"
            >
              {message}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-red-700 text-sm" aria-live="polite">
              {message}
            </div>
            <div className="text-xs text-slate-500">
              Redirecting to home page...
            </div>
          </>
        )}
      </div>
    </main>
  );
}
