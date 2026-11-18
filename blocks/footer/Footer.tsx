// Pied de page : contacts, réseaux sociaux, politique de retour.
// Chaque lien repasse par isSafeHref au rendu, même s'il a été validé à l'enregistrement.

import { isSafeHref } from "@/blocks/shared";
import type { FooterProps } from "./schema";

const SOCIALS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
] as const;

const LINK = "font-semibold text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-control";

export function Footer(props: Omit<FooterProps, "id">) {
  const { shopName, phone, email, returnPolicy } = props;
  const tel = phone ? `tel:${phone.replace(/\s+/g, "")}` : "";
  const mail = email ? `mailto:${email}` : "";
  const socials = SOCIALS.filter(({ key }) => props[key] !== "" && isSafeHref(props[key]));

  return (
    <footer className="bg-deep px-4 py-10 text-white/80">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 text-[14px]">
        {shopName && <p className="text-lg font-bold text-white">{shopName}</p>}

        {(phone || email) && (
          <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
            {phone && isSafeHref(tel) && (
              <li>
                Téléphone : <a href={tel} className={LINK}>{phone}</a>
              </li>
            )}
            {email && isSafeHref(mail) && (
              <li>
                Email : <a href={mail} className={LINK}>{email}</a>
              </li>
            )}
          </ul>
        )}

        {socials.length > 0 && (
          <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
            {socials.map(({ key, label }) => (
              <li key={key}>
                <a href={props[key]} target="_blank" rel="noopener noreferrer" className={LINK}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {returnPolicy && (
          <div>
            <p className="mb-1 font-semibold text-white">Politique de retour</p>
            <p className="whitespace-pre-line leading-relaxed">{returnPolicy}</p>
          </div>
        )}

        {shopName && (
          <p className="border-t border-white/15 pt-4 text-[12px] text-white/60">
            © {new Date().getFullYear()} {shopName}
          </p>
        )}
      </div>
    </footer>
  );
}
