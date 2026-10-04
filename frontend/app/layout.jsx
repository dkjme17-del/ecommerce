import './globals.css';
import { Fraunces, Inter } from 'next/font/google';
import { AuthProvider } from '../lib/auth-context';
import { ThemeProvider, themeInitScript } from '../lib/theme';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Police display éditoriale (titres) + police UI (corps)
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'DKmarket — Achetez de la bonne et belle chose, simplement',
  description:
    'DKmarket est le marketplace qui connecte les boutiques locales aux acheteurs, avec paiement Wave, Orange Money et MTN MoMo.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-paper">
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}