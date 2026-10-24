"use client";

import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { ClipboardList, Copy, Download, Eye, FileDown, Gift, Plus, RotateCcw, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/EmptyState";
import { inputClass, Toggle } from "@/components/admin/fields";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/hooks";
import { LANG_LABELS, PROJECT_DOMAIN_OPTIONS, REFERRAL_REWARD, SKILL_CATEGORY_LABELS, jobOf } from "@/lib/intake/catalog";
import { deleteIntakeFile, downloadIntakeFile, formatSize, triggerDownload } from "@/lib/intake/files";
import { buildSitePackage } from "@/lib/intake/to-package";
import { generateCode, generateRefCode, INTAKE_STEPS, intakeEnabled, mergeIntake, normalizeRefCode, type IntakeData, type IntakeFileRef, type OrderCode } from "@/lib/intake/types";
import { cn, formatDateTime } from "@/lib/utils";
import { styleMeta } from "@/lib/design";
import { STYLE_LABELS } from "@/lib/intake/catalog";

type Row = OrderCode & { id: string; intake: IntakeData | null; /** Referral code that brought this order. */ ref: string };

interface Referrer {
  id: string;
  name: string;
  orderCode: string;
  createdAt: number;
}

const som = (n: number) => `${n.toLocaleString("ru-RU")} so‘m`;

const STAGES: { value: OrderCode["stage"]; label: string }[] = [
  { value: "new", label: "Yangi" },
  { value: "building", label: "Sayt yig‘ilmoqda" },
  { value: "done", label: "Topshirildi" },
];

function linkFor(code: string): string {
  return `${window.location.origin}/forma?kod=${code}`;
}

function StatusBadge({ intake }: { intake: IntakeData | null }) {
  if (!intake) return <Badge>Ochilmagan</Badge>;
  if (intake.status === "submitted") return <Badge tone="success">Yuborildi</Badge>;
  return (
    <Badge tone="warning">
      To‘ldirilmoqda · {Math.min(intake.step, INTAKE_STEPS)}/{INTAKE_STEPS}
    </Badge>
  );
}

function FileButton({ file, label }: { file: IntakeFileRef; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const f = await downloadIntakeFile(file.id);
          triggerDownload(f.dataUrl, f.name);
        } catch {
          toast.error("Faylni yuklab bo‘lmadi");
        } finally {
          setBusy(false);
        }
      }}
      className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 text-left text-sm hover:border-accent disabled:opacity-60"
    >
      {file.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.thumb} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <span className="h-10 w-10 rounded-lg bg-surface-2 flex items-center justify-center">
          <FileDown className="h-5 w-5 text-muted" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold truncate max-w-[12rem]">{label ?? file.name}</span>
        <span className="block text-xs text-muted">{busy ? "Yuklanmoqda…" : formatSize(file.size)}</span>
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">{title}</h3>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === "" || v === null || v === undefined) return null;
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-1 text-sm">
      <span className="text-muted">{k}</span>
      <span className="font-medium whitespace-pre-wrap break-words">{v}</span>
    </div>
  );
}

const domainLabel = (v: string) => PROJECT_DOMAIN_OPTIONS.find((o) => o.value === v)?.label ?? v;
const availabilityLabel = { open: "Ish qidiryapti", freelance: "Frilans", unavailable: "Band" } as const;

