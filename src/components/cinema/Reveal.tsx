"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: "up" | "fade";
}

export default function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // trigger once only
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "none"
          : variant === "up"
          ? "translate3d(0, 24px, 0)"
          : "none",
        transitionProperty: "opacity, transform",
        transitionDuration: "900ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)", // easeOutExpo
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function WordReveal({
  text,
  delay = 0,
  className = "",
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className="inline-block overflow-hidden align-top mr-[0.25em] last:mr-0"
        >
          <span
            className="inline-block"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "none" : "translate3d(0, 110%, 0)",
              transitionProperty: "opacity, transform",
              transitionDuration: "800ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              transitionDelay: `${delay + idx * 70}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}
