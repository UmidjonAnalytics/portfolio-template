"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, CloudOff, Eye, Loader2, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { REFERRAL_REWARD } from "@/lib/intake/catalog";
import { INTAKE_STEPS, SAMPLE_CODE, emptyIntake, mergeIntake, normalizeCode, type IntakeData, type OrderCode } from "@/lib/intake/types";
import { firstInvalidStep, validateStep, type IntakeErrors } from "@/lib/intake/validate";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { STEP_TITLES, StepAbout, StepDesign, StepDomain, StepExtras, StepPhoto, StepProfile, StepProjects, StepReview, StepSkills, type Update } from "./steps";
import { inputCls } from "./ui";

type Phase = "loading" | "no-code" | "invalid" | "form" | "submitted" | "sample-done" | "error";
type SaveState = "idle" | "saving" | "saved" | "offline";

const backupKey = (code: string) => `intake-backup-${code}`;

function readBackup(code: string): IntakeData | null {
  try {
    const raw = localStorage.getItem(backupKey(code));
    return raw ? (JSON.parse(raw) as IntakeData) : null;
  } catch {
    return null;
  }
}

/** Plain JSON copy: drops undefined values, which Firestore would reject for the whole document. */
function toStorable(d: IntakeData): IntakeData {
  return JSON.parse(JSON.stringify(d)) as IntakeData;
}

function writeBackup(d: IntakeData) {
  try {
    localStorage.setItem(backupKey(d.code), JSON.stringify(d));
  } catch {
    /* storage full or blocked: Firestore is the real store */
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg mesh">
      <title>Anketa · Portfolio sayt</title>
      {children}
    </main>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="card w-full max-w-md p-7 sm:p-9 text-center">{children}</div>
      </div>
    </Shell>
  );
}

function CodeEntry({ invalid }: { invalid?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  return (
    <CenterCard>
      <h1 className="font-display text-2xl font-semibold">{invalid ? "Havola noto‘g‘ri" : "Anketa"}</h1>
      <p className="mt-3 text-muted leading-relaxed">
        {invalid
          ? "Bu kod topilmadi. Havolani to‘liq nusxalaganingizni tekshiring yoki kodni quyida qayta yozing."
          : "To‘lovdan keyin sizga shaxsiy havola yuboriladi. Uni oching yoki kodni shu yerga yozing."}
      </p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const code = normalizeCode(value);
          if (code) router.replace(`/forma?kod=${code}`);
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Masalan: K7M2QX9A" aria-label="Kod" autoCapitalize="characters" className={cn(inputCls, "border-line text-center font-mono text-lg tracking-widest uppercase")} />
        <Button type="submit" size="lg" className="w-full">
          Davom etish
        </Button>
      </form>
      <a href="/forma?namuna=1" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline">
        <Eye className="h-4 w-4" aria-hidden="true" />
        Anketa namunasini ko‘rish
      </a>
    </CenterCard>
  );
}

/** Shown after submitting: the customer's own code to hand to friends. */
function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-6 rounded-2xl border border-accent/40 bg-accent-soft/50 p-4 text-left">
      <p className="font-semibold">Do‘stingizni taklif qiling</p>
      <p className="mt-1 text-sm text-fg-2 leading-relaxed">
        Do‘stingiz sayt buyurtma qilib, anketada shu kodni yozsa, sizga {REFERRAL_REWARD.toLocaleString("ru-RU")} so‘m kartangizga qaytaraman.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex-1 rounded-xl bg-surface border border-line px-3 py-2.5 text-center font-mono text-xl font-bold tracking-[0.3em]">{code}</span>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
            } catch {
              /* the code is on screen to copy by hand */
            }
          }}
        >
          {copied ? "Nusxalandi" : "Nusxalash"}
        </Button>
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map = {
    saving: { Icon: Loader2, text: "Saqlanmoqda…", cls: "text-muted", spin: true },
    saved: { Icon: Check, text: "Saqlandi", cls: "text-success", spin: false },
    offline: { Icon: CloudOff, text: "Saqlanmadi — internetni tekshiring", cls: "text-warning", spin: false },
  } as const;
  const { Icon, text, cls, spin } = map[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", cls)} aria-live="polite">
      <Icon className={cn("h-3.5 w-3.5", spin && "animate-spin")} aria-hidden="true" />
      {text}
    </span>
  );
}

