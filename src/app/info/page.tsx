"use client";

import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Clock,
  Download,
  Globe2,
  Languages,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Palette,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { JOBS, REFERRAL_REWARD } from "@/lib/intake/catalog";
import { intakeEnabled } from "@/lib/intake/types";

/**
 * One-page product info, Uzbek, for ads and the channel: what you get, how it works, price, FAQ.
 * Lives on the owner's orders/demo deployment only, like /forma.
 */

const PRICE = "450 000 so‘m";
/** Telegram username for orders and questions, without @ (NEXT_PUBLIC_SUPPORT_TELEGRAM). */
const SUPPORT = (process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? "").replace(/^@/, "").trim();
const orderHref = SUPPORT ? `https://t.me/${SUPPORT}` : "/";

const FEATURES = [
  { Icon: Globe2, title: "O‘z domeningiz", text: "ismingiz.uz — rezyume o‘rniga bitta havola." },
  { Icon: Languages, title: "3 tilda", text: "O‘zbek, rus va ingliz. Keraksizini o‘chirib qo‘yasiz." },
  { Icon: Palette, title: "6 xil dizayn", text: "Klassik, Oq-qora, Excel, SQL, Power BI, Notebook — kunduzgi va tungi rejim." },
  { Icon: Smartphone, title: "Har qanday ekranda", text: "Telefon, planshet va kompyuterda chiroyli ochiladi." },
  { Icon: BarChart3, title: "Loyihalar", text: "Muammo, yechim, natija va interaktiv grafiklar bilan." },
  { Icon: LayoutDashboard, title: "Admin panel — umrbod", text: "Yangi ish, loyiha yoki sertifikatni o‘zingiz qo‘shasiz. Dasturchi kerak emas." },
  { Icon: Download, title: "Rezyumeni yuklab olish", text: "Ish beruvchi bir bosishda PDF rezyumengizni oladi." },
  { Icon: Mail, title: "Aloqa formasi", text: "Xabarlar to‘g‘ridan-to‘g‘ri admin panelingizga keladi." },
  { Icon: Clock, title: "24/7 onlayn", text: "Oylik hosting to‘lovi yo‘q." },
];

const STEPS = [
  { Icon: Send, title: "Yozasiz va to‘laysiz", text: "Telegram orqali bog‘lanasiz, to‘lovdan keyin shaxsiy anketa havolasini olasiz." },
  { Icon: ClipboardList, title: "Savol-javob anketasini to‘ldirasiz", text: "Telefondan, 9 ta oson bosqich, har bir savolga namuna bilan. Javoblar avtomatik saqlanadi." },
  { Icon: Sparkles, title: "Sayt tayyor", text: "Javoblaringizdan sayt yig‘iladi, domen ulanadi va admin panel sizga topshiriladi." },
];

const FAQ: [string, string][] = [
  ["Sayt qancha vaqt ishlaydi?", "Sayt umrbod sizniki: u sizning Google hisobingizdagi loyihada turadi va oylik hosting to‘lovi yo‘q. Faqat domen har yili uzaytiriladi — bu domen sotuvchisiga to‘lanadi."],
  ["Ma’lumotlarni kim kiritadi?", "Siz savol-javob anketasini to‘ldirasiz, sayt shu javoblardan avtomatik yig‘iladi. Keyinchalik hamma narsani admin panelda o‘zingiz o‘zgartirasiz."],
  ["Dasturlashni bilishim kerakmi?", "Yo‘q. Anketa ham, admin panel ham oddiy forma kabi ishlaydi."],
  ["Faqat ma’lumotlar tahlilchilari uchunmi?", "Yo‘q: dasturchi, dizayner, SMM, buxgalter, HR, loyiha menejeri, o‘qituvchi va boshqa kasblar uchun ham mos."],
  ["Qaysi tillarda bo‘ladi?", "O‘zbek, rus va ingliz. Matnlarni o‘zingiz yozgan tilda joylaymiz; tarjima narxga kirmaydi. Keraksiz tilni o‘chirib qo‘yish mumkin."],
  ["Dizaynni keyin o‘zgartira olamanmi?", "Ha. Admin paneldagi «Dizayn» bo‘limida uslub, fon, animatsiya va har bir blok ko‘rinishini istalgan vaqtda almashtirasiz."],
  ["Sayt ishga joylashishni kafolatlaydimi?", "Yo‘q. Sayt sizni ish beruvchi oldida professional ko‘rsatadi, lekin ishga qabul qilish qarori ish beruvchida."],
  ["Do‘stimni taklif qilsam-chi?", `Sayt buyurtma qilganingizdan keyin taklif kodingizni olasiz. Do‘stingiz shu kod bilan buyurtma bersa, ${REFERRAL_REWARD.toLocaleString("ru-RU")} so‘m kartangizga qaytariladi.`],
];

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <h2 className="font-display text-2xl sm:text-4xl font-semibold text-center text-balance">{title}</h2>
      <div className="mt-8 sm:mt-12">{children}</div>
    </section>
  );
}

