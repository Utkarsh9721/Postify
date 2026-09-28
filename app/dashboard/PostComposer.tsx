// app/dashboard/PostComposer.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function PostComposer({
    userInitial,
    userAvatar,
}: {
    userInitial: string;
    userAvatar: string;
}) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imagePublicId, setImagePublicId] = useState("");
    const [preview, setPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [focused, setFocused] = useState(false);

    function openPicker() {
        fileInputRef.current?.click();
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

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Upload failed");
                clearImage();
                return;
            }

            setImageUrl(data.url);
            setImagePublicId(data.publicId);
        } catch {
            alert("Upload error");
            clearImage();
        } finally {
            setUploading(false);
            URL.revokeObjectURL(objectUrl);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    function clearImage() {
        setPreview("");
        setImageUrl("");
        setImagePublicId("");
    }

    async function submit() {
        if ((!content.trim() && !imageUrl) || posting || uploading) return;
        setPosting(true);

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: content.trim() || " ",
                    image: imageUrl,
                    imagePublicId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to post");
                return;
            }

            setContent("");
            clearImage();
            router.refresh();
        } catch {
            alert("Network error");
        } finally {
            setPosting(false);
        }
    }

    const disabled = posting || uploading || (!content.trim() && !imageUrl);
    const charCount = content.length;
    const nearLimit = charCount > 1800;

    return (
        <div
            className={`relative bg-white rounded-2xl border transition-shadow duration-200 ${focused
                    ? "border-indigo-200 shadow-md"
                    : "border-gray-100 shadow-sm hover:border-gray-200"
                }`}
        >
            {/* Accent bar on focus */}
            <div
                className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-opacity duration-200 ${focused ? "opacity-100" : "opacity-0"
                    }`}
            />

            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-3.5">
                    {/* AUTHOR AVATAR */}
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                            {userAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={userAvatar}
                                    alt="you"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        {userInitial}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="What's on your mind?"
                            rows={3}
                            maxLength={2000}
                            className="w-full resize-none border-none focus:outline-none text-gray-800 placeholder-gray-400 bg-transparent text-sm sm:text-[15px] leading-relaxed"
                        />

                        {/* IMAGE PREVIEW */}
                        {(preview || imageUrl) && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={preview || imageUrl}
                                        alt="preview"
                                        className="w-full max-h-80 object-cover"
                                    />

                                    {/* Uploading overlay */}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                                            <svg
                                                className="animate-spin w-7 h-7 text-white"
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
                                            <span className="text-xs font-medium text-white/90">
                                                Uploading...
                                            </span>
                                        </div>
                                    )}

                                    {/* Remove button */}
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        disabled={uploading}
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 active:scale-90 transition-transform disabled:opacity-50"
                                        aria-label="Remove image"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ACTION BAR */}
                        <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-gray-100">
                            <div className="flex items-center gap-0.5">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFile}
                                    className="hidden"
                                />

                                <ToolbarButton
                                    onClick={openPicker}
                                    disabled={uploading}
                                    label="Add photo"
                                    icon={
                                        <svg
                                            className="w-[18px] h-[18px]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    }
                                />

                                <ToolbarButton
                                    onClick={() => { }}
                                    label="Emoji"
                                    icon={
                                        <svg
                                            className="w-[18px] h-[18px]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    }
                                />

                                <ToolbarButton
                                    onClick={() => { }}
                                    label="Location"
                                    icon={
                                        <svg
                                            className="w-[18px] h-[18px]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    }
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Character count — appears only near limit */}
                                {nearLimit && (
                                    <span
                                        className={`text-xs font-medium tabular-nums ${charCount > 1950
                                                ? "text-red-500"
                                                : "text-amber-500"
                                            }`}
                                    >
                                        {charCount}/2000
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={disabled}
                                    className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-sm hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
                                >
                                    {posting ? (
                                        <>
                                            <svg
                                                className="animate-spin w-4 h-4"
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
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            Post
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   Toolbar button — CSS-only hover, no motion
   ================================================================ */
function ToolbarButton({
    onClick,
    icon,
    label,
    disabled,
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
}) {
    return (
        <div className="relative group">
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={label}
            >
                {icon}
            </button>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap hidden sm:block">
                {label}
            </span>
        </div>
    );
}