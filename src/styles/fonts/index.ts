// src/s.ts
import localFont from "next/font/local"

export const geistSans = localFont({
    src: "./GeistVF.woff",
    variable: "--font-geist-sans",
    display: "swap"
})

export const geistMono = localFont({
    src: "./GeistMonoVF.woff",
    variable: "--font-geist-mono",
    display: "swap"
})