export function IntakeForm() {
  const params = useSearchParams();
  const sample = !params.get("kod") && params.get("namuna") === "1";
  const code = sample ? SAMPLE_CODE : normalizeCode(params.get("kod") ?? "");
  const [phase, setPhase] = useState<Phase>("loading");
  const [order, setOrder] = useState<OrderCode | null>(null);
  const [d, setD] = useState<IntakeData | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<IntakeErrors>({});
  const [save, setSave] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const loaded = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // The form is Uzbek-only; set the document language after the locale provider has run.
  useEffect(() => {
    const t = window.setTimeout(() => (document.documentElement.lang = "uz"), 0);
    return () => window.clearTimeout(t);
  }, []);

  // Load the order code and any saved draft.
  useEffect(() => {
    let cancelled = false;
    loaded.current = false;
    // Sample: an empty form straight away. loaded stays false, so autosave never runs.
    if (sample) {
      setD(emptyIntake(SAMPLE_CODE));
      setStep(1);
      setPhase("form");
      return;
    }
    if (!code) {
      setPhase("no-code");
      return;
    }
    setPhase("loading");
    (async () => {
      try {
        const orderSnap = await getDoc(doc(db, "orderCodes", code));
        if (cancelled) return;
        if (!orderSnap.exists()) {
          setPhase("invalid");
          return;
        }
        setOrder(orderSnap.data() as OrderCode);
        const snap = await getDoc(doc(db, "intake", code));
        if (cancelled) return;
        const remote = snap.exists() ? (snap.data() as IntakeData) : null;
        if (remote?.status === "submitted") {
          setD(mergeIntake(code, remote));
          setPhase("submitted");
          return;
        }
        const backup = readBackup(code);
        const best = backup && (!remote || (backup.updatedAt ?? 0) > (remote.updatedAt ?? 0)) ? backup : remote;
        const data = mergeIntake(code, best);
        setD(data);
        setStep(Math.min(Math.max(1, data.step || 1), INTAKE_STEPS));
        setPhase("form");
        loaded.current = true;
      } catch (e) {
        console.error(e);
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, sample]);

  // Autosave: local backup immediately, Firestore after a short pause.
  const pending = useRef<number | null>(null);
  const persist = useCallback(async (data: IntakeData) => {
    try {
      setSave("saving");
      await setDoc(doc(db, "intake", data.code), toStorable({ ...data, updatedAt: Date.now() }));
      setSave("saved");
    } catch (e) {
      console.error(e);
      setSave("offline");
    }
  }, []);

  useEffect(() => {
    if (!d || !loaded.current || phase !== "form") return;
    writeBackup(d);
    if (pending.current) window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => void persist(d), 1200);
    return () => {
      if (pending.current) window.clearTimeout(pending.current);
    };
  }, [d, phase, persist]);

  // Warn before closing while a save is waiting.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (save === "saving" || save === "offline") e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [save]);

  const update: Update = useCallback((fn) => setD((prev) => (prev ? { ...fn(prev), updatedAt: Date.now() } : prev)), []);

  const scrollToFirstError = (errs: IntakeErrors) => {
    window.setTimeout(() => {
      const first = Object.keys(errs)[0];
      const el = first ? document.querySelector(`[data-field="${first}"]`) : null;
      (el ?? topRef.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const goTo = (target: number) => {
    setErrors({});
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (!d) return;
    // The sample lets people look through every step without filling anything in.
    if (sample) return goTo(Math.min(step + 1, INTAKE_STEPS));
    const errs = validateStep(step, d);
    setErrors(errs);
    if (Object.keys(errs).length) {
      scrollToFirstError(errs);
      return;
    }
    const target = Math.min(step + 1, INTAKE_STEPS);
    update((x) => ({ ...x, step: Math.max(x.step, target) }));
    goTo(target);
  };

  const submit = async () => {
    if (!d) return;
    if (sample) {
      setPhase("sample-done");
      window.scrollTo({ top: 0 });
      return;
    }
    const bad = firstInvalidStep(d);
    if (bad) {
      const errs = validateStep(bad, d);
      setStep(bad);
      setErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setSubmitting(true);
    try {
      if (pending.current) window.clearTimeout(pending.current);
      const final: IntakeData = { ...d, status: "submitted", step: INTAKE_STEPS, submittedAt: Date.now(), updatedAt: Date.now() };
      await setDoc(doc(db, "intake", d.code), toStorable(final));
      try {
        localStorage.removeItem(backupKey(d.code));
      } catch {
        /* ignore */
      }
      setD(final);
      setPhase("submitted");
      window.scrollTo({ top: 0 });
    } catch (e) {
      console.error(e);
      setSave("offline");
      setErrors({ submit: "Yuborib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring." });
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "loading")
    return (
      <CenterCard>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" aria-label="Yuklanmoqda" />
      </CenterCard>
    );
  if (phase === "no-code") return <CodeEntry />;
  if (phase === "invalid") return <CodeEntry invalid />;
  if (phase === "error")
    return (
      <CenterCard>
        <AlertTriangle className="mx-auto h-10 w-10 text-warning" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-semibold">Ulanib bo‘lmadi</h1>
        <p className="mt-2 text-muted">Internetni tekshirib, sahifani yangilang.</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Qayta urinish
        </Button>
      </CenterCard>
    );
  if (phase === "sample-done")
    return (
      <CenterCard>
        <Eye className="mx-auto h-12 w-12 text-accent" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Bu namuna edi</h1>
        <p className="mt-3 text-fg-2 leading-relaxed">To‘lovdan keyin shu anketaning shaxsiy havolasini olasiz. Javoblaringiz saqlanadi va saytingiz shu ma’lumotlardan yig‘iladi.</p>
        <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
          Namunani boshidan ko‘rish
        </Button>
      </CenterCard>
    );
  if (phase === "submitted" || !d)
    return (
      <CenterCard>
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Rahmat{d?.fullName ? `, ${d.fullName.split(" ")[0]}` : ""}!</h1>
        <p className="mt-3 text-fg-2 leading-relaxed">Anketangiz qabul qilindi. Tez orada siz bilan Telegram yoki telefon orqali bog‘lanaman.</p>
        <p className="mt-3 text-sm text-muted leading-relaxed">Biror narsani o‘zgartirish kerak bo‘lsa, menga yozing — anketani qayta ochib beraman.</p>
        {order?.refCode && <ReferralCard code={order.refCode} />}
      </CenterCard>
    );

  const props = { d, update, errors, code };
  const progress = Math.round(((step - 1) / (INTAKE_STEPS - 1)) * 100);

  return (
    <Shell>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-sm font-semibold">
              <span className="text-accent-strong">/</span> Anketa
            </p>
            {sample ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-strong">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                Namuna
              </span>
            ) : (
              <SaveBadge state={save} />
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={INTAKE_STEPS} aria-label="Bosqich">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
            </div>
            <span className="text-xs font-bold tabular-nums text-muted">
              {step}/{INTAKE_STEPS}
            </span>
          </div>
        </div>
      </header>

      <div ref={topRef} className="mx-auto max-w-2xl px-4 pt-8 pb-32">
        {sample && (
          <div className="mb-6 rounded-2xl border border-accent/40 bg-accent-soft/50 px-4 py-3 text-sm leading-relaxed">
            <p className="font-semibold">Bu anketaning namunasi.</p>
            <p className="mt-0.5 text-fg-2">Hech narsa saqlanmaydi va hech kimga yuborilmaydi. Bosqichlarni to‘ldirmasdan ham ko‘rib chiqishingiz mumkin.</p>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Bosqichga o‘tish">
              {STEP_TITLES.map((title, i) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => goTo(i + 1)}
                  aria-current={step === i + 1 ? "step" : undefined}
                  title={title}
                  className={cn(
                    "h-8 min-w-8 px-2 rounded-full border text-xs font-bold tabular-nums transition",
                    step === i + 1 ? "bg-accent text-accent-fg border-accent" : "bg-surface border-line text-fg-2 hover:border-line-strong",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && order?.label && <p className="text-sm font-semibold text-accent-strong">Salom, {order.label}!</p>}
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold">{STEP_TITLES[step - 1]}</h1>

        {Object.keys(errors).length > 0 && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-danger/50 bg-danger-soft px-4 py-3 text-sm" role="alert">
            <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
            <p className="font-semibold">{errors.submit ?? "Qizil bilan belgilangan maydonlarni to‘ldiring."}</p>
          </div>
        )}

        <div className="mt-6">
          {step === 1 && <StepAbout {...props} />}
          {step === 2 && <StepDomain {...props} />}
          {step === 3 && <StepProfile {...props} />}
          {step === 4 && <StepPhoto {...props} />}
          {step === 5 && <StepSkills {...props} />}
          {step === 6 && <StepProjects {...props} />}
          {step === 7 && <StepExtras {...props} />}
          {step === 8 && <StepDesign {...props} />}
          {step === 9 && <StepReview {...props} goTo={goTo} />}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-xl" aria-label="Bosqichlar">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          {step > 1 ? (
            <Button variant="outline" size="lg" onClick={() => goTo(step - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Orqaga
            </Button>
          ) : (
            <span />
          )}
          <span className="flex-1" />
          {step < INTAKE_STEPS ? (
            <Button size="lg" onClick={next}>
              Keyingi
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button size="lg" onClick={submit} loading={submitting}>
              {!submitting && <Send className="h-4 w-4" aria-hidden="true" />}
              Yuborish
            </Button>
          )}
        </div>
      </nav>
    </Shell>
  );
}
