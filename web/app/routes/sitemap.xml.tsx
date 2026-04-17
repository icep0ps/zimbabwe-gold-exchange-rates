import { format, subDays } from "date-fns";
import { getItems } from "~/lib/fetcher";
import type { ApiSuccessResponse, Rate } from "~/lib/types";

const BASE_URL = "https://zimbabwegoldexchangerates.icep0ps.dev";

export async function loader() {
  const startDate = format(subDays(new Date(), 365), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const apiUrl = `${import.meta.env.VITE_API_BASE_URL}api/v1/rates/historical/USD?startDate=${startDate}`;

  let dates: string[] = [];
  try {
    const response = await getItems<unknown, Rate[]>(apiUrl);
    if (response.success) {
      dates = (response as ApiSuccessResponse<Rate[]>).data.map(
        (r) => r.created_at
      );
    }
  } catch {
    // Silently fail — sitemap will include static pages only
  }

  const staticPages = [
    {
      loc: `${BASE_URL}/`,
      lastmod: today,
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: `${BASE_URL}/history`,
      lastmod: today,
      changefreq: "daily",
      priority: "0.8",
    },
    {
      loc: `${BASE_URL}/docs`,
      lastmod: today,
      changefreq: "monthly",
      priority: "0.5",
    },
  ];

  const dynamicPages = dates.map((date) => ({
    loc: `${BASE_URL}/rates/${date}`,
    lastmod: date,
    changefreq: "never",
    priority: "0.6",
  }));

  const allPages = [...staticPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
