import type { MetadataRoute } from "next"

const isDev = process.env.NODE_ENV === "development"

export default function robots(): MetadataRoute.Robots {
    if (isDev) {
        // Block everything in development
        return {
            rules: {
                userAgent: "*",
                disallow: "/"
            }
        }
    }

    // Production config
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/*"]
        },
        sitemap: "https://t3.xeesol.net/sitemap.xml"
    }
}
