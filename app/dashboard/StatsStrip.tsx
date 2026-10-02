// app/dashboard/StatsStrip.tsx
export default function StatsStrip({
    posts,
    followers,
    following,
    notifications,
}: {
    posts: number;
    followers: number;
    following: number;
    notifications: number;
}) {
    const stats = [
        { label: "Posts", value: posts, accent: "indigo" },
        { label: "Followers", value: followers, accent: "purple" },
        { label: "Following", value: following, accent: "pink" },
        { label: "Activity", value: notifications, accent: "cyan" },
    ];

    const accentMap: Record<string, string> = {
        indigo: "from-indigo-500 to-indigo-600",
        purple: "from-purple-500 to-purple-600",
        pink: "from-pink-500 to-pink-600",
        cyan: "from-cyan-500 to-cyan-600",
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="group relative rounded-2xl bg-white/90 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-xl p-4 overflow-hidden"
                >
                    <div
                        className={`absolute -top-8 -right-8 w-20 h-20 rounded-full bg-gradient-to-br ${accentMap[s.accent]} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`}
                    />
                    <div className="relative">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                            {s.label}
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 tabular-nums">
                            {s.value}
                        </p>
                        <div
                            className={`h-0.5 mt-3 rounded-full bg-gradient-to-r ${accentMap[s.accent]} opacity-60`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}