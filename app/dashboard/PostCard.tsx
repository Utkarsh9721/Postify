// app/dashboard/PostCard.tsx
"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export type PostCardProps = {
    id: string;
    author: string;
    handle: string;
    initial: string;
    avatar: string;
    content: string;
    image: string;
    createdAt: string;
    likesCount: number;
    likedByMe: boolean;
    commentsCount: number;
    sharesCount: number;
    isOwner: boolean;
    /** Set true only for the first card in the feed — makes the browser download it eagerly. */
    priority?: boolean;
};

type Comment = {
    id: string;
    content: string;
    user: { name: string; initial: string; avatar: string };
};

export default function PostCard({
    id,
    author,
    handle,
    initial,
    avatar,
    content,
    image,
    createdAt,
    likesCount,
    likedByMe,
    commentsCount,
    sharesCount,
    isOwner,
    priority = false,
}: PostCardProps) {
    const router = useRouter();

    const [liked, setLiked] = useState(likedByMe);
    const [likes, setLikes] = useState(likesCount);
    const [comments, setComments] = useState(commentsCount);
    const [showComments, setShowComments] = useState(false);
    const [commentList, setCommentList] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);

    async function toggleLike() {
        const next = !liked;
        setLiked(next);
        setLikes((n) => n + (next ? 1 : -1));

        try {
            const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
            if (!res.ok) {
                setLiked(!next);
                setLikes((n) => n + (next ? -1 : 1));
                return;
            }
            const data = await res.json();
            setLiked(data.liked);
            setLikes(data.likesCount);
        } catch {
            setLiked(!next);
            setLikes((n) => n + (next ? -1 : 1));
        }
    }

    async function openComments() {
        const willShow = !showComments;
        setShowComments(willShow);

        if (willShow && commentList.length === 0) {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/posts/${id}/comments`);
                const data = await res.json();
                if (res.ok) {
                    setCommentList(
                        (data.comments || []).map((c: any) => ({
                            id: c.id,
                            content: c.content,
                            user: {
                                name: c.user?.name ?? "Unknown",
                                initial: (c.user?.name?.[0] ?? "U").toUpperCase(),
                                avatar: c.user?.avatar ?? "",
                            },
                        }))
                    );
                }
            } catch {
                // ignore
            } finally {
                setLoadingComments(false);
            }
        }
    }

    async function addComment() {
        if (!commentText.trim() || postingComment) return;
        setPostingComment(true);

        try {
            const res = await fetch(`/api/posts/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: commentText }),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to comment");
                return;
            }

            setCommentList((list) => [
                ...list,
                {
                    id: data.comment.id,
                    content: data.comment.content,
                    user: {
                        name: data.comment.user?.name ?? "You",
                        initial: (data.comment.user?.name?.[0] ?? "Y").toUpperCase(),
                        avatar: data.comment.user?.avatar ?? "",
                    },
                },
            ]);
            setComments((n) => n + 1);
            setCommentText("");
        } catch {
            alert("Network error");
        } finally {
            setPostingComment(false);
        }
    }

    async function deletePost() {
        if (!confirm("Delete this post?")) return;
        const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
        if (res.ok) {
            router.refresh();
        } else {
            const data = await res.json();
            alert(data.message || "Failed to delete");
        }
    }

    return (
        <article className="group/post relative bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="p-4 sm:p-5">
                {/* ─── HEADER ─── */}
                <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatar}
                                    alt={author}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        {initial}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-semibold text-gray-900 text-sm sm:text-[15px] truncate">
                                        {author}
                                    </h3>
                                    <span className="text-xs text-gray-400 truncate">
                                        {handle}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs text-gray-400">{createdAt}</span>
                                    <span className="text-gray-300">·</span>
                                    <svg
                                        className="w-3 h-3 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {isOwner && (
                                <button
                                    onClick={deletePost}
                                    className="flex-shrink-0 p-1.5 -m-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/post:opacity-100"
                                    title="Delete post"
                                    aria-label="Delete post"
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── CONTENT ─── */}
                {content && content.trim() && (
                    <p className="text-gray-700 text-sm sm:text-[15px] mt-3 leading-relaxed whitespace-pre-wrap break-words">
                        {content}
                    </p>
                )}

                {/* ─── IMAGE (optimized with next/image) ─── */}
                {image && (
                    <div className="mt-3 -mx-4 sm:-mx-5">
                        <div className="relative overflow-hidden bg-gray-100 aspect-[3/2]">
                            <Image
                                src={image}
                                alt="Post image"
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 700px"
                                className="object-cover"
                                priority={priority}
                                loading={priority ? "eager" : "lazy"}
                            />
                        </div>
                    </div>
                )}

                {/* ─── ACTION BAR ─── */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 -ml-2">
                        <ActionButton
                            onClick={toggleLike}
                            active={liked}
                            activeColor="text-pink-500"
                            hoverColor="hover:text-pink-500 hover:bg-pink-50"
                            label={likes}
                            icon={
                                <svg
                                    className="w-[18px] h-[18px]"
                                    fill={liked ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            }
                        />

                        <ActionButton
                            onClick={openComments}
                            active={showComments}
                            activeColor="text-indigo-600"
                            hoverColor="hover:text-indigo-600 hover:bg-indigo-50"
                            label={comments}
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
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            }
                        />

                        <ActionButton
                            onClick={() => { }}
                            activeColor="text-green-600"
                            hoverColor="hover:text-green-600 hover:bg-green-50"
                            label={sharesCount}
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
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                    />
                                </svg>
                            }
                        />
                    </div>

                    <button
                        className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        aria-label="Save post"
                    >
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
                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                        </svg>
                    </button>
                </div>

                {/* ─── COMMENTS ─── */}
                <AnimatePresence initial={false}>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                {loadingComments ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin" />
                                        Loading comments...
                                    </div>
                                ) : commentList.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-2">
                                        No comments yet. Be the first to comment.
                                    </p>
                                ) : (
                                    commentList.map((c) => (
                                        <div key={c.id} className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                                                {c.user.avatar ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={c.user.avatar}
                                                        alt={c.user.name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white">
                                                            {c.user.initial}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2">
                                                <p className="text-[11px] font-semibold text-gray-900">
                                                    {c.user.name}
                                                </p>
                                                <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
                                                    {c.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addComment();
                                            }
                                        }}
                                        placeholder="Write a comment..."
                                        maxLength={500}
                                        className="flex-1 px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                                    />
                                    <button
                                        onClick={addComment}
                                        disabled={postingComment || !commentText.trim()}
                                        className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-sm hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                                    >
                                        {postingComment ? "..." : "Post"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </article>
    );
}

/* ================================================================
   Action button — reusable with CSS-only tap feedback
   ================================================================ */
function ActionButton({
    onClick,
    icon,
    label,
    active,
    activeColor = "",
    hoverColor = "",
}: {
    onClick: () => void;
    icon: React.ReactNode;
    label: number;
    active?: boolean;
    activeColor?: string;
    hoverColor?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 transition-colors duration-150 active:scale-90 ${active ? activeColor : ""
                } ${hoverColor}`}
        >
            {icon}
            <span className="text-xs font-medium tabular-nums">{label}</span>
        </button>
    );
}