import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Meeting-to-Momentum", description: "Clarity after the meeting." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <script dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (var i = 0; i < registrations.length; i++) {
                registrations[i].unregister().then(function(success) {
                  if (success) {
                    console.log('Stale service worker unregistered successfully.');
                    window.location.reload();
                  }
                });
              }
            });
          }
        `
      }} />
    </head>
    <body>{children}</body>
  </html>;
}
