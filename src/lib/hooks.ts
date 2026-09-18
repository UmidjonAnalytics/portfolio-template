"use client";

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "./firebase";

export interface CollectionState<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
}

function sortByOrder<T extends { order?: number; createdAt?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
}

/**
 * Real-time subscription to a Firestore collection. Items are sorted client-side by `order`
 * so no composite index is needed. `publishedOnly` adds the `published == true` filter the
 * security rules require for anonymous visitors.
 */
export function useCollection<T extends { id: string; order?: number; createdAt?: number }>(
  name: string,
  options: { publishedOnly?: boolean; enabled?: boolean; sort?: (items: T[]) => T[] } = {},
): CollectionState<T> {
  const { publishedOnly = false, enabled = true } = options;
  const sortRef = useRef(options.sort);
  const [state, setState] = useState<CollectionState<T>>({ items: [], loading: enabled, error: null });

  useEffect(() => {
    sortRef.current = options.sort;
  });

  useEffect(() => {
    if (!enabled) {
      setState({ items: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const constraints: QueryConstraint[] = [];
    if (publishedOnly) constraints.push(where("published", "==", true));
    const q = query(collection(db, name), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as T);
        const items = sortRef.current ? sortRef.current(raw) : sortByOrder(raw);
        setState({ items, loading: false, error: null });
      },
      (error) => {
        console.error(`[firestore] ${name}:`, error);
        setState({ items: [], loading: false, error });
      },
    );
    return unsub;
  }, [name, publishedOnly, enabled]);

  return state;
}

export interface DocState<T> {
  data: T | null;
  loading: boolean;
  exists: boolean;
  error: Error | null;
}

/** Real-time subscription to one document. */
export function useDocument<T>(path: string, options: { enabled?: boolean } = {}): DocState<T> {
  const { enabled = true } = options;
  const [state, setState] = useState<DocState<T>>({ data: null, loading: enabled, exists: false, error: null });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, exists: false, error: null });
      return;
    }
    const [col, id] = path.split("/");
    const unsub = onSnapshot(
      doc(db, col, id),
      (snap) => {
        setState({ data: snap.exists() ? (snap.data() as T) : null, loading: false, exists: snap.exists(), error: null });
      },
      (error) => {
        console.error(`[firestore] ${path}:`, error);
        setState({ data: null, loading: false, exists: false, error });
      },
    );
    return unsub;
  }, [path, enabled]);

  return state;
}

/** Media query hook (SSR-safe, defaults to false). */
export function useMediaQuery(queryStr: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(queryStr);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [queryStr]);
  return matches;
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Lock body scroll while `locked` is true (used by modals and drawers). */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/** Returns true after the component has mounted on the client. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
