"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { resolveMexicanState } from "@/lib/checkout-validation";

export type ParsedPlaceAddress = {
  street: string;
  exterior: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

function parsePlaceAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined
): ParsedPlaceAddress | null {
  if (!components?.length) return null;

  let streetNumber = "";
  let route = "";
  let sublocality = "";
  let neighborhood = "";
  let postalCode = "";
  let locality = "";
  let admin2 = "";
  let admin1 = "";

  for (const c of components) {
    const types = c.types;
    if (types.includes("street_number")) streetNumber = c.long_name;
    if (types.includes("route")) route = c.long_name;
    if (types.includes("postal_code"))
      postalCode = c.long_name.replace(/\D/g, "").slice(0, 5);
    if (types.includes("sublocality") || types.includes("sublocality_level_1"))
      sublocality = c.long_name;
    if (types.includes("neighborhood")) neighborhood = c.long_name;
    if (types.includes("locality")) locality = c.long_name;
    if (types.includes("administrative_area_level_2")) admin2 = c.long_name;
    if (types.includes("administrative_area_level_1")) admin1 = c.long_name;
  }

  const colonia = neighborhood || sublocality;
  let city = locality || admin2 || "";
  if (!city && (admin1 === "Ciudad de México" || stripNorm(admin1).includes("ciudad de mexico")))
    city = "Ciudad de México";

  const state = resolveMexicanState(admin1);
  const street = route.trim();
  const ext = streetNumber.trim() || "S/N";

  if (!street && !colonia) return null;

  return {
    street: street || colonia,
    exterior: ext,
    neighborhood: colonia || city || "",
    city: city || "",
    state,
    zip: postalCode,
  };
}

function stripNorm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  if (!mapsLoadPromise) {
    mapsLoadPromise = new Promise((resolve, reject) => {
      const id = "google-maps-places-js";
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        if (window.google?.maps?.places) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => {
            mapsLoadPromise = null;
            reject(new Error("maps script error"));
          },
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.id = id;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=es&region=MX`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        mapsLoadPromise = null;
        reject(new Error("No se pudo cargar Google Maps"));
      };
      document.head.appendChild(script);
    });
  }

  return mapsLoadPromise;
}

type Props = {
  onPlaceSelected: (parsed: ParsedPlaceAddress) => void;
  inputClass: string;
};

export default function AddressAutocomplete({ onPlaceSelected, inputClass }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const cbRef = useRef(onPlaceSelected);
  cbRef.current = onPlaceSelected;

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current) return;

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "mx" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const parsed = parsePlaceAddressComponents(place.address_components);
          if (parsed) {
            cbRef.current(parsed);
            if (inputRef.current) inputRef.current.value = "";
          }
        });

        acRef.current = ac;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadErr(true);
      });

    return () => {
      cancelled = true;
      if (acRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(acRef.current);
      }
      acRef.current = null;
    };
  }, [apiKey]);

  if (!apiKey) return null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted flex items-center gap-2 flex-wrap">
        <MapPin size={12} strokeWidth={1.75} className="text-brand-accent shrink-0" />
        Buscar dirección
        <span className="text-brand-muted/50 font-normal normal-case tracking-normal">
          · autocompletar (Google)
        </span>
      </label>
      <input
        ref={inputRef}
        type="text"
        autoComplete="street-address"
        placeholder={
          loadErr
            ? "No se pudo cargar el mapa — rellena la dirección a mano"
            : ready
              ? "Escribe calle y ciudad…"
              : "Cargando sugerencias…"
        }
        disabled={!!loadErr}
        className={inputClass + (loadErr ? " opacity-60" : "")}
      />
      <p className="text-[10px] font-sans text-brand-muted leading-relaxed">
        {loadErr
          ? "Revisa NEXT_PUBLIC_GOOGLE_MAPS_API_KEY y APIs (Maps JavaScript + Places) en Google Cloud."
          : "Al elegir una sugerencia rellenamos calle, colonia, C.P. y ciudad. Comprueba los datos antes de pagar."}
      </p>
    </div>
  );
}
