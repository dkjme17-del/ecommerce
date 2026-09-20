import Link from 'next/link';

const categories = [
  { name: 'Beauté', description: 'Routine premium', badge: '+2.4k', icon: 'B' },
  { name: 'Maison', description: 'Confort du quotidien', badge: 'Nouveau', icon: 'H' },
  { name: 'Mode', description: 'Essentiel chic', badge: 'Top 10', icon: 'M' },
  { name: 'Bien-être', description: 'Mieux vivre', badge: 'Best seller', icon: 'W' },
];

const benefits = [
  {
    title: 'Expérience fluide',
    text: 'Des parcours courts, clairs et convertissants sur mobile comme sur desktop.',
  },
  {
    title: 'Paiements localisés',
    text: 'Wave, Orange Money et MTN MoMo intégrés pour un achat rassurant en quelques secondes.',
  },
  {
    title: 'Vente premium',
    text: 'Des boutiques à la vitrine soignée, avec une confiance visible à chaque étape.',
  },
];

const featuredProducts = [
  { name: 'Sérum de lueur', price: '18 500', tag: 'Best seller', image: '/images/product-1.jpg' },
  { name: 'Sac de voyage', price: '26 900', tag: 'Nouveau', image: '/images/product-2.jpg' },
  { name: 'Bougie artisanale', price: '9 800', tag: 'Cadeau', image: '/images/product-3.jpg' },
];

const testimonials = [
  {
    name: 'Aminata K.',
    role: 'Acheteuse régulière',
    quote:
      'Le parcours d’achat est clair, rapide et rassurant. J’ai trouvé ce que je cherchais en moins de deux minutes.',
  },
  {
    name: 'Yvan D.',
    role: 'Vendeur indépendant',
    quote:
      'La vitrine de boutique est premium. J’ai vu une forte différence sur le taux de conversion dès le début.',
  },
];

export default function HomeExperience() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),transparent_30%),linear-gradient(180deg,#f8f5f0_0%,#f8fafc_20%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),transparent_35%),linear-gradient(180deg,#020817_0%,#0f172a_18%,#020817_100%)]">
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-paper/80 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.32)] backdrop-blur dark:border-slate-800 dark:bg-ink-strong/80">
          <div className="grid gap-10 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-10 lg:px-12 lg:py-12">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Nouveau lancement
              </div>

              <h1 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.06em] text-ink-strong dark:text-white md:text-5xl lg:text-6xl">
                Achetez mieux, vivez mieux.
              </h1>

              <p className="mt-5 max-w-lg text-base text-ink-muted dark:text-ink-faint md:text-lg">
                Mélia Market réunit des marques premium, des créateurs locaux et des essentiels du quotidien dans une expérience d’achat fluide, élégante et rassurante.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-full bg-ink-strong px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Découvrir les produits
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-paper px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-ink-strong"
                >
                  Ouvrir une boutique
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  20k clients satisfaits
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  4.9/5 note moyenne
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -translate-y-2 rounded-[28px] bg-gradient-to-br from-amber-200/70 via-orange-100/40 to-transparent blur-3xl dark:from-amber-500/20" />
              <div className="relative rounded-[28px] border border-slate-200 bg-slate-950 p-4 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.75)] dark:border-slate-700">
                <div className="rounded-[22px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-ink-faint">
                    <span>Collection du mois</span>
                    <span className="rounded-full bg-paper/10 px-2 py-1">Saison</span>
                  </div>

                  <div className="mt-6 rounded-[22px] bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.28),transparent_30%),linear-gradient(135deg,#1f2937,#0f172a))] p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">Essential edit</p>
                        <h2 className="mt-2 text-3xl font-bold">Lumière & calme</h2>
                      </div>
                      <div className="rounded-full border border-white/15 bg-paper/5 px-3 py-1 text-xs text-slate-200">
                        24 produits
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-paper/5 p-3 backdrop-blur-sm"
                        >
                          <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-amber-200/80 via-orange-200/40 to-slate-500/30" />
                          <p className="mt-2 text-xs text-slate-200">Produit {item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-paper/5 p-3 text-sm text-slate-200">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Livraison</p>
                      <p className="mt-1 font-semibold">Sous 48h partout</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Taux de conversion</p>
                      <p className="mt-1 font-semibold text-amber-300">+31%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-paper/70 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-ink-strong/70">
              <div className="mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500" />
              <h3 className="text-lg font-semibold text-ink-strong dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted dark:text-ink-faint">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Catégories"
            title="Une sélection pensée pour chaque besoin"
            text="Des univers cohérents, de belles découvertes et un parcours d’achat qui garde le contrôle à l’utilisateur."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href="/products"
                className="group rounded-[26px] border border-slate-200 bg-paper p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-32px_rgba(15,23,42,0.32)] dark:border-slate-800 dark:bg-ink-strong"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-lg font-bold text-white dark:from-amber-500 dark:to-orange-500 dark:text-ink-strong">
                    {category.icon}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted dark:bg-slate-800 dark:text-ink-faint">
                    {category.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-ink-strong dark:text-white">{category.name}</h3>
                <p className="mt-2 text-sm text-ink-muted dark:text-ink-faint">{category.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-strong dark:text-white">
                  Explorer
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 transition group-hover:translate-x-1" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4.167 10h11.666M10.833 4.167 15.833 10l-5 5.833" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Sélection"
            title="Des produits qui donnent envie d’acheter"
            text="La mise en avant, les avis et les badges de confiance guident les clients jusqu’au bon achat sans friction."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <article key={product.name} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-paper shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:bg-ink-strong">
                <div className="relative">
                  <div
                    className={`aspect-[4/5] bg-gradient-to-br ${
                      index === 0
                        ? 'from-amber-200 via-orange-100 to-slate-200'
                        : index === 1
                          ? 'from-slate-200 via-slate-100 to-slate-300'
                          : 'from-emerald-200 via-lime-100 to-amber-100'
                    }`}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-paper/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 backdrop-blur dark:bg-ink-strong/70 dark:text-slate-200">
                    {product.tag}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-ink-strong dark:text-white">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Édition limitée</p>
                    </div>
                    <span className="text-lg font-bold text-ink-strong dark:text-white">{product.price} FCFA</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118L10 2.927Z" />
                        </svg>
                      ))}
                    </div>
                    <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-strong dark:text-white">
                      Voir le produit
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.167 10h11.666M10.833 4.167 15.833 10l-5 5.833" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Avis"
            title="La preuve de la confiance"
            text="Des clients qui reviennent, des vendeurs qui développent leur activité, et une expérience pensée pour convertir sans friction."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="rounded-[26px] border border-slate-200 bg-paper p-6 shadow-sm dark:border-slate-800 dark:bg-ink-strong">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118L10 2.927Z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-200">“{item.quote}”</p>
                <footer className="mt-5">
                  <p className="font-semibold text-ink-strong dark:text-white">{item.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-[30px] border border-slate-200 bg-ink-strong px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.9)] dark:border-slate-700 md:px-8 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Lancez votre boutique</p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Commencez à vendre dès aujourd’hui</h3>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 lg:mt-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Créer mon compte
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-paper/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-paper/10"
              >
                Explorer la boutique
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-ink-strong dark:text-white">{title}</h2>
      <p className="mt-3 text-base leading-7 text-ink-muted dark:text-ink-faint">{text}</p>
    </div>
  );
}
