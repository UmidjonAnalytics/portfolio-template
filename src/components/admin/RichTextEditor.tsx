"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, Link2Off, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { useEffect, useId } from "react";
import { useLocale } from "@/lib/i18n";
import type { Localized } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Field, useFormLang } from "./fields";

function ToolbarButton({ onClick, active, label, children, disabled }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("h-8 w-8 inline-flex items-center justify-center rounded-lg transition disabled:opacity-40", active ? "bg-accent text-accent-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const { t } = useLocale();
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("admin.editor.linkPrompt"), prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
  };
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
      <ToolbarButton label={t("admin.editor.bold")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label={t("admin.editor.italic")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
      <ToolbarButton label={t("admin.editor.h2")} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label={t("admin.editor.h3")} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
      <ToolbarButton label={t("admin.editor.bullet")} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label={t("admin.editor.numbered")} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label={t("admin.editor.quote")} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
      <ToolbarButton label={t("admin.editor.link")} active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label={t("admin.editor.unlink")} disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}>
        <Link2Off className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <span className="flex-1" />
      <ToolbarButton label={t("admin.editor.undo")} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton label={t("admin.editor.redo")} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder, id }: { value: string; onChange: (html: string) => void; placeholder?: string; id?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, link: false }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "tiptap rich-text px-4 py-3 text-sm", id: id ?? "", "aria-multiline": "true", role: "textbox" },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Keep the editor in sync when the value is swapped from outside (language tab change).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next && !(current === "<p></p>" && next === "")) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="rounded-xl border border-line bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 transition">
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-line" />}
      <EditorContent editor={editor} data-placeholder={placeholder} />
    </div>
  );
}

export function LocalizedRichText({ label, value, onChange, hint, required }: { label: string; value: Localized; onChange: (v: Localized) => void; hint?: string; required?: boolean }) {
  const { lang } = useFormLang();
  const { t } = useLocale();
  const id = useId();
  return (
    <Field
      label={label}
      hint={hint}
      required={required && lang === "en"}
      htmlFor={id}
      right={
        <span className="flex items-center gap-2">
          {lang !== "en" && !value?.[lang] && <span className="text-[11px] text-muted italic">{t("admin.form.fallbackHint")}</span>}
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">{t(`lang.short.${lang}`)}</span>
        </span>
      }
    >
      <RichTextEditor key={lang} id={id} value={value?.[lang] ?? ""} onChange={(html) => onChange({ ...value, [lang]: html })} />
    </Field>
  );
}
