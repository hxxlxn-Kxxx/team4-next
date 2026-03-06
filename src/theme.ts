// src/theme.ts
"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6366f1", //  메인 컬러 (Indigo)
    },
    secondary: {
      main: "#1e293b",
    },
    background: {
      default: "#f8f9fa",
    },
  },
  typography: {
    fontFamily: "inherit", // globals.css의 폰트를 따라가도록 설정
  },
});

export default theme;
