"use client";

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@mui/material";

type AtomButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type AtomButtonProps = Omit<ButtonProps, "variant" | "color"> & {
  atomVariant?: AtomButtonVariant;
  children: ReactNode;
  target?: string;
  rel?: string;
};

const variantStyles: Record<AtomButtonVariant, object> = {
  primary: {
    backgroundColor: "#F3C742",
    color: "#251B10",
    border: "1px solid transparent",
    "&:hover": {
      backgroundColor: "#E7BB33",
    },
  },
  secondary: {
    backgroundColor: "#FFF0C2",
    color: "#251B10",
    border: "1px solid transparent",
    "&:hover": {
      backgroundColor: "#FBE6A5",
    },
  },
  outline: {
    backgroundColor: "transparent",
    color: "#251B10",
    border: "1px solid #EFD9A2",
    "&:hover": {
      backgroundColor: "#FFF7E4",
      borderColor: "#E3C46B",
    },
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#7A6A58",
    border: "1px solid transparent",
    "&:hover": {
      backgroundColor: "rgba(239, 217, 162, 0.22)",
      color: "#251B10",
    },
  },
  danger: {
    backgroundColor: "#FCE9E7",
    color: "#B24231",
    border: "1px solid #F2B8B5",
    "&:hover": {
      backgroundColor: "#F8D8D4",
    },
  },
};

export default function AtomButton({
  atomVariant = "primary",
  children,
  sx,
  ...props
}: AtomButtonProps) {
  return (
    <Button
      {...props}
      sx={{
        minHeight: 40,
        px: 3,
        py: 1.5,
        borderRadius: "14px 0 14px 14px",
        boxShadow: "none",
        textTransform: "none",
        fontWeight: 700,
        whiteSpace: "nowrap",
        ...variantStyles[atomVariant],
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}
