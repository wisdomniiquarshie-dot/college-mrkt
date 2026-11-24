"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Eye, EyeOff, LoaderCircle, LogIn, LogOut, UserRound, X } from "lucide-react";
import { ACCOUNT_TYPES } from "@/lib/marketplace";
import { getSupabaseBrowserClient, getSupabaseErrorMessage } from "@/lib/supabase/client";
import { isMissingContactVisibilityColumn } from "@/lib/supabase/schema-compat";

export function AuthControl() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "forgot-password" | "reset-password">("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [contactPublic, setContactPublic] = useState<boolean | null>(null);
  const [contactNotice, setContactNotice] = useState("");
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setContactPublic(null);
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset-password");
        setDialogOpen(true);
        setError("");
        setFeedback("");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;

    let isCurrent = true;
    supabase
      .from("seller_profiles")
      .select("is_contact_public")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (isMissingContactVisibilityColumn(error)) {
          setContactPublic(null);
          return;
        }
        if (error) {
          setContactNotice(getSupabaseErrorMessage(error, "Could not load contact visibility."));
          return;
        }
        setContactPublic(data?.is_contact_public ?? false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

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
      } else if (mode === "sign-up") {
        const selectedType = String(formData.get("account_type") ?? "");
        const accountType = ACCOUNT_TYPES.find(({ value }) => value === selectedType)?.value;
        if (!accountType) throw new Error("Choose an account type to continue.");
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: String(formData.get("full_name") ?? "").trim(),
              campus_area: String(formData.get("campus_area") ?? "").trim(),
              is_contact_public: formData.get("is_contact_public") === "on",
              whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
              account_type: accountType,
            },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          setDialogOpen(false);
        } else {
          setFeedback("Account started. Check your email to confirm, then sign in.");
        }
      } else if (mode === "forgot-password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setFeedback("If an account exists for that email, a password reset link will be sent.");
      } else {
        const confirmation = String(formData.get("password_confirmation") ?? "");
        if (password !== confirmation) throw new Error("The passwords do not match.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setDialogOpen(false);
        setMode("sign-in");
      }
    } catch (authError) {
      const message = getSupabaseErrorMessage(authError, "Authentication failed. Please try again.");
      setError(mode === "sign-in" && /invalid login credentials/i.test(message)
        ? "These credentials aren't recognized by this Supabase project. Accounts from another project aren't transferred; choose Sign up to create an account here."
        : message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
  }

  async function toggleContactVisibility() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user || contactPublic === null || isUpdatingContact) return;

    const nextValue = !contactPublic;
    setIsUpdatingContact(true);
    setContactNotice("");
    const { error: updateError } = await supabase
      .from("seller_profiles")
      .update({ is_contact_public: nextValue })
      .eq("id", user.id);
    if (updateError) {
      if (isMissingContactVisibilityColumn(updateError)) {
        setContactPublic(null);
        setContactNotice("Contact visibility settings are unavailable until the database is updated.");
      } else {
        setContactNotice(getSupabaseErrorMessage(updateError, "Could not update contact visibility."));
      }
    } else {
      setContactPublic(nextValue);
      router.refresh();
    }
    setIsUpdatingContact(false);
  }

  const heading = mode === "sign-in"
    ? "Welcome back."
    : mode === "sign-up"
      ? "Join your campus market."
      : mode === "forgot-password"
        ? "Reset your password."
        : "Choose a new password.";

  return (
    <>
      {user ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-36 truncate text-xs font-semibold text-[#1d2e29] sm:block">{user.email}</span>
          {userId && contactPublic !== null && <button type="button" onClick={toggleContactVisibility} disabled={isUpdatingContact} aria-label={contactPublic ? "Make WhatsApp contact private" : "Make WhatsApp contact public"} aria-pressed={contactPublic} title={contactPublic ? "WhatsApp shown on public listings. Click to hide." : "WhatsApp hidden from public listings. Click to show."} className="grid h-10 w-10 place-items-center border border-[#d9b36b] text-[#0f564a] hover:bg-[#f2e6cf] disabled:opacity-60">{contactPublic ? <Eye aria-hidden="true" className="h-4 w-4" /> : <EyeOff aria-hidden="true" className="h-4 w-4" />}</button>}
          {contactNotice && <span role="alert" className="max-w-48 text-xs text-[#873e2d]">{contactNotice}</span>}
          <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid h-10 w-10 place-items-center border border-[#d9b36b] text-[#0f564a] hover:bg-[#f2e6cf]"><LogOut aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => { setDialogOpen(true); setError(""); setFeedback(""); }} aria-label="Sign in" className="inline-flex min-h-10 items-center gap-0 px-1 text-xs font-semibold text-[#1d2e29] hover:text-[#0f564a] sm:gap-2 sm:px-0 sm:text-sm">
          <UserRound aria-hidden="true" className="h-4 w-4" /><span className="hidden min-[400px]:inline">Sign in</span>
        </button>
      )}

      {dialogOpen && createPortal(
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }} className="fixed inset-0 z-50 flex items-end justify-center bg-[#17231b]/55 p-0 sm:items-center sm:p-5">
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-heading" className="max-h-[90dvh] w-full max-w-md overflow-y-auto bg-[#fffdf7] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d9b36b]">COLLEGE MRKT</p>
                <h2 id="auth-heading" className="mt-2 font-serif text-2xl text-[#24342a]">{heading}</h2>
              </div>
              <button type="button" onClick={() => setDialogOpen(false)} aria-label="Close sign-in dialog" className="grid h-9 w-9 place-items-center text-[#626a60] hover:bg-[#efefe8]"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>

            {error && <p role="alert" className="mt-4 border border-[#e7b7aa] bg-[#fff0eb] px-3 py-2.5 text-sm leading-5 text-[#873e2d]">{error}</p>}
            {feedback && <p role="status" className="mt-4 border border-[#a8c3a8] bg-[#edf5eb] px-3 py-2.5 text-sm leading-5 text-[#294d34]">{feedback}</p>}

            <form onSubmit={submitAuth} className="mt-5 space-y-4">
              {mode === "sign-up" && (
                <>
                  <label htmlFor="is_contact_public" className="flex items-start gap-2.5 text-xs leading-5 text-[#59645b]"><input id="is_contact_public" name="is_contact_public" type="checkbox" className="mt-1 accent-[#0f564a]" /><span>Show my WhatsApp number on public listing pages. I can change this later.</span></label>
                  <div><label htmlFor="full_name" className="mb-1.5 block text-xs font-semibold text-[#354239]">Your name</label><input id="full_name" name="full_name" required maxLength={80} autoComplete="name" className="form-control" /></div>
                  <div><label htmlFor="whatsapp_number" className="mb-1.5 block text-xs font-semibold text-[#354239]">WhatsApp number</label><input id="whatsapp_number" name="whatsapp_number" required type="tel" autoComplete="tel" placeholder="024 123 4567" className="form-control" /></div>
                  <div><label htmlFor="campus_area" className="mb-1.5 block text-xs font-semibold text-[#354239]">Campus area <span className="font-normal text-[#7d837b]">(optional)</span></label><input id="campus_area" name="campus_area" maxLength={100} placeholder="e.g. ATU campus" className="form-control" /></div>
                  <div><label htmlFor="account_type" className="mb-1.5 block text-xs font-semibold text-[#354239]">Account type</label><select id="account_type" name="account_type" required defaultValue="student_seller" className="form-control">{ACCOUNT_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></div>
                </>
              )}
              {mode !== "reset-password" && <div><label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-[#354239]">Email</label><input id="auth-email" name="email" required type="email" autoComplete="email" className="form-control" /></div>}
              {(mode === "sign-in" || mode === "sign-up" || mode === "reset-password") && <div><label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-[#354239]">{mode === "reset-password" ? "New password" : "Password"}</label><input id="auth-password" name="password" required type="password" minLength={8} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="form-control" /></div>}
              {mode === "reset-password" && <div><label htmlFor="password_confirmation" className="mb-1.5 block text-xs font-semibold text-[#354239]">Confirm new password</label><input id="password_confirmation" name="password_confirmation" required type="password" minLength={8} autoComplete="new-password" className="form-control" /></div>}
              {mode === "sign-in" && <button type="button" onClick={() => { setMode("forgot-password"); setError(""); setFeedback(""); }} className="text-xs font-semibold text-[#0f564a] underline underline-offset-2">Forgot password?</button>}
              <button type="submit" disabled={isSubmitting} className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#0f564a] px-4 text-sm font-bold text-white hover:bg-[#0b433b] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogIn aria-hidden="true" className="h-4 w-4" />}
                {isSubmitting ? "Please wait" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : mode === "forgot-password" ? "Send reset link" : "Update password"}
              </button>
            </form>
            {mode !== "reset-password" && <p className="mt-5 border-t border-[#e2e3dc] pt-4 text-center text-xs text-[#6e766d]">
              {mode === "sign-in" ? "New to the campus market?" : mode === "sign-up" ? "Already have an account?" : "Remembered your password?"}{" "}
              <button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); setFeedback(""); }} className="font-bold text-[#0f564a] underline underline-offset-2">
                {mode === "sign-in" ? "Create account" : "Sign in"}
              </button>
            </p>}
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
