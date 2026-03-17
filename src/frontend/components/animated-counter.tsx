"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  decimals?: number;
  locale?: string;
  className?: string;
  prefixClassName?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix,
  decimals = 2,
  locale = "en-ZA",
  className,
  prefixClassName,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState("0.00");

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(latest) {
        setDisplay(
          latest.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        );
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, decimals, locale]);

  return (
    <span ref={ref} className={className}>
      {prefix && <span className={prefixClassName}>{prefix}</span>}
      {display}
    </span>
  );
}
