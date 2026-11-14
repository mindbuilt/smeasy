"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  /** Delay in ms before the entrance plays (use for staggers) */
  delay?: number;
  /** Override the entrance style */
  style?: CSSProperties;
  /** Class forwarding */
  className?: string;
};

/**
 * Wraps children in a div that animates in when scrolled into view.
 * Uses IntersectionObserver — no scroll-linked layout thrash.
 * Entrance: translate-up + fade. Triggers once, then stays.
 */
export default function ScrollReveal({ children, delay = 0, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Parallax wrapper — content moves at a different rate than scroll.
 * Subtle depth effect, not a full parallax hero.
 */
export function Parallax({ children, speed = 0.15, style, className }: {
  children: ReactNode; speed?: number; style?: CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      const viewCentre = window.innerHeight / 2;
      setOffset((centre - viewCentre) * speed);
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ ...style, transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  );
}
