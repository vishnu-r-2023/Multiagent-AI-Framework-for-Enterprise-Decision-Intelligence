import { useMemo, useState } from "react";
import AuthCard from "../components/AuthCard";
import loginBackground from "../assets/login bg.jpg";
import { useUser } from "../context/UserContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.13em] text-slate-300";
const FIELD_INPUT_CLASS =
  "h-11 w-full rounded-xl border border-white/25 bg-white/[0.07] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-emerald-300/80 focus:bg-white/[0.11] focus:ring-2 focus:ring-emerald-300/20";
const FIELD_ERROR_CLASS = "text-xs font-medium text-rose-200";

function Login({ onSwitchToSignup = () => {} }) {
  const { login } = useUser();
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardSubtitle = useMemo(
    () => "Log in with your email and password to continue to your analytics dashboard.",
    []
  );

  const validateForm = () => {
    const nextErrors = {};

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(formValues.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formValues.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => {
      if (!previous[name]) return previous;
      return {
        ...previous,
        [name]: "",
      };
    });

    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: formValues.email.trim(),
        password: formValues.password,
      });
      window.location.hash = "#dashboard";
    } catch (error) {
      setSubmitError(error.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <img
        src={loginBackground}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/65" />

      <div className="relative z-10 w-full max-w-[460px]">
        <AuthCard
          title="Welcome Back"
          subtitle={cardSubtitle}
          submitLabel="Login"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={submitError}
          footerText="Don't have an account?"
          footerActionLabel="Sign up"
          onFooterAction={onSwitchToSignup}
        >
          <label className="block space-y-1">
            <span className={FIELD_LABEL_CLASS}>Email</span>
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleFieldChange}
              className={FIELD_INPUT_CLASS}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
            {errors.email ? <p className={FIELD_ERROR_CLASS}>{errors.email}</p> : null}
          </label>

          <label className="block space-y-1">
            <span className={FIELD_LABEL_CLASS}>Password</span>
            <input
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleFieldChange}
              className={FIELD_INPUT_CLASS}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            {errors.password ? <p className={FIELD_ERROR_CLASS}>{errors.password}</p> : null}
          </label>
        </AuthCard>
      </div>
    </div>
  );
}

export default Login;
