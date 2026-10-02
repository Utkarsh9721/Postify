// app/dashboard/SuggestedUsers.tsx
export default function SuggestedUsers({
    users,
}: {
    users: { id: string; name: string; avatar: string; handle: string }[];
}) {
    return (
        <div className="rounded-3xl bg-white/90 border border-gray-100 shadow-sm p-4 sm:p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                Suggested for you
            </h3>
            <div className="space-y-3">
                {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                            {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {u.name[0]?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.handle}</p>
                        </div>
                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors">
                            Follow
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}