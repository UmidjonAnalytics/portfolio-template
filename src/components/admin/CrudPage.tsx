"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/hooks";
import { useLocale, type TVars } from "@/lib/i18n";
import type { BaseItem, CollectionName, Localized } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { EmptyState } from "./EmptyState";
import { FormLangProvider, LangTabs, Toggle } from "./fields";
import { PageHeader } from "./AdminShell";

const timestamp = () => Date.now();

type Tr = (v: Localized | string | undefined | null) => string;
type T = (key: string, vars?: TVars) => string;

export interface CrudConfig<Item extends BaseItem> {
  collection: CollectionName;
  itemKey: "skill" | "project" | "experience" | "certificate" | "education" | "testimonial" | "post";
  icon: LucideIcon;
  getTitle: (item: Item, tr: Tr) => string;
  getSubtitle?: (item: Item, tr: Tr, t: T) => string;
  getThumb?: (item: Item) => string | undefined;
  /** Square thumbnails (avatars) instead of 4:3 */
  squareThumb?: boolean;
  newItem: () => Omit<Item, keyof BaseItem>;
  Form: React.ComponentType<{ value: Item; onChange: (v: Item) => void }>;
  validate?: (item: Item, t: T) => string | null;
  /** Hook to normalise the item before saving (e.g. generate a slug). */
  beforeSave?: (item: Item) => Item;
}

