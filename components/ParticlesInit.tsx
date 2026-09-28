// components/ParticlesInit.tsx
"use client";

import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

const initEngine = async (engine: Engine) => {
    await loadSlim(engine);
};

export function ParticlesInit({ children }: { children: React.ReactNode }) {
    return (
        <ParticlesProvider init={initEngine}>
            {children}
        </ParticlesProvider>
    );
}