// app/profile/edit/EditProfileForm.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

export default function EditProfileForm({
    initial,
}: {
    initial: {
        id: string;
        name: string;
        bio: string;
        email: string;
        avatar: string;
    };
}) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(initial.name);
    const [bio, setBio] = useState(initial.bio);
    const [avatar, setAvatar] = useState(initial.avatar);
    const [preview, setPreview] = useState(initial.avatar);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const initialLetter = (name?.[0] ?? "U").toUpperCase();

    function openPicker() {
        fileRef.current?.click();
    }

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload/avatar", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Upload failed");
                setPreview(avatar);
                return;
            }

            setAvatar(data.url);
            setPreview(data.url);
        } catch {
            alert("Upload error");
            setPreview(avatar);
        } finally {
            setUploading(false);
            URL.revokeObjectURL(objectUrl);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    function removeAvatar() {
        setAvatar("");
        setPreview("");
    }

    async function save() {
        if (saving || !name.trim() || uploading) return;
        setSaving(true);
        try {
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, bio, avatar }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Failed to save");
                return;
            }
            router.push(`/profile/${initial.id}`);
            router.refresh();
        } catch {
            alert("Network error");
        } finally {
            setSaving(false);
        }
    }

    const disabled = saving || uploading || !name.trim();

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 pb-28 lg:pb-0">
            {/* Ambient background orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-[120px]" />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-[140px]" />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-pink-200/20 blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-2xl">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <Link
                            href={`/profile/${initial.id}`}
                            className="text-xs sm:text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1 group"
                        >
                            <svg
                                className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Back
                        </Link>
                        <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Edit profile
                        </h1>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={save}
                            disabled={disabled}
                            className="relative overflow-hidden px-5 py-2 rounded-full text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:shadow-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all group/btn"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_100%] group-hover/btn:animate-[gradient_2s_ease_infinite]" />
                            <span className="relative flex items-center gap-1.5">
                                {saving ? (
                                    <>
                                        <svg
                                            className="w-3.5 h-3.5 animate-spin"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Save
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.15)] p-6 sm:p-8 space-y-7 overflow-hidden"
                >
                    {/* Corner glow */}
                    <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />

                    {/* ─── AVATAR PICKER ─── */}
                    <div className="relative flex flex-col items-center gap-3">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFile}
                            className="hidden"
                        />

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={openPicker}
                            disabled={uploading}
                            className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-lg hover:shadow-xl hover:shadow-indigo-300/50 group disabled:opacity-60 transition-all duration-300"
                        >
                            <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                                {preview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={preview}
                                        alt="Avatar preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            {initialLetter}
                                        </span>
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    {uploading ? (
                                        <svg
                                            className="animate-spin w-6 h-6 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-6 h-6 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </motion.button>

                        <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <button
                                type="button"
                                onClick={openPicker}
                                disabled={uploading}
                                className="font-semibold text-indigo-600 hover:text-purple-600 transition-colors disabled:opacity-60"
                            >
                                {uploading ? "Uploading..." : "Change photo"}
                            </button>
                            {preview && (
                                <button
                                    type="button"
                                    onClick={removeAvatar}
                                    disabled={uploading}
                                    className="font-semibold text-red-500 hover:text-red-600 transition-colors disabled:opacity-60"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                            JPG, PNG, or WebP · Max 3 MB
                        </p>
                    </div>

                    {/* ─── NAME ─── */}
                    <div className="relative">
                        <label
                            htmlFor="name"
                            className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                        >
                            <svg
                                className="w-3.5 h-3.5 text-indigo-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            Name
                        </label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={60}
                            className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white shadow-sm hover:shadow-md transition-all duration-300"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 text-right">
                            {name.length}/60
                        </p>
                    </div>

                    {/* ─── BIO ─── */}
                    <div className="relative">
                        <label
                            htmlFor="bio"
                            className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                        >
                            <svg
                                className="w-3.5 h-3.5 text-indigo-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h7"
                                />
                            </svg>
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            maxLength={200}
                            placeholder="Tell people a little about yourself..."
                            className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white shadow-sm hover:shadow-md transition-all duration-300"
                        />
                        <p
                            className={`text-[11px] mt-1 text-right tabular-nums ${bio.length > 180
                                    ? "text-amber-500"
                                    : "text-gray-400"
                                }`}
                        >
                            {bio.length}/200
                        </p>
                    </div>

                    {/* ─── EMAIL ─── */}
                    <div className="relative">
                        <label
                            htmlFor="email"
                            className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
                        >
                            <svg
                                className="w-3.5 h-3.5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                            Email
                            <span className="ml-auto text-[10px] font-normal text-gray-400 italic">
                                Cannot be changed
                            </span>
                        </label>
                        <input
                            id="email"
                            value={initial.email}
                            disabled
                            className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-gray-100/60 text-gray-500 text-sm cursor-not-allowed"
                        />
                    </div>
                </motion.div>

                {/* Bottom helper note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-center text-xs text-gray-400 mt-6"
                >
                    Your changes are visible to everyone on Socially.
                </motion.p>
            </main>
        </div>
    );
}