function Details({ d }: { d: IntakeData }) {
  return (
    <div className="space-y-6">
      <Section title="Shaxsiy">
        <KV k="Ism" v={d.fullName} />
        <KV k="Gmail" v={d.gmail} />
        <KV k="Telefon" v={d.phone} />
        <KV k="Telegram" v={d.telegram} />
        <KV k="Taklif kodi" v={d.referredBy} />
      </Section>
      <Section title="Domen va tillar">
        <KV k="Domenlar" v={d.domains.filter(Boolean).map((x, i) => `${i + 1}. ${x}.uz`).join("\n")} />
        <KV k="Sayt tillari" v={d.siteLanguages.map((l) => LANG_LABELS[l]).join(", ")} />
        <KV k="Ochiladigan til" v={LANG_LABELS[d.defaultLang]} />
        <KV k="Matnlar tili" v={LANG_LABELS[d.contentLang]} />
      </Section>
      <Section title="Profil">
        <KV k="Kasb" v={`${jobOf(d.job).icon} ${jobOf(d.job).label}`} />
        <KV k="Lavozimlar" v={d.titles.filter(Boolean).join(", ")} />
        <KV k="Shior" v={d.tagline} />
        <KV k="Tarjimai hol" v={d.bio} />
        <KV k="Shahar" v={d.city} />
        <KV k="Tillar" v={d.spokenLanguages} />
        <KV k="Holat" v={availabilityLabel[d.availability]} />
      </Section>
      <Section title="Fayllar">
        <div className="flex flex-wrap gap-2">
          {d.photo && <FileButton file={d.photo} label="Rasm" />}
          {d.cv && <FileButton file={d.cv} label="Rezyume (PDF)" />}
          {!d.photo && !d.cv && <p className="text-sm text-muted">—</p>}
        </div>
      </Section>
      <Section title={`Ko‘nikmalar (${d.skills.length})`}>
        <div className="flex flex-wrap gap-1.5">
          {d.skills.map((s) => (
            <span key={s.key} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold" title={SKILL_CATEGORY_LABELS[s.category]}>
              {s.icon} {s.name} · {s.level}%
            </span>
          ))}
        </div>
      </Section>
      <Section title={`Loyihalar (${d.projects.length})`}>
        <div className="space-y-3">
          {d.projects.map((p, i) => (
            <div key={p.id} className="rounded-2xl border border-line p-4">
              <p className="font-semibold">
                {i + 1}. {p.title} {p.id === d.featuredProjectId && <Badge tone="accent">Eng yaxshisi</Badge>}
              </p>
              <KV k="Qisqacha" v={p.summary} />
              <KV k="Soha" v={domainLabel(p.domain)} />
              <KV k="Vositalar" v={p.tools.join(", ")} />
              <KV k="Sana" v={p.date} />
              <KV k="Muammo" v={p.problem} />
              <KV k="Yondashuv" v={p.approach} />
              <KV k="Natija" v={p.result} />
              <KV k="Raqamlar" v={p.metrics.filter((m) => m.value || m.label).map((m) => `${m.value} — ${m.label}`).join("\n")} />
              <KV k="GitHub" v={p.github} />
              <KV k="Havola" v={p.link} />
              <div className="mt-2 flex flex-wrap gap-2">
                {p.images.map((img, j) => (
                  <FileButton key={img.id} file={img} label={j === 0 ? "Muqova" : `Rasm ${j + 1}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      {d.experience.length > 0 && (
        <Section title={`Tajriba (${d.experience.length})`}>
          {d.experience.map((x) => (
            <div key={x.id} className="rounded-2xl border border-line p-4">
              <p className="font-semibold">
                {x.role} — {x.company}
              </p>
              <KV k="Davr" v={`${x.start} — ${x.current ? "hozirgacha" : x.end}`} />
              <KV k="Shahar" v={x.city} />
              <KV k="Yutuqlar" v={x.achievements} />
            </div>
          ))}
        </Section>
      )}
      {d.certificates.length > 0 && (
        <Section title={`Sertifikatlar (${d.certificates.length})`}>
          {d.certificates.map((x) => (
            <div key={x.id} className="rounded-2xl border border-line p-4">
              <p className="font-semibold">{x.title}</p>
              <KV k="Kim bergan" v={x.issuer} />
              <KV k="Sana" v={x.date} />
              <KV k="Raqam" v={x.credentialId} />
              <KV k="Havola" v={x.verifyUrl} />
              {x.image && (
                <div className="mt-2">
                  <FileButton file={x.image} label="Sertifikat rasmi" />
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
      {d.education.length > 0 && (
        <Section title={`Ta’lim (${d.education.length})`}>
          {d.education.map((x) => (
            <KV key={x.id} k={x.school} v={[x.degree, x.field, [x.start, x.end].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")} />
          ))}
        </Section>
      )}
      {d.testimonials.length > 0 && (
        <Section title={`Fikrlar (${d.testimonials.length})`}>
          {d.testimonials.map((x) => (
            <KV key={x.id} k={[x.name, x.role, x.company].filter(Boolean).join(", ")} v={`“${x.quote}”`} />
          ))}
        </Section>
      )}
      <Section title="Aloqa va dizayn">
        <KV k="Saytdagi email" v={d.siteEmail || `${d.gmail} (Gmail)`} />
        <KV k="Telefon saytda" v={d.showPhone ? "Ha" : "Yo‘q"} />
        <KV k="LinkedIn" v={d.linkedin} />
        <KV k="GitHub" v={d.github} />
        <KV
          k="Rang"
          v={
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full" style={{ background: d.accentColor }} /> {d.accentColor}
            </span>
          }
        />
        <KV k="Uslub" v={STYLE_LABELS[styleMeta(d.siteStyle).key].name} />
        <KV k="Rejim" v={d.defaultTheme === "dark" ? "Qorong‘i" : "Yorug‘"} />
        <KV k="Namuna sayt" v={d.exampleSite} />
        <KV k="Istaklar" v={d.notes} />
      </Section>
    </div>
  );
}

export default function OrdersPage() {
  if (!intakeEnabled()) notFound();
  return <Orders />;
}

function Orders() {
  const codes = useCollection<OrderCode & { id: string }>("orderCodes", { sort: (items) => [...items].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)) });
  const intakes = useCollection<IntakeData & { id: string }>("intake");
  const referrers = useCollection<Referrer>("referrers");
  const [label, setLabel] = useState("");
  const [refInput, setRefInput] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const rows = useMemo<Row[]>(() => {
    const byCode = new Map(intakes.items.map((i) => [i.id, i]));
    return codes.items.map((c) => {
      const raw = byCode.get(c.id);
      const intake = raw ? mergeIntake(c.id, raw) : null;
      // The owner's entry wins; otherwise the code the customer typed in the form.
      const ref = normalizeRefCode(c.referredBy ?? "") || normalizeRefCode(intake?.referredBy ?? "");
      return { ...c, code: c.id, intake, ref: ref && ref !== c.refCode ? ref : "" };
    });
  }, [codes.items, intakes.items]);

  // Who brought whom. A referrer is known by their saved code, even after their own order is deleted.
  const referralGroups = useMemo(() => {
    const names = new Map(referrers.items.map((r) => [r.id, r.name]));
    for (const r of rows) if (r.refCode && !names.has(r.refCode)) names.set(r.refCode, r.intake?.fullName || r.label);
    const groups = new Map<string, Row[]>();
    for (const r of rows) if (r.ref) groups.set(r.ref, [...(groups.get(r.ref) ?? []), r]);
    return [...groups.entries()].map(([code, brought]) => ({ code, name: names.get(code) ?? "", brought }));
  }, [rows, referrers.items]);
  const owed = referralGroups.reduce((n, g) => n + g.brought.filter((b) => !b.referralPaid).length, 0);

  /** Give an order its own referral code (new orders get one automatically). */
  const ensureRefCode = async (row: { id: string; label: string; refCode?: string }, name?: string) => {
    if (row.refCode) return row.refCode;
    const refCode = generateRefCode();
    await setDoc(doc(db, "referrers", refCode), { name: (name || row.label).trim(), orderCode: row.id, createdAt: Date.now() });
    await updateDoc(doc(db, "orderCodes", row.id), { refCode });
    return refCode;
  };

  const copyRef = async (row: Row) => {
    try {
      const refCode = await ensureRefCode(row, row.intake?.fullName);
      const text = `Do‘stlaringizga shu kodni bering: ${refCode}. Ular anketada yozsa, sizga ${som(REFERRAL_REWARD)} qaytaraman.`;
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`Taklif kodi nusxalandi: ${refCode}`);
      } catch {
        toast.message(text);
      }
    } catch (e) {
      console.error(e);
      toast.error("Kod yaratib bo‘lmadi");
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(code));
      toast.success("Havola nusxalandi");
    } catch {
      toast.message(linkFor(code));
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const code = generateCode();
      const refCode = generateRefCode();
      const referredBy = normalizeRefCode(refInput);
      const order: OrderCode = { code, label: label.trim(), isStudent, stage: "new", createdAt: Date.now(), refCode, ...(referredBy ? { referredBy } : {}) };
      await setDoc(doc(db, "referrers", refCode), { name: label.trim(), orderCode: code, createdAt: Date.now() });
      await setDoc(doc(db, "orderCodes", code), order);
      setLabel("");
      setRefInput("");
      await copy(code);
    } catch (e) {
      console.error(e);
      toast.error("Kod yaratib bo‘lmadi");
    } finally {
      setCreating(false);
    }
  };

  const exportPackage = async (row: Row) => {
    if (!row.intake) return;
    setExporting(row.id);
    try {
      const pkg = await buildSitePackage(row.intake, row, (done, total) => toast.loading(`Fayllar: ${done}/${total}`, { id: "export" }));
      const blob = new Blob([JSON.stringify(pkg)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const safe = (row.intake.fullName || row.id).trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
      triggerDownload(url, `sayt-${safe}-${row.id}.json`);
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success("Sayt fayli tayyor", { id: "export", description: "Mijoz saytining admin panelida: Sozlamalar → Xavfli hudud → Import." });
    } catch (e) {
      console.error(e);
      toast.error("Eksport qilib bo‘lmadi", { id: "export" });
    } finally {
      setExporting(null);
    }
  };

  const reopen = async (row: Row) => {
    try {
      await updateDoc(doc(db, "intake", row.id), { status: "draft" });
      toast.success("Anketa qayta ochildi — mijoz endi tahrirlay oladi");
    } catch {
      toast.error("Bajarib bo‘lmadi");
    }
  };

  const remove = async () => {
    const row = deleting;
    if (!row) return;
    setDeleting(null);
    try {
      const files = await getDocs(query(collection(db, "intakeFiles"), where("code", "==", row.id)));
      for (const f of files.docs) await deleteIntakeFile(f.id, (f.data().chunks as number) ?? 1);
      await deleteDoc(doc(db, "intake", row.id));
      await deleteDoc(doc(db, "orderCodes", row.id));
      toast.success("O‘chirildi");
    } catch (e) {
      console.error(e);
      toast.error("O‘chirib bo‘lmadi");
    }
  };

  return (
    <>
      <PageHeader
        title="Buyurtmalar"
        subtitle="To‘lovdan keyin mijozga anketa havolasini yuboring."
        action={
          <Button href="/forma?namuna=1" external variant="outline" size="sm">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Anketa namunasi
          </Button>
        }
      />

      <div className="card p-5 mb-6 space-y-4">
        <h2 className="font-display font-semibold">Yangi anketa havolasi</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Mijozning ismi (o‘zingiz uchun)" className={cn(inputClass, "sm:flex-1")} aria-label="Mijozning ismi" maxLength={80} />
          <input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="Taklif kodi"
            title="Kim taklif qilgan bo‘lsa, uning 6 belgili kodi (ixtiyoriy)"
            className={cn(inputClass, "sm:w-36 font-mono uppercase")}
            aria-label="Taklif kodi (ixtiyoriy)"
          />
          <div className="shrink-0">
            <Toggle checked={isStudent} onChange={setIsStudent} label="O‘quvchim" description="1:1 videoqo‘ng‘iroq bonusi" />
          </div>
          <Button onClick={create} loading={creating}>
            {!creating && <Plus className="h-4 w-4" aria-hidden="true" />}
            Havola yaratish
          </Button>
        </div>
        <p className="text-xs text-muted">
          Havola avtomatik nusxalanadi — uni mijozga Telegram orqali yuboring. Mijozni kimdir taklif qilgan bo‘lsa, uning kodini yozing; mijoz anketada ham yozishi mumkin.
        </p>
      </div>

      {referralGroups.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display font-semibold inline-flex items-center gap-2">
              <Gift className="h-4 w-4 text-accent-strong" aria-hidden="true" />
              Takliflar
            </h2>
            <p className={cn("text-sm font-semibold", owed ? "text-warning" : "text-success")}>
              {owed ? `Qaytarilishi kerak: ${som(owed * REFERRAL_REWARD)}` : "Hammasi qaytarilgan"}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted">Pulni taklif qilgan odamning kartasiga o‘tkazing va belgilang. Karta raqami bu yerda saqlanmaydi — uni Telegram’da so‘rang.</p>
          <ul className="mt-4 space-y-3">
            {referralGroups.map((g) => (
              <li key={g.code} className="rounded-2xl border border-line p-3">
                <p className="text-sm font-semibold">
                  {g.name || "Noma’lum kod"} <span className="ml-1 font-mono text-xs text-muted">{g.code}</span>
                  {!g.name && <span className="ml-2 text-xs font-normal text-warning">bunday kod topilmadi — tekshiring</span>}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {g.brought.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        → {b.intake?.fullName || b.label || b.id} <span className="font-mono text-xs text-muted">{b.id}</span>
                      </span>
                      <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!b.referralPaid}
                          onChange={(e) => updateDoc(doc(db, "orderCodes", b.id), { referralPaid: e.target.checked }).catch(() => toast.error("Saqlab bo‘lmadi"))}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        {som(REFERRAL_REWARD)} qaytarildi
                      </label>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {codes.loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Hali buyurtmalar yo‘q" description="Mijoz to‘lov qilgach, yuqorida havola yarating va unga yuboring. Anketaning holati shu yerda ko‘rinadi." />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="card p-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{row.intake?.fullName || row.label || "Nomsiz"}</p>
                  <StatusBadge intake={row.intake} />
                  {row.isStudent && <Badge tone="accent">O‘quvchi</Badge>}
                  {row.ref && <Badge tone={row.referralPaid ? "success" : "warning"}>Taklif: {row.ref}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  <span className="font-mono font-bold text-fg-2">{row.id}</span> · {formatDateTime(row.createdAt, "uz")}
                  {row.intake?.submittedAt ? ` · yuborilgan: ${formatDateTime(row.intake.submittedAt, "uz")}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={row.stage ?? "new"}
                  onChange={(e) => updateDoc(doc(db, "orderCodes", row.id), { stage: e.target.value }).catch(() => toast.error("Saqlab bo‘lmadi"))}
                  className={cn(inputClass, "w-auto py-2")}
                  aria-label="Bosqich"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyRef(row)}
                  aria-label="Mijozning taklif kodi"
                  title={row.refCode ? `Mijozning taklif kodi: ${row.refCode} (nusxalash)` : "Mijozga taklif kodi yaratish va nusxalash"}
                >
                  <Gift className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => copy(row.id)} aria-label="Havolani nusxalash" title="Havolani nusxalash">
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </Button>
                {row.intake && (
                  <Button variant="ghost" size="icon" onClick={() => setViewing(row)} aria-label="Ko‘rish" title="Ko‘rish">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                {row.intake?.status === "submitted" && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => reopen(row)} aria-label="Qayta ochish" title="Mijozga tahrirlash uchun qayta ochish">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => exportPackage(row)} loading={exporting === row.id}>
                      {exporting !== row.id && <Download className="h-4 w-4" aria-hidden="true" />}
                      Sayt fayli
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="text-muted hover:text-danger" onClick={() => setDeleting(row)} aria-label="O‘chirish" title="O‘chirish">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} size="lg" labelledBy="order-title">
        {viewing?.intake && (
          <div className="p-5 sm:p-7">
            <div className="pr-10">
              <h2 id="order-title" className="font-display text-xl font-semibold">
                {viewing.intake.fullName || viewing.label}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge intake={viewing.intake} />
                <span className="font-mono text-xs text-muted">{viewing.id}</span>
              </div>
            </div>
            <div className="mt-6">
              <Details d={viewing.intake} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`«${deleting?.intake?.fullName || deleting?.label || deleting?.id}» o‘chirilsinmi?`}
        description={
          deleting?.ref && !deleting.referralPaid
            ? `Havola, anketa va fayllar o‘chiriladi. Diqqat: bu mijozni ${deleting.ref} kodi egasi taklif qilgan va ${som(REFERRAL_REWARD)} hali qaytarilmagan — avval qaytaring.`
            : "Havola, anketa va barcha yuklangan fayllar butunlay o‘chiriladi. Mijozning taklif kodi saqlanib qoladi."
        }
        confirmLabel="O‘chirish"
        cancelLabel="Bekor qilish"
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
        danger
      />
    </>
  );
}
