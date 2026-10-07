"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { LoaderCircle, LogIn, LogOut, UserRound, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthControl() {
  const [user, setUser] = useState<User | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (dialogOpen) dialogRef.current?.scrollTo(0, 0);
  }, [dialogOpen, mode]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured. Add the Project URL and publishable key from Supabase → Project Settings → API Keys to .env.local, then restart the app.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setDialogOpen(false);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: String(formData.get("full_name") ?? "").trim(),
              campus_area: String(formData.get("campus_area") ?? "").trim(),
              whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
            },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          setDialogOpen(false);
        } else {
          setFeedback("Account started. Check your email to confirm, then sign in.");
        }
      }
    } catch (authError) {
      setError(
        authError instanceof TypeError
          ? "Could not reach Supabase. Check the project URL and your internet connection, then try again."
          : authError instanceof Error
            ? authError.message
            : "Authentication failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
  }

  return (
    <>
      {user ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-36 truncate text-xs font-semibold text-[#1d2e29] sm:block">{user.email}</span>
          <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid h-10 w-10 place-items-center border border-[#d9b36b] text-[#0f564a] hover:bg-[#f2e6cf]"><LogOut aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => { setDialogOpen(true); setError(""); setFeedback(""); }} aria-label="Sign in" className="inline-flex min-h-10 items-center gap-0 px-1 text-xs font-semibold text-[#1d2e29] hover:text-[#0f564a] sm:gap-2 sm:px-0 sm:text-sm">
          <UserRound aria-hidden="true" className="h-4 w-4" /><span className="hidden min-[400px]:inline">Sign in</span>
        </button>
      )}

      {dialogOpen && mounted && createPortal(
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }} className="fixed inset-0 z-50 flex items-end justify-center bg-[#17231b]/55 p-0 sm:items-center sm:p-5">
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-heading" className="max-h-[90dvh] w-full max-w-md overflow-y-auto bg-[#fffdf7] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d9b36b]">COLLEGE MRKT</p>
                <h2 id="auth-heading" className="mt-2 font-serif text-2xl text-[#24342a]">{mode === "sign-in" ? "Welcome back." : "Join your campus market."}</h2>
              </div>
              <button type="button" onClick={() => setDialogOpen(false)} aria-label="Close sign-in dialog" className="grid h-9 w-9 place-items-center text-[#626a60] hover:bg-[#efefe8]"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>

            {error && <p role="alert" className="mt-4 border border-[#e7b7aa] bg-[#fff0eb] px-3 py-2.5 text-sm leading-5 text-[#873e2d]">{error}</p>}
            {feedback && <p role="status" className="mt-4 border border-[#a8c3a8] bg-[#edf5eb] px-3 py-2.5 text-sm leading-5 text-[#294d34]">{feedback}</p>}

            <form onSubmit={submitAuth} className="mt-5 space-y-4">
              {mode === "sign-up" && (
                <>
                  <div><label htmlFor="full_name" className="mb-1.5 block text-xs font-semibold text-[#354239]">Your name</label><input id="full_name" name="full_name" required maxLength={80} autoComplete="name" className="form-control" /></div>
                  <div><label htmlFor="whatsapp_number" className="mb-1.5 block text-xs font-semibold text-[#354239]">WhatsApp number</label><input id="whatsapp_number" name="whatsapp_number" required type="tel" autoComplete="tel" placeholder="024 123 4567" className="form-control" /></div>
                  <div><label htmlFor="campus_area" className="mb-1.5 block text-xs font-semibold text-[#354239]">Campus area <span className="font-normal text-[#7d837b]">(optional)</span></label><input id="campus_area" name="campus_area" maxLength={100} placeholder="e.g. ATU campus" className="form-control" /></div>
                </>
              )}
              <div><label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-[#354239]">Email</label><input id="auth-email" name="email" required type="email" autoComplete="email" className="form-control" /></div>
              <div><label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-[#354239]">Password</label><input id="auth-password" name="password" required type="password" minLength={8} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="form-control" /></div>
              <button type="submit" disabled={isSubmitting} className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#0f564a] px-4 text-sm font-bold text-white hover:bg-[#0b433b] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogIn aria-hidden="true" className="h-4 w-4" />}
                {isSubmitting ? "Please wait" : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>
            <p className="mt-5 border-t border-[#e2e3dc] pt-4 text-center text-xs text-[#6e766d]">
              {mode === "sign-in" ? "New to the campus market?" : "Already have an account?"}{" "}
              <button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); setFeedback(""); }} className="font-bold text-[#0f564a] underline underline-offset-2">
                {mode === "sign-in" ? "Create account" : "Sign in"}
              </button>
            </p>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
