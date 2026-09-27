"use client";

import { ImagesSlider } from "@/components/ui/images-slider";
import { Compare } from "@/components/ui/compare";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">

      {/* HERO */}
      <section className="h-screen">
        <ImagesSlider
          className="h-full"
          images={[
            "https://i.pinimg.com/1200x/ac/a0/7a/aca07ae5073e87e089724ad2dace058b.jpg",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
          ]}
        >
          <div className="relative z-50 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="text-5xl font-bold text-white md:text-7xl">
              Post_XS
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
              Connect with your friends and chat in real time.
            </p>

            <div className="mt-8 flex gap-4">
              <a
                href="/login"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
              >
                Login
              </a>

              <a
                href="/register"
                className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Create Account
              </a>
            </div>
          </div>
        </ImagesSlider>
      </section>

      {/* COMPARE */}
      <section className="bg-black px-6 py-24">
        <div className="mx-auto max-w-6xl">

          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              See the Difference
            </h2>

            <p className="mt-4 text-gray-400">
              Drag across the image to interact with the comparison.
            </p>
          </div>

          <div className="flex justify-center">
            <Compare
              firstImage="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
              secondImage="https://images.unsplash.com/photo-1497366754035-f200968a6e72"
              className="h-[400px] w-[700px]"
              slideMode="drag"
            />
          </div>

        </div>
      </section>

    </main>
  );
}