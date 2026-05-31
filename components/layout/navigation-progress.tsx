"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setProgress(0);
  }, []);

  // Listen for route changes
  useEffect(() => {
    // When pathname changes, the navigation is complete
    setIsNavigating(false);
    setProgress(100);
    const timer = setTimeout(() => setProgress(0), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Intercept link clicks for instant feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (
        link &&
        link.href &&
        link.href.startsWith(window.location.origin) &&
        !link.target &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const url = new URL(link.href);
        if (url.pathname !== pathname) {
          startNavigation();
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, startNavigation]);

  // Animate progress while navigating
  useEffect(() => {
    if (!isNavigating) return;

    setProgress(15);
    const t1 = setTimeout(() => setProgress(35), 100);
    const t2 = setTimeout(() => setProgress(55), 300);
    const t3 = setTimeout(() => setProgress(72), 600);
    const t4 = setTimeout(() => setProgress(85), 1200);
    const t5 = setTimeout(() => setProgress(92), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isNavigating]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div
        className="h-[2.5px] bg-gradient-to-r from-primary via-primary to-primary/50 transition-all ease-out shadow-sm shadow-primary/30"
        style={{
          width: `${progress}%`,
          transitionDuration: isNavigating ? "400ms" : "200ms",
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
