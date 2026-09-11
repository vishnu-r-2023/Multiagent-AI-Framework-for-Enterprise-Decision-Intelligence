function AuthCard({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  isSubmitting = false,
  errorMessage = "",
  footerText,
  footerActionLabel,
  onFooterAction,
  dense = false,
  children,
}) {
  const cardPaddingClass = dense ? "p-5 sm:p-6" : "p-6 sm:p-8";
  const brandSizeClass = dense ? "text-[2.55rem] sm:text-[2.9rem]" : "text-[3.1rem]";
  const titleSizeClass = dense ? "text-2xl sm:text-[1.65rem]" : "text-2xl sm:text-[1.75rem]";
  const formSpacingClass = dense ? "space-y-3" : "space-y-4";
  const footerSpacingClass = dense ? "mt-4" : "mt-5";

  return (
    <section
      className={`relative w-full overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-b from-[#221d35]/92 via-[#11192c]/94 to-[#0a2928]/92 text-slate-100 shadow-[0_30px_90px_rgba(2,6,23,0.72)] backdrop-blur-xl ${cardPaddingClass}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(168,85,247,0.25),transparent_42%),radial-gradient(circle_at_95%_0%,rgba(59,130,246,0.2),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.18),transparent_45%)]" />

      <div className={`relative ${dense ? "mb-5" : "mb-7"}`}>
        <p
          className={`leading-none text-white ${brandSizeClass}`}
          style={{ fontFamily: '"Satisfy", "Dancing Script", "Kaushan Script", cursive' }}
        >
          Perform IQ
        </p>
        <h1 className={`mt-5 font-bold tracking-tight text-white ${titleSizeClass}`}>{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      </div>

      <form className={`relative ${formSpacingClass}`} onSubmit={onSubmit} noValidate>
        {children}

        {errorMessage ? (
          <p className="rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/[0.08] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(2,6,23,0.45)] backdrop-blur-sm transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-80"
          disabled={isSubmitting}
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-300/20 via-emerald-300/10 to-blue-300/20" />
          <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/4 -skew-x-12 bg-white/25 blur-sm transition-transform duration-500 group-hover:translate-x-[430%]" />
          <span className="relative z-10">{isSubmitting ? "Please wait..." : submitLabel}</span>
        </button>
      </form>

      <p className={`relative text-center text-sm text-slate-300 ${footerSpacingClass}`}>
        {footerText}{" "}
        <button
          type="button"
          onClick={onFooterAction}
          className="font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          {footerActionLabel}
        </button>
      </p>
    </section>
  );
}

export default AuthCard;
