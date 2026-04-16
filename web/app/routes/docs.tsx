import React from "react";
import { CodeBlock } from "~/components/docs/code-block";
import { Badge } from "~/components/ui/badge";
import type { Route } from "./+types/docs";

export function meta({}: Route.MetaArgs) {
  const title = "API Documentation | Zimbabwe Bank Rates";
  const description =
    "Official API documentation for integrating Zimbabwe Gold (ZiG) exchange rates into your applications.";
  const url = "https://zimbabwegoldexchangerates.icep0ps.dev/docs";
  const image = "https://zimbabwegoldexchangerates.icep0ps.dev/og-image.png";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: url },

    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "authentication", title: "Authentication" },
  { id: "latest-rates", title: "Get Latest Rates" },
  { id: "historical-rates", title: "Get Historical Rates" },
  { id: "currencies", title: "List Currencies" },
];

export default function DocsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Zimbabwe Bank Rates API Documentation",
    description:
      "Technical documentation for the Zimbabwe Bank Rates API, providing real-time and historical exchange rate data for the Zimbabwe Gold (ZiG) currency.",
    proficiencyLevel: "Beginner",
    audience: {
      "@type": "Audience",
      audienceType: "Developers",
    },
    about: {
      "@type": "Thing",
      name: "Zimbabwe Gold Exchange Rates API",
    },
  };

  return (
    <div className="flex flex-col md:flex-row gap-10 py-10 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Sidebar Navigation */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)]">
        <nav className="flex flex-col space-y-1">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-16 min-w-0 pb-20">
        {/* Introduction */}
        <section id="introduction" className="space-y-6 scroll-mt-24">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              API Documentation
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Welcome to the Zimbabwe Bank Rates API. This API provides
              programmatic access to real-time and historical exchange rate data
              for the Zimbabwe Gold (ZiG) currency.
            </p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Base URL
            </span>
            <code className="text-sm font-mono text-foreground">
              https://zimbabwegoldexchangerates.icep0ps.dev/api/v1
            </code>
          </div>
        </section>

        {/* Authentication */}
        <section id="authentication" className="space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
            Authentication
          </h2>
          <p className="text-muted-foreground">
            Currently, the API is public and does not require an API key for
            read-only access to public endpoints. Rate limiting is applied by IP
            address to ensure fair usage.
          </p>
        </section>

        {/* Endpoint: Latest Rates */}
        <section id="latest-rates" className="space-y-6 scroll-mt-24">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
              Get Latest Rates
            </h2>
            <p className="text-muted-foreground">
              Retrieves the most recent exchange rates available.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 hover:bg-green-700">GET</Badge>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              /rates/latest
            </code>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Query Parameters</h3>
            <div className="border rounded-md divide-y">
              <div className="grid grid-cols-3 p-3 text-sm">
                <code className="font-mono text-primary">targetCurrency</code>
                <span className="text-muted-foreground">Optional</span>
                <span className="text-muted-foreground">
                  Filter by currency code (e.g., 'USD').
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Example Request</h3>
            <CodeBlock
              language="bash"
              code={`curl -X GET "https://zimbabwegoldexchangerates.icep0ps.dev/api/v1/rates/latest"`}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Example Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "success": true,
  "data": [
    {
      "id": 123,
      "currency": "USD",
      "bid": "24.4000",
      "ask": "24.6000",
      "mid_rate": "24.5000",
      "bid_rate_zwg": "24.4000",
      "ask_rate_zwg": "24.6000",
      "mid_rate_zwg": "24.5000",
      "created_at": "2026-01-01",
      "previous_rate": 122
    }
  ],
  "is_fallback": false
}`}
            />
          </div>
        </section>

        {/* Endpoint: Historical Rates */}
        <section id="historical-rates" className="space-y-6 scroll-mt-24">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
              Get Historical Rates
            </h2>
            <p className="text-muted-foreground">
              Retrieves exchange rates for a specific past date.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 hover:bg-green-700">GET</Badge>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              /rates/:date
            </code>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Path Parameters</h3>
            <div className="border rounded-md divide-y">
              <div className="grid grid-cols-3 p-3 text-sm">
                <code className="font-mono text-primary">date</code>
                <span className="text-red-500 font-medium">Required</span>
                <span className="text-muted-foreground">
                  Date in YYYY-MM-DD format.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Example Request</h3>
            <CodeBlock
              language="bash"
              code={`curl -X GET "https://zimbabwegoldexchangerates.icep0ps.dev/api/v1/rates/2025-12-25"`}
            />
          </div>
        </section>

        {/* Endpoint: Currencies */}
        <section id="currencies" className="space-y-6 scroll-mt-24">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
              List Currencies
            </h2>
            <p className="text-muted-foreground">
              Returns a list of all supported currencies available in the system.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-green-600 hover:bg-green-700">GET</Badge>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              /currencies
            </code>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Example Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "success": true,
  "data": [
    { "name": "USD" },
    { "name": "ZAR" },
    { "name": "GBP" },
    { "name": "EUR" }
  ]
}`}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
