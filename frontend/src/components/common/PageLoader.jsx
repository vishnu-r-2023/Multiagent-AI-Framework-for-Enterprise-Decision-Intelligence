function PageLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center px-6 py-16">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm">
        <svg
          className="h-4 w-4 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        Loading dashboard module...
      </div>
    </div>
  );
}

export default PageLoader;