function Row<Item extends BaseItem>({
  item,
  config,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  item: Item;
  config: CrudConfig<Item>;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const { t, tr } = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const thumb = config.getThumb?.(item);
  const title = config.getTitle(item, tr);
  const subtitle = config.getSubtitle?.(item, tr, t);

  return (
    <li ref={setNodeRef} style={style} className={cn("card flex items-center gap-3 p-3 sm:p-3.5", isDragging && "opacity-70 shadow-float z-10 relative")}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t("common.dragToReorder")}
        title={t("common.dragToReorder")}
        className="touch-none h-9 w-7 shrink-0 inline-flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-surface-2 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {config.getThumb && (
        <div className={cn("relative shrink-0 rounded-lg overflow-hidden bg-surface-2 border border-line", config.squareThumb ? "h-11 w-11 rounded-full" : "h-11 w-16")}>
          {thumb ? <SmartImage src={thumb} alt="" fill sizes="64px" className="object-cover" /> : <config.icon className="absolute inset-0 m-auto h-5 w-5 text-muted" aria-hidden="true" />}
        </div>
      )}

      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left">
        <p className="font-semibold truncate">{title || <span className="text-muted italic">—</span>}</p>
        {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
      </button>

      <span
        className={cn(
          "hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
          item.published ? "bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-success" : "bg-surface-2 text-muted",
        )}
      >
        {item.published ? t("admin.crud.statusPublished") : t("admin.crud.statusDraft")}
      </span>
      <button
        type="button"
        onClick={onTogglePublish}
        aria-label={item.published ? t("common.unpublish") : t("common.publish")}
        aria-pressed={item.published}
        title={item.published ? t("common.unpublish") : t("common.publish")}
        className={cn("h-9 w-9 inline-flex items-center justify-center rounded-full border transition", item.published ? "border-transparent bg-accent-soft text-accent-strong" : "border-line text-muted hover:text-fg")}
      >
        {item.published ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
      </button>
      <button type="button" onClick={onEdit} aria-label={t("common.edit")} title={t("common.edit")} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line text-fg-2 hover:bg-surface-2">
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onDelete} aria-label={t("common.delete")} title={t("common.delete")} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line text-muted hover:text-danger hover:bg-danger-soft">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export function CrudPage<Item extends BaseItem>({ config, title, subtitle }: { config: CrudConfig<Item>; title: string; subtitle?: string }) {
  const { t, tr } = useLocale();
  const { items, loading } = useCollection<Item>(config.collection);
  const [ordered, setOrdered] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const itemLabel = t(`admin.crud.items.${config.itemKey}`);
  const Icon = config.icon;

  useEffect(() => setOrdered(items), [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const counts = useMemo(() => ({ published: items.filter((i) => i.published).length, drafts: items.filter((i) => !i.published).length }), [items]);

  const openNew = () => {
    const base = config.newItem() as Omit<Item, keyof BaseItem>;
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order ?? 0), -1);
    setEditing({ ...base, id: "", published: true, order: maxOrder + 1, createdAt: 0, updatedAt: 0 } as Item);
    setIsNew(true);
    setDirty(false);
  };
  const openEdit = (item: Item) => {
    setEditing(item);
    setIsNew(false);
    setDirty(false);
  };
  const requestClose = () => {
    if (dirty) setAskDiscard(true);
    else setEditing(null);
  };

  const save = async () => {
    if (!editing) return;
    let item = editing;
    if (config.beforeSave) item = config.beforeSave(item);
    const err = config.validate?.(item, t);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const { id, ...data } = item;
      const now = Date.now();
      if (isNew) {
        await addDoc(collection(db, config.collection), { ...data, createdAt: now, updatedAt: now });
      } else {
        await setDoc(doc(db, config.collection, id), { ...data, updatedAt: now });
      }
      toast.success(t("admin.crud.savedToast"));
      setEditing(null);
      setDirty(false);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteDoc(doc(db, config.collection, deleting.id));
      toast.success(t("admin.crud.deletedToast"));
      if (editing?.id === deleting.id) setEditing(null);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setDeleting(null);
    }
  };

  const togglePublish = async (item: Item) => {
    try {
      await updateDoc(doc(db, config.collection, item.id), { published: !item.published, updatedAt: timestamp() });
      toast.success(item.published ? t("admin.crud.unpublishedToast") : t("admin.crud.publishedToast"));
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ordered.findIndex((i) => i.id === active.id);
    const to = ordered.findIndex((i) => i.id === over.id);
    const next = arrayMove(ordered, from, to);
    setOrdered(next);
    try {
      const batch = writeBatch(db);
      next.forEach((item, index) => {
        if (item.order !== index) batch.update(doc(db, config.collection, item.id), { order: index });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
      setOrdered(items);
    }
  };

  const formRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle ?? (items.length ? t("admin.crud.countPublished", counts) : undefined)}
        action={
          items.length > 0 ? (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("admin.crud.add", { item: itemLabel })}
            </Button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Icon} title={t("admin.crud.addFirst", { item: itemLabel })} description={t(`admin.crud.empty.${config.collection}`)} actionLabel={t("admin.crud.addFirst", { item: itemLabel })} onAction={openNew} />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">{t("admin.crud.reorderHint")}</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {ordered.map((item) => (
                  <Row key={item.id} item={item} config={config} onEdit={() => openEdit(item)} onDelete={() => setDeleting(item)} onTogglePublish={() => togglePublish(item)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Modal open={!!editing} onClose={requestClose} size="lg" labelledBy="crud-title" hideClose>
        {editing && (
          <FormLangProvider>
            <div ref={formRef} className="flex flex-col max-h-[92vh] sm:max-h-[90vh]">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 backdrop-blur px-5 sm:px-7 py-4">
                <h2 id="crud-title" className="font-display text-lg font-semibold truncate">
                  {isNew ? t("admin.crud.creating", { item: itemLabel }) : t("admin.crud.editing", { item: itemLabel })}
                </h2>
                <LangTabs />
              </div>
              <div className="px-5 sm:px-7 py-5 space-y-6 overflow-y-auto">
                <config.Form
                  value={editing}
                  onChange={(v) => {
                    setEditing(v);
                    setDirty(true);
                  }}
                />
                <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
                  <Toggle
                    checked={editing.published}
                    onChange={(v) => {
                      setEditing({ ...editing, published: v });
                      setDirty(true);
                    }}
                    label={t("admin.crud.publishToggle")}
                    description={t("admin.crud.publishHelp")}
                  />
                </div>
              </div>
              <div className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-surface/95 backdrop-blur px-5 sm:px-7 py-3">
                {!isNew && (
                  <Button variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setDeleting(editing)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("common.delete")}
                  </Button>
                )}
                <span className="flex-1 text-xs text-muted">{dirty ? t("common.unsaved") : ""}</span>
                <Button variant="outline" onClick={requestClose}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={save} loading={saving}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </div>
          </FormLangProvider>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={t("admin.crud.deleteConfirm", { name: deleting ? config.getTitle(deleting, tr) : "" })}
        description={t("admin.crud.deleteConfirmHint")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
        danger
      />
      <ConfirmDialog
        open={askDiscard}
        title={t("admin.crud.discard")}
        description={t("admin.crud.discardHint")}
        confirmLabel={t("common.yes")}
        cancelLabel={t("common.no")}
        onConfirm={() => {
          setAskDiscard(false);
          setEditing(null);
          setDirty(false);
        }}
        onCancel={() => setAskDiscard(false)}
        danger
      />
    </>
  );
}
