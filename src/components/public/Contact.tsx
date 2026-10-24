"use client";

import { addDoc, collection } from "firebase/firestore";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Mail, Phone, Send, SendHorizonal } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { cn, externalUrl, telegramUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contact() {
  const { profile } = useSiteData();
  const { t, lang } = useLocale();
  const reduce = useReducedMotion();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [honeypot, setHoneypot] = useState("");

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = t("contact.validation.name");
    if (!EMAIL_RE.test(form.email.trim())) e.email = t("contact.validation.email");
    if (form.message.trim().length < 10) e.message = t("contact.validation.message");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (honeypot) return; // bot
    if (!validate()) return;
    setStatus("sending");
    try {
      await addDoc(collection(db, "messages"), {
        name: form.name.trim().slice(0, 120),
        email: form.email.trim().slice(0, 200),
        message: form.message.trim().slice(0, 4000),
        createdAt: Date.now(),
        read: false,
        locale: lang,
      });
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const direct = [
    profile.telegram && { href: telegramUrl(profile.telegram), label: t("contact.telegram"), Icon: Send },
    profile.linkedin && { href: externalUrl(profile.linkedin, "https://www.linkedin.com/in/"), label: t("contact.linkedin"), Icon: LinkedinIcon },
    profile.github && { href: externalUrl(profile.github, "https://github.com/"), label: t("contact.github"), Icon: GithubIcon },
    profile.email && { href: `mailto:${profile.email}`, label: t("contact.emailBtn"), Icon: Mail },
    profile.phone && { href: `tel:${profile.phone.replace(/[^\d+]/g, "")}`, label: t("contact.phone"), Icon: Phone },
  ].filter(Boolean) as { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }[];

  const inputCls = (err?: string) =>
    cn(
      "w-full rounded-2xl border bg-surface px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-accent/25 focus:border-accent",
      err ? "border-danger" : "border-line",
    );

  return (
    <Section id="contact" eyebrow={t("nav.contact")} title={t("contact.title")} subtitle={t("contact.subtitle")}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Reveal>
          {status === "sent" ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-8 text-center"
              role="status"
            >
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden="true" />
              <p className="mt-4 font-display text-xl font-semibold">{t("contact.sent")}</p>
              <p className="mt-1 text-muted">{t("contact.sentHint")}</p>
              <Button variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
                {t("contact.sendAnother")}
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={submit} noValidate className="card p-6 sm:p-8 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="block text-sm font-semibold mb-1.5">
                    {t("contact.name")}
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t("contact.placeholders.name")}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "c-name-err" : undefined}
                    className={inputCls(errors.name)}
                  />
                  {errors.name && (
                    <p id="c-name-err" className="mt-1 text-xs text-danger">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-sm font-semibold mb-1.5">
                    {t("contact.email")}
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t("contact.placeholders.email")}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "c-email-err" : undefined}
                    className={inputCls(errors.email)}
                  />
                  {errors.email && (
                    <p id="c-email-err" className="mt-1 text-xs text-danger">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="c-message" className="block text-sm font-semibold mb-1.5">
                  {t("contact.message")}
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t("contact.placeholders.message")}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "c-message-err" : undefined}
                  className={cn(inputCls(errors.message), "resize-y min-h-[8rem]")}
                />
                {errors.message && (
                  <p id="c-message-err" className="mt-1 text-xs text-danger">
                    {errors.message}
                  </p>
                )}
              </div>
              {/* Honeypot field for bots */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
              </div>
              {status === "error" && (
                <p className="text-sm text-danger" role="alert">
                  {t("contact.error")}
                </p>
              )}
              <Button type="submit" size="lg" loading={status === "sending"}>
                {status !== "sending" && <SendHorizonal className="h-4 w-4" aria-hidden="true" />}
                {status === "sending" ? t("contact.sending") : t("contact.send")}
              </Button>
            </form>
          )}
        </Reveal>

        {direct.length > 0 && (
          <Reveal delay={0.1}>
            <div className="card p-6 sm:p-8 h-full">
              <h3 className="font-display text-lg font-semibold">{t("contact.direct")}</h3>
              <ul className="mt-5 grid gap-3">
                {direct.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 font-semibold hover:border-accent hover:text-accent-strong transition"
                    >
                      <span className="h-9 w-9 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
