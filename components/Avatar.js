"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SIZES = {
  xs: { box: "w-7 h-7 text-[11px]", px: 28 },
  sm: { box: "w-8 h-8 text-xs", px: 32 },
  md: { box: "w-10 h-10 text-sm", px: 40 },
  lg: { box: "w-16 h-16 text-lg font-semibold", px: 64 },
  xl: { box: "w-24 h-24 text-2xl font-bold", px: 96 },
};

/**
 * Extrai as iniciais do nome ou e-mail.
 * Ex.: "Matt Silva" -> "MS", "João" -> "J", "contato@finflow.app" -> "C"
 */
export function getInitials(name, email) {
  if (name && typeof name === "string" && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email && typeof email === "string" && email.trim()) {
    return email.trim()[0].toUpperCase();
  }
  return "?";
}

export default function Avatar({
  src,
  name = "",
  email = "",
  size = "md",
  className = "",
  alt = "Foto de perfil",
}) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZES[size] || SIZES.md;
  const initials = getInitials(name, email);

  // Quando a URL do avatar mudar, reinicia o estado de erro
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const hasValidPhoto = Boolean(src && !imageError);
  const isLocalOrBlob = Boolean(src && (src.startsWith("blob:") || src.startsWith("data:")));

  return (
    <div
      className={`
        relative inline-flex items-center justify-center shrink-0 rounded-full
        select-none overflow-hidden
        ${sizeConfig.box}
        ${!hasValidPhoto ? "bg-brand/15 text-brand border border-brand/20 font-medium" : "bg-base-card"}
        ${className}
      `}
      aria-label={name || email || "Avatar do usuário"}
    >
      {hasValidPhoto ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${sizeConfig.px}px`}
          className="object-cover rounded-full"
          unoptimized={isLocalOrBlob}
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
