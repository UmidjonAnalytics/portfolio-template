"use client";

import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Inbox, Mail, MailOpen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { db } from "@/lib/firebase";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { Message } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export default function MessagesPage() {
  const { t, lang } = useLocale();
  const { messages, ready } = useSiteData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const active = messages.find((m) => m.id === activeId) ?? null;
  const unread = messages.filter((m) => !m.read).length;

  useEffect(() => {
    if (active && !active.read) void updateDoc(doc(db, "messages", active.id), { read: true });
  }, [active]);

  const toggleRead = async (m: Message) => {
    try {
      await updateDoc(doc(db, "messages", m.id), { read: !m.read });
    } catch {
      toast.error(t("admin.crud.errorToast"));
    }
  };
  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteDoc(doc(db, "messages", deleting.id));
      if (activeId === deleting.id) setActiveId(null);
      toast.success(t("admin.crud.deletedToast"));
    } catch {
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader title={t("admin.messages.title")} subtitle={unread ? `${unread} ${t("admin.messages.unread").toLowerCase()}` : t("admin.messages.subtitle")} />

      {!ready ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState icon={Inbox} title={t("admin.messages.empty")} description={t("admin.messages.emptyHint")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <ul className={cn("space-y-2", active && "hidden lg:block")}>
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(m.id)}
                  aria-current={m.id === activeId ? "true" : undefined}
                  className={cn(
                    "w-full text-left card p-4 flex gap-3 transition hover:border-accent",
                    m.id === activeId && "border-accent bg-accent-soft/40",
                    !m.read && "border-l-4 border-l-accent",
                  )}
                >
                  <span className={cn("mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center", m.read ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent-strong")} aria-hidden="true">
                    {m.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate", !m.read ? "font-bold" : "font-semibold")}>{m.name}</span>
                      <span className="text-[11px] text-muted shrink-0">{formatDateTime(m.createdAt, lang)}</span>
                    </span>
                    <span className="block text-xs text-muted truncate">{m.email}</span>
                    <span className="block mt-1 text-sm text-fg-2 line-clamp-2">{m.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className={cn(!active && "hidden lg:block")}>
            {active ? (
              <article className="card p-6">
                <button type="button" onClick={() => setActiveId(null)} className="lg:hidden mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {t("common.back")}
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{active.name}</h2>
                    <a href={`mailto:${active.email}`} className="text-sm text-accent-strong hover:underline break-all">
                      {active.email}
                    </a>
                    <p className="mt-1 text-xs text-muted">
                      {t("admin.messages.received")}: {formatDateTime(active.createdAt, lang)}
                      {active.locale && ` · ${active.locale.toUpperCase()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleRead(active)}>
                      {active.read ? t("admin.messages.markUnread") : t("admin.messages.markRead")}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft" onClick={() => setDeleting(active)} aria-label={t("common.delete")}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <p className="mt-5 whitespace-pre-wrap leading-relaxed text-fg-2">{active.message}</p>
                <div className="mt-6 pt-5 border-t border-line">
                  <Button href={`mailto:${active.email}?subject=Re:%20${encodeURIComponent(active.name)}`}>
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {t("admin.messages.reply")}
                  </Button>
                </div>
              </article>
            ) : (
              <div className="card p-10 text-center text-muted">{t("admin.messages.selectHint")}</div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleting} title={t("admin.messages.deleteConfirm")} description={t("admin.crud.deleteConfirmHint")} confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={remove} onCancel={() => setDeleting(null)} danger />
    </>
  );
}
