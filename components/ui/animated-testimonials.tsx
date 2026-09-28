// components/ui/animated-testimonials.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = true,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Auto-advance
  useEffect(() => {
    if (!autoplay || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoplay, shouldReduceMotion, testimonials.length]);

  const current = testimonials[active];

  return (
    <div className="mx-auto max-w-4xl px-4">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20 items-center">
        {/* Image column */}
        <div className="relative h-72 w-full md:h-96">
          <div className="absolute inset-0 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.src}
              src={current.src}
              alt={current.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Content column */}
        <div>
          <motion.div
            key={active}
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: 12 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <p className="text-lg text-neutral-200 leading-relaxed md:text-xl">
              &ldquo;{current.quote}&rdquo;
            </p>

            <div className="mt-8">
              <p className="font-semibold text-white">
                {current.name}
              </p>
              <p className="text-sm text-neutral-500">
                {current.designation}
              </p>
            </div>
          </motion.div>

          {/* Dots */}
          <div className="mt-8 flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active
                    ? "w-8 bg-white"
                    : "w-2 bg-neutral-700 hover:bg-neutral-500"
                  }`}
                aria-label={`Show testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTestimonials;