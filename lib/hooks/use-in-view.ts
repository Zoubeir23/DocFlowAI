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
  /** Visibilité courante : repasse à `false` quand l'élément ressort du viewport. */
  isInView: boolean;
  /** Reste vrai après le premier passage dans le viewport. */
  hasBeenInView: boolean;
}

/**
 * Observe l'entrée et la sortie d'un élément du viewport.
 *
 * `hasBeenInView` sert aux animations d'apparition, qui ne doivent jouer qu'une
 * fois ; `isInView` sert à suspendre les rendus coûteux (shaders WebGL) dès que
 * l'élément s'éloigne, pour ne pas garder de contexte GPU vivant inutilement.
 *
 * Sans IntersectionObserver, l'élément est considéré visible immédiatement :
 * le contenu reste accessible, seule l'animation est perdue.
 */
export function useInView<T extends HTMLElement>({
  rootMargin = "200px 0px",
  threshold = 0,
}: UseInViewOptions = {}): UseInViewResult<T> {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      setHasBeenInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenInView(true);
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, isInView, hasBeenInView };
}
