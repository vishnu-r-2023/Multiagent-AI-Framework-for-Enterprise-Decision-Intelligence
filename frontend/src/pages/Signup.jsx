import { useMemo, useState } from "react";
import AuthCard from "../components/AuthCard";
import loginBackground from "../assets/login bg.jpg";
import { USER_ROLES } from "../config/navigation";
import { useUser } from "../context/UserContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_OPTIONS = [USER_ROLES.EMPLOYEE, USER_ROLES.MANAGER, USER_ROLES.ADMIN];
const FIELD_LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.13em] text-slate-300";
const FIELD_INPUT_CLASS =
  "h-9 w-full rounded-xl border border-white/25 bg-white/[0.07] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-emerald-300/80 focus:bg-white/[0.11] focus:ring-2 focus:ring-emerald-300/20";
const FIELD_ERROR_CLASS = "text-xs font-medium text-rose-200";

function Signup({ onSwitchToLogin = () => {} }) {
  const { signup } = useUser();
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    role: USER_ROLES.EMPLOYEE,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardSubtitle = useMemo(
    () => "Create your account with email and password to access the analytics dashboard.",
    []
  );

  const validateForm = () => {
    const nextErrors = {};

    if (!formValues.name.trim()) {
      nextErrors.name = "Name is required.";
    } else if (formValues.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(formValues.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formValues.password) {
      nextErrors.password = "Password is required.";
    } else if (formValues.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!formValues.role) {
      nextErrors.role = "Role is required.";
    }

    if (!formValues.confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required.";
    } else if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
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
      await signup({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        role: formValues.role,
        password: formValues.password,
      });
      window.location.hash = "#dashboard";
    } catch (error) {
      setSubmitError(error.message || "Signup failed. Please try again.");
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

      <div className="relative z-10 w-full max-w-[380px]">
        <AuthCard
          title="Create Account"
          subtitle={cardSubtitle}
          submitLabel="Sign up"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={submitError}
          footerText="Already have an account?"
          footerActionLabel="Login"
          onFooterAction={onSwitchToLogin}
          dense
        >
          <div className="grid grid-cols-1 gap-2">
            <label className="block space-y-1">
              <span className={FIELD_LABEL_CLASS}>Name</span>
              <input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleFieldChange}
                className={FIELD_INPUT_CLASS}
                placeholder="Enter your name"
                autoComplete="name"
                required
              />
              {errors.name ? <p className={FIELD_ERROR_CLASS}>{errors.name}</p> : null}
            </label>

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
              <span className={FIELD_LABEL_CLASS}>Role</span>
              <select
                name="role"
                value={formValues.role}
                onChange={handleFieldChange}
                className={FIELD_INPUT_CLASS}
                required
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role ? <p className={FIELD_ERROR_CLASS}>{errors.role}</p> : null}
            </label>

            <label className="block space-y-1">
              <span className={FIELD_LABEL_CLASS}>Password</span>
              <input
                type="password"
                name="password"
                value={formValues.password}
                onChange={handleFieldChange}
                className={FIELD_INPUT_CLASS}
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
              {errors.password ? <p className={FIELD_ERROR_CLASS}>{errors.password}</p> : null}
            </label>

            <label className="block space-y-1">
              <span className={FIELD_LABEL_CLASS}>Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={formValues.confirmPassword}
                onChange={handleFieldChange}
                className={FIELD_INPUT_CLASS}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
              />
              {errors.confirmPassword ? (
                <p className={FIELD_ERROR_CLASS}>{errors.confirmPassword}</p>
              ) : null}
            </label>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}

export default Signup;
