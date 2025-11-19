import './globals.css';

export const metadata = {
  title: 'Praise FM U.S.',
  description: 'Live Christian Worship Radio',
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Live Christian Worship Radio - Praise FM U.S." />
        <meta name="theme-color" content="#FFD700" />
        <link rel="icon" href="/icon-192x192.webp" type="image/webp" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192x192.webp" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Praise FM U.S." />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta property="og:title" content="Praise FM U.S." />
        <meta property="og:description" content="Live Christian Worship Radio" />
        <meta property="og:image" content="/icon-512x512.webp" />
        <meta property="og:url" content="https://praisefm.vercel.app/" />
        <meta property="og:type" content="website" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-0RNK6G5WWL"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0RNK6G5WWL');
          `
        }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
