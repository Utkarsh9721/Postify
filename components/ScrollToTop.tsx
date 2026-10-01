// components/ScrollToTop.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Don't fight the browser if the URL points to a hash anchor
        if (typeof window === "undefined" || window.location.hash) return;

        const reset = () =>
            window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

        reset();

        // Browsers sometimes restore scroll *after* paint — force it one more frame
        const raf = requestAnimationFrame(reset);
        return () => cancelAnimationFrame(raf);
    }, [pathname]);

    return null;
}