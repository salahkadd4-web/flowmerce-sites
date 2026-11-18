"use client";

// Connexion à l'espace vendeur — structure reprise de flowmerce-web-app
// (app/auth/login/page.tsx), sans inscription ni redirection admin.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction } from "./actions";
import { AuthShell, AUTH_BTN_PRIMARY, AUTH_INPUT, AUTH_LABEL } from "@/components/auth/AuthShell";

const BENEFITS = [
  "Landing pages et boutiques sans code",
  "Formulaire de commande COD intégré",
  "Fonctionnalités Flowmerce en un clic",
];

function LoginAside() {
  return (
    <>
      <div>
        <p className="text-lg font-bold leading-tight text-white">Espace vendeur</p>
        <p className="mt-2 text-[14px] leading-relaxed text-white/70">
          Créez et publiez vos landing pages.
        </p>
      </div>

      <ul className="mt-8 flex flex-col gap-3 list-none p-0">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/20"
            >
              <Check size={10} strokeWidth={3} className="text-white" />
            </span>
            <span className="text-[13px] leading-snug text-white/80">{b}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.set("email", form.email);
    fd.set("password", form.password);
    const result = await loginAction(fd);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  };

  return (
    <AuthShell
      eyebrow="Connexion"
      title="Bienvenue"
      subtitle="Accédez à votre espace vendeur."
      aside={<LoginAside />}
    >
      {error && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-control bg-red-50 px-3.5 py-3 text-[13px] text-red-700"
        >
          <AlertCircle size={16} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div>
          <label htmlFor="email" className={AUTH_LABEL}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={loading}
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <label htmlFor="password" className={AUTH_LABEL}>
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              disabled={loading}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className={`${AUTH_INPUT} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-control p-1 text-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className={`${AUTH_BTN_PRIMARY} mt-1 w-full`}>
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {loading ? "Connexion en cours" : "Se connecter"}
        </button>
      </form>
    </AuthShell>
  );
}
