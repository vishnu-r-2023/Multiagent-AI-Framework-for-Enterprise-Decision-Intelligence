function UserAvatarFallbackIcon({ className = "h-5 w-5 text-slate-600 dark:text-slate-200" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21a7 7 0 0 0-14 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export default UserAvatarFallbackIcon;
