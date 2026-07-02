import type { ComponentPropsWithoutRef } from "react";
import styles from "./Surface.module.css";

export type SurfaceTone = "base" | "raised" | "subtle" | "inverse";
export type SurfaceRadius = "md" | "lg" | "xl";
export type SurfaceBorder = "none" | "subtle" | "default" | "state";
export type SurfaceElevation = "none" | "soft" | "sheet";
export type SurfaceState = "default" | "attention" | "critical";
export type SurfacePadding = "none" | "sm" | "md" | "lg";

export interface SurfaceProps extends ComponentPropsWithoutRef<"div"> {
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
  border?: SurfaceBorder;
  elevation?: SurfaceElevation;
  state?: SurfaceState;
  padding?: SurfacePadding;
}

export function Surface({
  tone = "base",
  radius = "lg",
  border = "none",
  elevation = "none",
  state = "default",
  padding = "md",
  className,
  ...props
}: SurfaceProps) {
  const classes = [
    styles.surface,
    styles[`tone-${tone}`],
    styles[`radius-${radius}`],
    styles[`border-${border}`],
    styles[`elevation-${elevation}`],
    styles[`state-${state}`],
    styles[`padding-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}
