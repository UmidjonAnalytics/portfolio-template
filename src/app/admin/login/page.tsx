"use client";

import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, Input } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { LangSwitcher, ThemeToggle } from "@/components/ui/Switchers";
import { useAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useLocale } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useLocale();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, user, router]);

  const mapError = (code: string) => {
    if (["auth/invalid-credential", "auth/wrong-password", "auth/invalid-email", "auth/invalid-login-credentials"].includes(code)) return t("admin.login.errors.invalid");
    if (code === "auth/user-not-found") return t("admin.login.errors.userNotFound");
    if (code === "auth/too-many-requests") return t("admin.login.errors.tooMany");
    return t("admin.login.errors.generic");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace("/admin");
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setInfo(t("admin.login.resetSent"));
      }
    } catch (err) {
      setError(mapError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-bg mesh">
      <title>{`${t("admin.login.title")} · ${t("admin.brand")}`}</title>
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("admin.nav.viewSite")}
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={submit} className="card w-full max-w-md p-7 sm:p-9 space-y-5">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-2xl bg-accent-soft text-accent-strong flex items-center justify-center" aria-hidden="true">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold">{mode === "login" ? t("admin.login.title") : t("admin.login.resetTitle")}</h1>
              <p className="text-sm text-muted">{mode === "login" ? t("admin.login.subtitle") : t("admin.login.resetSubtitle")}</p>
            </div>
          </div>

          <Field label={t("admin.login.email")} htmlFor="login-email" required>
            <Input id="login-email" type="email" autoComplete="email" value={email} onChange={setEmail} required />
          </Field>
          {mode === "login" && (
            <Field label={t("admin.login.password")} htmlFor="login-password" required>
              <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={setPassword} required />
            </Field>
          )}

          {error && (
            <p className="text-sm text-danger rounded-xl bg-danger-soft px-3 py-2" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-success rounded-xl bg-[color-mix(in_oklab,var(--success)_12%,transparent)] px-3 py-2" role="status">
              {info}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={busy}>
            {mode === "login" ? (busy ? t("admin.login.signingIn") : t("admin.login.signIn")) : t("admin.login.sendReset")}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "reset" : "login");
              setError("");
              setInfo("");
            }}
            className="w-full text-sm font-semibold text-accent-strong hover:underline"
          >
            {mode === "login" ? t("admin.login.forgot") : t("admin.login.backToLogin")}
          </button>
        </form>
      </div>
    </main>
  );
}
