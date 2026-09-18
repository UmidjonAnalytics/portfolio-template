"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock, useMounted } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  label?: string;
  size?: "md" | "lg" | "xl" | "full";
  className?: string;
  /** Called for keys other than Escape/Tab (e.g. arrow navigation). */
  onKeyDown?: (e: KeyboardEvent) => void;
  hideClose?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const sizes = {
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[min(96vw,1200px)]",
};

/** Accessible modal: portal, focus trap, Esc to close, restores focus, locks scroll. */
export function Modal({ open, onClose, children, labelledBy, label, size = "lg", className, onKeyDown, hideClose, initialFocusRef }: ModalProps) {
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const t = useT();
  useBodyScrollLock(open);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      onKeyDown?.(e);
    },
    [onClose, onKeyDown],
  );

  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKey);
    const timer = window.setTimeout(() => {
      const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      target?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", handleKey);
      window.clearTimeout(timer);
      lastActive.current?.focus?.();
    };
  }, [open, handleKey, initialFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={label}
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative w-full bg-surface text-fg border border-line shadow-float outline-none",
              "rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain",
              sizes[size],
              className,
            )}
          >
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="absolute top-3 right-3 z-10 h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface/90 border border-line text-fg-2 hover:text-fg hover:bg-surface-2 transition"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Small confirmation dialog. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
  children,
  loading,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  children?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} size="md" labelledBy="confirm-title" hideClose>
      <div className="p-6 sm:p-7">
        <h2 id="confirm-title" className="font-display text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 rounded-full border border-line text-sm font-semibold hover:bg-surface-2 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "h-10 px-5 rounded-full text-sm font-semibold text-white transition disabled:opacity-50",
              danger ? "bg-danger hover:opacity-90" : "bg-accent hover:bg-accent-strong",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
