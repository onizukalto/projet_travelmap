"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
export type ButtonSize = "md" | "lg" | "icon";

const base =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-control border font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Principal : encre pleine, qui s'inverse en jaune au survol
  primary: "border-ink bg-ink text-bg hover:bg-accent-yellow hover:text-on-accent",
  // Secondaire : contour, qui se remplit d'encre au survol
  secondary: "border-ink bg-transparent text-ink hover:bg-ink hover:text-bg",
  // Discret : pour les actions de second plan
  ghost: "border-transparent bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
  // Accent : jaune, réservé à l'action la plus importante d'un écran
  accent: "border-ink bg-accent-yellow text-on-accent hover:bg-ink hover:text-bg",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-12 px-5 text-base",
  icon: "size-11 shrink-0",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

// Effet ressort : le bouton se soulève au survol et s'enfonce au clic.
const hover = { y: -2 };
const tap = { y: 0, scale: 0.97 };

type ButtonProps = HTMLMotionProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

/** Bouton du design system, avec effet ressort. */
export function Button({ variant = "primary", size = "md", className = "", disabled, type = "button", ...props }: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : hover}
      whileTap={disabled ? undefined : tap}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

const MotionLink = motion.create(Link);

type ButtonLinkProps = ComponentProps<typeof MotionLink> & { variant?: ButtonVariant; size?: ButtonSize };

/** Lien qui a l'apparence d'un bouton (navigation), avec le même effet ressort. */
export function ButtonLink({ variant = "secondary", size = "md", className = "", ...props }: ButtonLinkProps) {
  return <MotionLink whileHover={hover} whileTap={tap} className={buttonClasses(variant, size, className)} {...props} />;
}
