/**
 * Validación y saneo del checkout (México). Compartido entre cliente y API.
 */

export const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

export type MexicanState = (typeof MEXICAN_STATES)[number];

export const CHECKOUT_LIMITS = {
  name: 120,
  email: 254,
  street: 120,
  exterior: 12,
  interior: 12,
  neighborhood: 80,
  city: 80,
  zip: 5,
  notes: 500,
} as const;

export type CheckoutFormInput = {
  name: string;
  email: string;
  phone: string;
  street: string;
  exterior: string;
  interior: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormInput, string>>;

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Coincide respuesta de Google (o variantes) con la lista oficial de estados. */
export function resolveMexicanState(googleName: string): string {
  const raw = googleName.trim();
  if (!raw) return "";

  const exact = MEXICAN_STATES.find((s) => s === raw);
  if (exact) return exact;

  const norm = stripDiacritics(raw).toLowerCase();
  const aliases: Record<string, MexicanState> = {
    cdmx: "Ciudad de México",
    "ciudad de mexico": "Ciudad de México",
    "distrito federal": "Ciudad de México",
    df: "Ciudad de México",
    "edomex": "Estado de México",
    "estado de mexico": "Estado de México",
    "mex.": "Estado de México",
    "ver.": "Veracruz",
    "veracruz de ignacio de la llave": "Veracruz",
    "michoacan": "Michoacán",
    "michoacan de ocampo": "Michoacán",
    "queretaro": "Querétaro",
    "san luis potosi": "San Luis Potosí",
    "yucatan": "Yucatán",
  };

  if (aliases[norm]) return aliases[norm];

  for (const state of MEXICAN_STATES) {
    if (stripDiacritics(state).toLowerCase() === norm) return state;
  }

  const fuzzy = MEXICAN_STATES.find(
    (s) => norm.includes(stripDiacritics(s).toLowerCase()) || stripDiacritics(s).toLowerCase().includes(norm)
  );
  return fuzzy ?? raw;
}

function onlyDigits(s: string, max: number): string {
  return s.replace(/\D/g, "").slice(0, max);
}

/** Quitar caracteres de control y recortar. */
function cleanText(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

/** Nombre: letras (incl. latinas), espacios, apóstrofe, punto, guion. */
const NAME_CHARS = /^[\p{L}]+(?:[\p{L}\s'.-]*[\p{L}])?$/u;

/** Calle: letras, números, espacios y símbolos habituales en México. */
const STREET_RE =
  /^[\p{L}0-9\s#°º.,\-_/°]+$/u;

const EXT_NUM_RE = /^[\p{L}0-9\-_/]{1,12}$/u;

const NEIGHBORHOOD_RE = /^[\p{L}0-9\s°º.,\-#/]+$/u;

const CITY_RE = /^[\p{L}\s'.-]+$/u;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function sanitizeCheckoutField<K extends keyof CheckoutFormInput>(
  key: K,
  value: string
): string {
  const v = typeof value === "string" ? value : "";
  switch (key) {
    case "name":
      return cleanText(v).replace(/\s+/g, " ").slice(0, CHECKOUT_LIMITS.name);
    case "email":
      return cleanText(v).slice(0, CHECKOUT_LIMITS.email);
    case "phone":
      return onlyDigits(v, 10);
    case "street":
      return v.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, CHECKOUT_LIMITS.street);
    case "exterior":
    case "interior":
      return v.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, CHECKOUT_LIMITS.exterior);
    case "neighborhood":
      return v.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, CHECKOUT_LIMITS.neighborhood);
    case "city":
      return v.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, CHECKOUT_LIMITS.city);
    case "state":
      return cleanText(v).slice(0, 40);
    case "zip":
      return onlyDigits(v, CHECKOUT_LIMITS.zip);
    case "notes":
      return v.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, CHECKOUT_LIMITS.notes);
    default:
      return v;
  }
}

export function validateCheckoutForm(form: CheckoutFormInput): {
  ok: boolean;
  errors: CheckoutFormErrors;
} {
  const errors: CheckoutFormErrors = {};
  const name = cleanText(form.name);
  if (name.length < 3) errors.name = "Escribe al menos 3 caracteres";
  else if (name.length > CHECKOUT_LIMITS.name) errors.name = `Máximo ${CHECKOUT_LIMITS.name} caracteres`;
  else if (!NAME_CHARS.test(name)) errors.name = "Solo letras y espacios (sin números ni símbolos raros)";

  const email = cleanText(form.email).toLowerCase();
  if (!email) errors.email = "Correo requerido";
  else if (email.length > CHECKOUT_LIMITS.email) errors.email = "Correo demasiado largo";
  else if (!EMAIL_RE.test(email)) errors.email = "Formato de correo no válido";

  const phone = onlyDigits(form.phone, 10);
  if (phone.length !== 10) errors.phone = "Debe tener exactamente 10 dígitos";

  const street = form.street.trim();
  if (!street) errors.street = "Calle requerida";
  else if (street.length < 2) errors.street = "Muy corto";
  else if (street.length > CHECKOUT_LIMITS.street)
    errors.street = `Máximo ${CHECKOUT_LIMITS.street} caracteres`;
  else if (!STREET_RE.test(street))
    errors.street = "Usa solo letras, números y # ° . , - /";

  const exterior = form.exterior.trim();
  if (!exterior) errors.exterior = "Número exterior requerido";
  else if (!EXT_NUM_RE.test(exterior))
    errors.exterior = "Solo letras, números, guion o / (sin espacios raros)";
  else if (exterior.length > CHECKOUT_LIMITS.exterior)
    errors.exterior = `Máximo ${CHECKOUT_LIMITS.exterior} caracteres`;

  const interior = form.interior.trim();
  if (interior && !EXT_NUM_RE.test(interior))
    errors.interior = "Caracteres no permitidos en interior";
  else if (interior.length > CHECKOUT_LIMITS.interior)
    errors.interior = `Máximo ${CHECKOUT_LIMITS.interior} caracteres`;

  const neighborhood = form.neighborhood.trim();
  if (!neighborhood) errors.neighborhood = "Colonia requerida";
  else if (neighborhood.length > CHECKOUT_LIMITS.neighborhood)
    errors.neighborhood = `Máximo ${CHECKOUT_LIMITS.neighborhood} caracteres`;
  else if (!NEIGHBORHOOD_RE.test(neighborhood))
    errors.neighborhood = "Revisa caracteres en colonia";

  const city = form.city.trim();
  if (!city) errors.city = "Ciudad requerida";
  else if (city.length < 2) errors.city = "Muy corto";
  else if (city.length > CHECKOUT_LIMITS.city)
    errors.city = `Máximo ${CHECKOUT_LIMITS.city} caracteres`;
  else if (!CITY_RE.test(city)) errors.city = "Solo letras y espacios en ciudad";

  const zip = onlyDigits(form.zip, 5);
  if (zip.length !== 5) errors.zip = "El C.P. debe tener 5 dígitos";

  const state = cleanText(form.state);
  if (!state) errors.state = "Selecciona un estado";
  else if (!MEXICAN_STATES.includes(state as MexicanState)) errors.state = "Estado no válido";

  const notes = form.notes;
  if (notes.length > CHECKOUT_LIMITS.notes)
    errors.notes = `Máximo ${CHECKOUT_LIMITS.notes} caracteres`;

  return { ok: Object.keys(errors).length === 0, errors };
}

/** Validación de payloads crudos del API (strings unknown). */
export function validateCheckoutOrderBody(body: {
  customer?: { name?: string; email?: string; phone?: string };
  shipping?: Record<string, unknown>;
}): { ok: true; form: CheckoutFormInput } | { ok: false; error: string } {
  const c = body.customer;
  const s = body.shipping;
  if (!c || !s) return { ok: false, error: "Datos incompletos" };

  const form: CheckoutFormInput = {
    name: sanitizeCheckoutField("name", String(c.name ?? "")),
    email: sanitizeCheckoutField("email", String(c.email ?? "")),
    phone: sanitizeCheckoutField("phone", String(c.phone ?? "")),
    street: sanitizeCheckoutField("street", String(s.street ?? "")),
    exterior: sanitizeCheckoutField("exterior", String(s.exterior ?? "")),
    interior: sanitizeCheckoutField("interior", String(s.interior ?? "")),
    neighborhood: sanitizeCheckoutField("neighborhood", String(s.neighborhood ?? "")),
    city: sanitizeCheckoutField("city", String(s.city ?? "")),
    state: sanitizeCheckoutField("state", String(s.state ?? "")),
    zip: sanitizeCheckoutField("zip", String(s.zip ?? "")),
    notes: sanitizeCheckoutField("notes", String(s.notes ?? "")),
  };

  const { ok, errors } = validateCheckoutForm(form);
  if (!ok) {
    const first = Object.values(errors)[0];
    return { ok: false, error: first ?? "Datos inválidos" };
  }
  return { ok: true, form };
}
