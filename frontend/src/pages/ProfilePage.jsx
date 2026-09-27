import { useEffect, useRef, useState } from "react";
import UserAvatarFallbackIcon from "../components/common/UserAvatarFallbackIcon";
import { useUser } from "../context/UserContext";

const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 320;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Invalid image format."));
    image.src = src;
  });

const buildAvatarDataUrl = async (file) => {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to process image.");
  }

  const square = Math.min(image.width, image.height);
  const sourceX = Math.max(0, (image.width - square) / 2);
  const sourceY = Math.max(0, (image.height - square) / 2);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sourceX, sourceY, square, square, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);

  return canvas.toDataURL("image/jpeg", 0.9);
};

function ProfilePage() {
  const { user, removeAvatar, updateAvatar, updateProfile } = useUser();
  const fileInputRef = useRef(null);

  const [formValues, setFormValues] = useState({
    name: user.name,
    email: user.email,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setFormValues({
      name: user.name,
      email: user.email,
    });
  }, [user.email, user.name]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    const nextName = formValues.name.trim();
    const nextEmail = formValues.email.trim();

    if (!nextName || !nextEmail) {
      setStatus({ tone: "error", message: "Name and email are required." });
      return;
    }

    try {
      await updateProfile({
        name: nextName,
        email: nextEmail,
      });
      setStatus({ tone: "success", message: "Profile details updated." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Unable to update profile details." });
    }
  };

  const handleAvatarSelection = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "error", message: "Please select an image file." });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setStatus({ tone: "error", message: "Image size must be under 5MB." });
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const avatarDataUrl = await buildAvatarDataUrl(file);
      await updateAvatar(avatarDataUrl);
      setStatus({ tone: "success", message: "Profile photo updated." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Unable to update profile photo." });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.avatar) {
      setStatus({ tone: "error", message: "No profile photo to remove." });
      return;
    }

    setIsRemovingAvatar(true);

    try {
      await removeAvatar();
      setStatus({ tone: "success", message: "Profile photo removed." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Unable to remove profile photo." });
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 lg:p-8">
      {status && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            status.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          }`}
        >
          {status.message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Photo</h2>

          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserAvatarFallbackIcon className="h-16 w-16 text-slate-500 dark:text-slate-300" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelection}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              disabled={isUploading || isRemovingAvatar}
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              {isUploading ? "Uploading..." : "Upload Photo"}
            </button>

            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:text-slate-200"
              disabled={isUploading || isRemovingAvatar || !user.avatar}
            >
              {isRemovingAvatar ? "Removing..." : "Remove Photo"}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              JPG, PNG, WebP supported. Maximum size: 5MB.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">User Details</h2>

          <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleProfileSave}>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</span>
              <input
                name="name"
                value={formValues.name}
                onChange={handleFieldChange}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-700 outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Enter name"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</span>
              <input
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleFieldChange}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-700 outline-none transition focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Enter email"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</span>
              <input
                value={user.role}
                readOnly
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
              />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                Save Profile
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}

export default ProfilePage;
