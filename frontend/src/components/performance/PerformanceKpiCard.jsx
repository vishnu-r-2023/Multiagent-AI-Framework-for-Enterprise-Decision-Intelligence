import { memo } from "react";

const changeClassByTone = {
  positive: "bg-green-100 text-green-600",
  negative: "bg-red-100 text-red-600",
};

function PerformanceKpiCard({ item }) {
  return (
    <article className="glass-card flex flex-col gap-1 rounded-2xl p-6 transition-shadow hover:shadow-xl">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{item.title}</span>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${
            changeClassByTone[item.changeTone]
          }`}
        >
          {item.change}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-slate-900">
          {item.value}
        </span>
        <span className="text-sm font-normal text-slate-400">{item.suffix}</span>
      </div>

      {item.detailType === "progress" && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
        </div>
      )}

      {item.detailType === "avatars" && (
        <div className="mt-4 flex -space-x-2">
          {item.avatars.map((avatar, index) => (
            <img
              key={`${item.title}-avatar-${index}`}
              src={avatar}
              alt={`Employee avatar ${index + 1}`}
              className="h-6 w-6 rounded-full border-2 border-white object-cover"
            />
          ))}
          <div className="flex h-6 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500">
            {item.avatarOverflow}
          </div>
        </div>
      )}

      {item.detailType === "note" && (
        <div className="mt-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-green-500">
            verified
          </span>
          <span className="text-xs text-slate-500">{item.note}</span>
        </div>
      )}
    </article>
  );
}

export default memo(PerformanceKpiCard);
