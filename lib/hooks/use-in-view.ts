"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Marge de déclenchement autour du viewport, syntaxe CSS. */
  rootMargin?: string;
  /** Part de l'élément visible avant déclenchement, entre 0 et 1. */
  threshold?: number;
}

interface UseInViewResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isInView: boolean;
}

/**
 * Signale qu'un élément est entré dans le viewport, une seule fois.
 *
 * Utilisé pour ne déclencher les animations d'apparition qu'au moment où la
 * section est réellement vue, et pour suspendre les rendus coûteux (shaders
 * WebGL) tant qu'ils sont hors écran.
 *
 * Sans IntersectionObserver, l'élément est considéré visible immédiatement :
 * le contenu reste accessible, seule l'animation est perdue.
 */
export function useInView<T extends HTMLElement>({
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.15,
}: UseInViewOptions = {}): UseInViewResult<T> {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, isInView };
}
