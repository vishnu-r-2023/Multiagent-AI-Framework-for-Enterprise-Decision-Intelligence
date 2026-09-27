import { memo } from "react";
import { useAnalytics } from "../../context/AnalyticsContext";

function ChartPanel({
  title,
  subtitle,
  actions = null,
  children,
  className = "",
  bodyClassName = "",
  requiresDataset = false,
  emptyMessage = "",
}) {
  const { datasetMeta } = useAnalytics();
  const hasDataset = Number(datasetMeta?.recordCount || 0) > 0;
  const showEmptyState = requiresDataset && !hasDataset;
  const resolvedEmptyMessage = emptyMessage || `Upload a dataset to view ${title}.`;

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions}
      </div>

      <div className={`relative ${bodyClassName}`}>
        {showEmptyState ? (
          <>
            <div className="invisible pointer-events-none">{children}</div>
            <p className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-sm text-slate-600 dark:text-slate-200">
              {resolvedEmptyMessage}
            </p>
          </>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default memo(ChartPanel);
