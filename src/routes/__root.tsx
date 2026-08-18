import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/warehouse/Sidebar";
import { TopBar } from "@/components/warehouse/TopBar";
import { CopilotPanel } from "@/components/warehouse/CopilotPanel";
import { Intro } from "@/components/warehouse/Intro";
import { WarehouseBackdrop } from "@/components/warehouse/WarehouseBackdrop";
import { WarehouseProvider } from "@/state/warehouse-store";
import { VoiceProvider } from "@/state/voice-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WareMind — Autonomous Warehouse Copilot" },
      {
        name: "description",
        content:
          "WareMind is an AI warehouse command center for smart allocation, picking, dispatch and exception handling.",
      },
      { name: "author", content: "WareMind" },
      { property: "og:title", content: "WareMind — Autonomous Warehouse Copilot" },
      {
        property: "og:description",
        content: "AI warehouse command center for order fulfilment, allocation and exception handling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <VoiceProvider>
        <WarehouseProvider>
          <Intro />
          <div className="relative min-h-screen">
            <WarehouseBackdrop />
            <div className="relative flex min-h-screen">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <TopBar />
                <div className="flex flex-1 gap-4 px-4 py-5 lg:px-6">
                  <main className="min-w-0 flex-1">
                    {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                    <Outlet />
                  </main>
                  <CopilotPanel />
                </div>
              </div>
            </div>
          </div>
          <Toaster position="top-right" />
        </WarehouseProvider>
      </VoiceProvider>
    </QueryClientProvider>
  );
}

