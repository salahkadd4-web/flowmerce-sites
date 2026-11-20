// blocks/i18n.ts — langue d'une page et textes fixes vus par l'acheteur.
//
// La langue est un réglage de la page (racine Puck). L'espace vendeur reste en
// français. Les traductions arabes sont à relire par Salah.

export const PAGE_LANGS = ["fr", "ar"] as const;
export type PageLang = (typeof PAGE_LANGS)[number];

export function isPageLang(value: unknown): value is PageLang {
  return typeof value === "string" && (PAGE_LANGS as readonly string[]).includes(value);
}

export type BuyerText = {
  quantity: string;
  decrease: string;
  increase: string;
  fullName: string;
  phone: string;
  phonePlaceholder: string;
  wilaya: string;
  chooseWilaya: string;
  commune: string;
  chooseWilayaFirst: string;
  chooseCommune: string;
  loadingCommunes: string;
  communesError: string;
  address: string;
  deliveryType: string;
  home: string;
  office: string;
  shipping: string;
  total: string;
  cod: string;
  sending: string;
  soldOutForm: string;
  /** « {amount} » : montant économisé. */
  save: string;
  soldOut: string;
  unavailable: string;
  photos: string;
  /** « {name} », « {n} » : nom du produit, numéro de la photo. */
  photoAlt: string;
  returnPolicy: string;
  thanksTitle: string;
  /** « {shop} » : nom de la boutique. */
  thanksCall: string;
  thanksCod: string;
  reference: string;
  backToShop: string;
  errors: {
    generic: string;
    network: string;
    variantId: string;
    quantity: string;
    customerName: string;
    phone: string;
    wilayaCode: string;
    commune: string;
    address: string;
    deliveryType: string;
  };
};

export const BUYER_TEXT: Record<PageLang, BuyerText> = {
  fr: {
    quantity: "Quantité",
    decrease: "Diminuer la quantité",
    increase: "Augmenter la quantité",
    fullName: "Nom complet",
    phone: "Téléphone",
    phonePlaceholder: "05 55 12 34 56",
    wilaya: "Wilaya",
    chooseWilaya: "Choisissez votre wilaya",
    commune: "Commune",
    chooseWilayaFirst: "Choisissez d'abord la wilaya",
    chooseCommune: "Choisissez votre commune",
    loadingCommunes: "Chargement…",
    communesError: "Impossible de charger les communes. Réessayez.",
    address: "Adresse",
    deliveryType: "Livraison",
    home: "À domicile",
    office: "Au bureau de livraison",
    shipping: "Livraison",
    total: "Total",
    cod: "Paiement à la livraison.",
    sending: "Envoi en cours…",
    soldOutForm: "Rupture de stock : ce produit n'est plus disponible pour le moment.",
    save: "Économisez {amount}",
    soldOut: "Rupture de stock",
    unavailable: "épuisé",
    photos: "Photos du produit",
    photoAlt: "{name} — photo {n}",
    returnPolicy: "Politique de retour",
    thanksTitle: "Merci ! Votre commande est enregistrée.",
    thanksCall: "{shop} va vous appeler pour confirmer votre commande. Gardez votre téléphone à portée de main.",
    thanksCod: "Vous paierez à la livraison.",
    reference: "Référence de votre commande :",
    backToShop: "Retour à la boutique",
    errors: {
      generic: "La commande n'a pas pu être envoyée. Réessayez.",
      network: "Connexion impossible. Vérifiez votre réseau et réessayez : votre commande ne sera pas envoyée deux fois.",
      variantId: "Ce choix est épuisé. Choisissez une autre option.",
      quantity: "Quantité invalide.",
      customerName: "Indiquez votre nom complet.",
      phone: "Numéro de téléphone invalide.",
      wilayaCode: "Choisissez votre wilaya.",
      commune: "Choisissez votre commune.",
      address: "Indiquez votre adresse.",
      deliveryType: "Choisissez un mode de livraison.",
    },
  },
  ar: {
    quantity: "الكمية",
    decrease: "إنقاص الكمية",
    increase: "زيادة الكمية",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    phonePlaceholder: "05 55 12 34 56",
    wilaya: "الولاية",
    chooseWilaya: "اختر ولايتك",
    commune: "البلدية",
    chooseWilayaFirst: "اختر الولاية أولاً",
    chooseCommune: "اختر بلديتك",
    loadingCommunes: "جارٍ التحميل…",
    communesError: "تعذّر تحميل البلديات. حاول مرة أخرى.",
    address: "العنوان",
    deliveryType: "التوصيل",
    home: "إلى المنزل",
    office: "إلى مكتب التوصيل",
    shipping: "التوصيل",
    total: "المجموع",
    cod: "الدفع عند الاستلام.",
    sending: "جارٍ الإرسال…",
    soldOutForm: "نفد المخزون: هذا المنتج غير متوفر حالياً.",
    save: "وفّر {amount}",
    soldOut: "نفد المخزون",
    unavailable: "نفد",
    photos: "صور المنتج",
    photoAlt: "{name} — الصورة {n}",
    returnPolicy: "سياسة الإرجاع",
    thanksTitle: "شكراً! تم تسجيل طلبك.",
    thanksCall: "سيتصل بك {shop} لتأكيد طلبك. أبقِ هاتفك قريباً منك.",
    thanksCod: "ستدفع عند الاستلام.",
    reference: "رقم طلبك:",
    backToShop: "العودة إلى المتجر",
    errors: {
      generic: "تعذّر إرسال الطلب. حاول مرة أخرى.",
      network: "تعذّر الاتصال. تحقّق من الشبكة وحاول مرة أخرى: لن يُرسَل طلبك مرتين.",
      variantId: "هذا الاختيار نفد. اختر خياراً آخر.",
      quantity: "الكمية غير صحيحة.",
      customerName: "أدخل اسمك الكامل.",
      phone: "رقم الهاتف غير صحيح.",
      wilayaCode: "اختر ولايتك.",
      commune: "اختر بلديتك.",
      address: "أدخل عنوانك.",
      deliveryType: "اختر طريقة التوصيل.",
    },
  },
};

/** Remplace « {clé} » dans un texte traduit. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}
