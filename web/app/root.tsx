import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import SiteFooter from "./components/footer";
import NavigationBar from "./components/navigation-bar";
import PushNotificationPrompt from "./components/push-notification-prompt";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap",
  },
];

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const subscription = formData.get("subscription");

  await fetch(`${import.meta.env.VITE_API_BASE_URL}notifications/subscribe`, {
    method: "POST",
    body: subscription,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <NuqsAdapter>
      <main className="w-full px-4 sm:px-6 md:px-8 lg:max-w-[1080px] lg:mx-auto space-y-10">
        <NavigationBar />
        <Outlet />
        <SiteFooter />
        <PushNotificationPrompt />
      </main>
    </NuqsAdapter>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <React.Fragment>
      <main className="w-full px-4 sm:px-6 md:px-8 lg:max-w-[1080px] lg:mx-auto space-y-10">
        <NavigationBar />
        <div className="text-center space-y-5 justify-center items-center flex flex-col py-24 ">
          <h1 className="text-4xl font-bold text-primary ">{message}</h1>
          <p>{details}</p>
          {stack && (
            <pre className="w-full p-4 overflow-x-auto">
              <code>{stack}</code>
            </pre>
          )}
        </div>
        <SiteFooter />
      </main>
    </React.Fragment>
  );
}
