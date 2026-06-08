import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/ReduxProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { DataSyncProvider } from "@/components/DataSyncProvider";
import I18nProvider from "@/components/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lms-project-with-next.vercel.app'), // Update with actual Vercel domain later
  title: {
    default: "Mentora | Modern Learning Management System",
    template: "%s | Mentora LMS"
  },
  description: "Mentora is a comprehensive Learning Management System (LMS) designed for modern education. Create courses, track progress, and learn online.",
  keywords: ["Mentora", "LMS", "Learning Management System", "Online Courses", "Education", "E-learning", "Mentora LMS", "Training"],
  authors: [{ name: "Mentora Team" }],
  creator: "Mentora",
  publisher: "Mentora",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Mentora | Modern Learning Management System",
    description: "Mentora is a comprehensive Learning Management System (LMS) designed for modern education.",
    url: "https://mentora.vercel.app",
    siteName: "Mentora LMS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentora | Modern Learning Management System",
    description: "Mentora is a comprehensive Learning Management System (LMS) designed for modern education.",
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'JwqhQvIuKD9dk0wjgePbPRE5_cTHW3Y6vEjTkBcBwUU',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mentora LMS',
    url: 'https://lms-project-with-next.vercel.app',
    logo: 'https://lms-project-with-next.vercel.app/icon.png',
    sameAs: [
      'https://twitter.com/mentora',
      'https://github.com/gopalrai4646/lms-project',
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body 
        className="min-h-full bg-slate-50 text-slate-900 scroll-smooth"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ReduxProvider>
          <I18nProvider>
            <AuthProvider>
              <DataSyncProvider>
                {children}
              </DataSyncProvider>
            </AuthProvider>
          </I18nProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
