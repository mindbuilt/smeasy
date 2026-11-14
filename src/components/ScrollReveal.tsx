"use client";

import { CSSProperties, ReactNode, useEffect, useRef } from "react";

type Props = { children: ReactNode; delay?: number; style?: CSSProperties; className?: string };

/**
 * A light fade-up as sections scroll into view — a little joy, kept calm.
 * Content is visible by default (no JS, search engines, reduced motion);
 * only blocks that start below the fold are hidden and then revealed once.
 */
export default function ScrollReveal({ children, delay = 0, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen

    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.style.transition = `opacity 0.4s ease-out ${delay}ms, transform 0.4s ease-out ${delay}ms`;
      el.style.opacity = "1";
      el.style.transform = "none";
      io.disconnect();
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return <div ref={ref} className={className} style={style}>{children}</div>;
}