function OrderButtons({ center = true }: { center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      <Button href={orderHref} external={!!SUPPORT} size="lg">
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {SUPPORT ? "Telegram’da buyurtma berish" : "Namunani ko‘rish"}
      </Button>
      {SUPPORT && (
        <Button href="/" variant="outline" size="lg">
          Namunani ko‘rish
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default function InfoPage() {
  if (!intakeEnabled()) notFound();
  return (
    <main className="min-h-screen bg-bg">
      {/* One string each: React leaves <title> empty when it has several children. */}
      <title>{`Shaxsiy portfolio sayt — ${PRICE}`}</title>
      <meta name="description" content={`3 tilda, 6 xil dizayn, o‘z domeningiz va umrbod admin panel. ${PRICE}, oylik to‘lovsiz.`} />
      <meta property="og:title" content={`Shaxsiy portfolio sayt — ${PRICE}`} />
      <meta property="og:description" content="Ish beruvchiga rezyume emas — o‘z saytingizni yuboring." />

      <header className="mesh">
        <div className="mx-auto max-w-5xl px-5 pt-14 pb-16 sm:pt-24 sm:pb-24 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-accent-strong">Shaxsiy portfolio sayt</p>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-semibold leading-tight text-balance">Ish beruvchiga rezyume emas — o‘z saytingizni yuboring</h1>
          <p className="mt-5 text-lg text-muted max-w-2xl mx-auto">3 tilda, 6 xil dizayn, o‘z domeningiz va umrbod admin panel. Hammasi bitta narxda.</p>
          <p className="mt-8 font-display text-5xl sm:text-6xl font-semibold text-accent-strong">{PRICE}</p>
          <p className="mt-2 text-sm text-muted">bir martalik to‘lov · oylik to‘lov yo‘q</p>
          <div className="mt-8">
            <OrderButtons />
          </div>
          {SUPPORT && (
            <p className="mt-4 text-sm text-muted">
              Telegram: <a href={orderHref} className="font-semibold text-accent-strong hover:underline">@{SUPPORT}</a>
            </p>
          )}
        </div>
      </header>

      <Section title="30 soniyada ko‘ring">
        <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-line shadow-float bg-surface-2">
          <video src="/promo.mp4" controls playsInline preload="metadata" className="block w-full aspect-[9/16]" />
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="font-semibold text-accent-strong hover:underline">
            Namuna saytni oching — ismingiz va rasmingizni qo‘yib ko‘ring
          </Link>
        </p>
      </Section>

      <div className="bg-surface-2/60 border-y border-line">
        <Section title="Narxga nimalar kiradi">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className="card p-5 flex gap-4">
                <span className="h-11 w-11 shrink-0 rounded-2xl bg-accent-soft text-accent-strong flex items-center justify-center" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-sm text-muted leading-relaxed">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-sm text-muted">
            🎁 O‘quvchilarim uchun bonus: portfolio va ish izlash bo‘yicha 1:1 videoqo‘ng‘iroq.
          </p>
        </Section>
      </div>

      <Section title="Qanday ishlaydi">
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="card p-6">
              <span className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-accent text-accent-fg font-display font-semibold flex items-center justify-center">{i + 1}</span>
                <Icon className="h-5 w-5 text-accent-strong" aria-hidden="true" />
              </span>
              <span className="mt-4 block font-semibold text-lg">{title}</span>
              <span className="mt-1 block text-muted leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-center">
          <a href="/forma?namuna=1" className="font-semibold text-accent-strong hover:underline">
            Anketa namunasini ko‘rish →
          </a>
        </p>
      </Section>

      <div className="bg-surface-2/60 border-y border-line">
        <Section title="Kimlar uchun">
          <ul className="flex flex-wrap justify-center gap-2">
            {JOBS.filter((j) => j.key !== "other").map((j) => (
              <li key={j.key} className="rounded-full border border-line bg-surface px-4 py-2 font-semibold">
                <span aria-hidden="true">{j.icon}</span> {j.label}
              </li>
            ))}
            <li className="rounded-full border border-line bg-surface px-4 py-2 font-semibold">va boshqa kasblar</li>
          </ul>
        </Section>
      </div>

      <Section id="savollar" title="Ko‘p beriladigan savollar">
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card group p-5 open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-accent-strong transition-transform group-open:rotate-45 text-2xl leading-none" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-fg-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
        {SUPPORT && (
          <p className="mt-8 text-center text-muted">
            Boshqa savollar bo‘yicha javobni{" "}
            <a href={orderHref} className="font-semibold text-accent-strong hover:underline">
              @{SUPPORT}
            </a>{" "}
            dan olasiz.
          </p>
        )}
      </Section>

      <footer className="mesh border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-accent-strong" aria-hidden="true" />
          <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold">Saytingizni bugun buyurtma qiling</p>
          <p className="mt-2 text-muted">{PRICE} · bir martalik to‘lov</p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-fg-2">
            {["O‘z domeningiz", "3 til", "6 dizayn", "Admin panel"].map((x) => (
              <li key={x} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <OrderButtons />
          </div>
        </div>
      </footer>
    </main>
  );
}
