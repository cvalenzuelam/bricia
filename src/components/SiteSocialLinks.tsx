"use client";

import { Mail } from "lucide-react";

export const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const TikTokIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const YouTubeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const rowClass =
  "text-brand-primary/50 hover:text-brand-accent transition-all hover:scale-110";

type SiteSocialIconRowProps = {
  className?: string;
};

export function SiteSocialIconRow({ className = "" }: SiteSocialIconRowProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-8 ${className}`}>
      <a
        href="https://www.instagram.com/briciaelizalde/"
        target="_blank"
        rel="noopener noreferrer"
        className={rowClass}
        aria-label="Instagram"
      >
        <InstagramIcon />
      </a>
      <a
        href="https://www.tiktok.com/@bricia.elizalde"
        target="_blank"
        rel="noopener noreferrer"
        className={rowClass}
        aria-label="TikTok"
      >
        <TikTokIcon />
      </a>
      <a
        href="https://www.youtube.com/@briciaelizaldes"
        target="_blank"
        rel="noopener noreferrer"
        className={rowClass}
        aria-label="YouTube"
      >
        <YouTubeIcon />
      </a>
      <a
        href="https://mail.google.com/mail/?view=cm&fs=1&to=briciaelizales@gmail.com"
        target="_blank"
        rel="noopener noreferrer"
        className={rowClass}
        aria-label="Enviar correo por Gmail"
      >
        <Mail size={22} strokeWidth={1.5} />
      </a>
    </div>
  );
}
