import { memo } from "react";

function ReportTemplateCard({ template }) {
  return (
    <article className="glass-card group cursor-pointer rounded-xl border border-slate-100 p-6 transition-all hover:shadow-xl hover:shadow-primary/5">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${template.iconContainerClass}`}
      >
        <span className="material-symbols-outlined">{template.icon}</span>
      </div>
      <h4 className="mb-1 font-bold">{template.title}</h4>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        {template.description}
      </p>
      <span className="flex items-center gap-1 text-xs font-bold text-primary">
        Use Template
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </span>
    </article>
  );
}

export default memo(ReportTemplateCard);
