import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import Reveal, { WordReveal } from "@/components/cinema/Reveal";
import { serializeProducts, whatsappUrl } from "@/lib/orderLogic";
import { getPublicStoreSettings } from "@/server/actions/settings";
import {
  ShoppingBag,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Award,
  Heart,
  Truck,
  RotateCcw,
  Clock,
} from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  // Fetch active products, categories, and store settings directly from DB
  const [rawProducts, categories, settings] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    }),
    getPublicStoreSettings(),
  ]);

  const waNumber = settings.whatsappNumber;
  const storeName = settings.storeName;

  const featuredProducts = serializeProducts(rawProducts);

  const categoryImages: Record<string, string> = {
    "silk-sarees": "/products/kanjivaram-teal.png",
    "cotton-sarees": "/products/chanderi-ivory.png",
    "designer-sarees": "/products/chiffon-pink.png",
    festive: "/products/tussar-gold.png",
  };

  const occasions = [
    { name: "Weddings & Reception", desc: "Opulent Banarasi & Kanjivaram zari silk sarees", tag: "Wedding", img: "/products/banarasi-red.png" },
    { name: "Festivals & Pujas", desc: "Vibrant Tussar silk & gold tissue borders", tag: "Festive", img: "/products/tussar-gold.png" },
    { name: "Cocktails & Evening", desc: "Flowing sequined chiffon georgette sarees", tag: "Casual", img: "/products/chiffon-pink.png" },
    { name: "Office & Day Wear", desc: "Breathable handloom linen & Chanderi cotton", tag: "Work", img: "/products/linen-blue.png" },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* ── Chapter 1: The Overture (Hero Banner) ────────────────────────── */}
      <section id="overture" className="relative pt-6 pb-12 overflow-hidden">
        <div className="container-laxy">
          <div className="bg-card rounded-[2.5rem] border border-border p-8 sm:p-14 shadow-sm relative overflow-hidden">
            {/* Soft Ambient Background Glow */}
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              {/* Copy & Reveal */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <Reveal delay={100}>
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>01 · Handpicked Indian Saree Boutique</span>
                  </div>
                </Reveal>

                <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.04]">
                  <WordReveal text="Elegance Redefined," delay={200} />
                  <br />
                  <span className="text-primary italic font-normal">
                    <WordReveal text="Draped in Tradition." delay={400} />
                  </span>
                </h1>

                <Reveal delay={500}>
                  <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                    Explore authentic Banarasi Silk, Kanjivaram, Chanderi Cotton, and Embroidered Chiffon sarees. Handpicked for weddings, festive occasions, and daily grace.
                  </p>
                </Reveal>

                {/* Actions */}
                <Reveal delay={650}>
                  <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <Link href="/shop" className="btn-maroon text-sm px-8 py-3.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Browse Saree Catalog</span>
                    </Link>

                    <a
                      href={whatsappUrl(
                        `Hello ${storeName}! I'd like to browse your saree collection.`,
                        waNumber
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline-maroon text-sm px-6 py-3.5 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-700" />
                      <span>Inquire on WhatsApp</span>
                    </a>
                  </div>
                </Reveal>

                {/* Trust Badges */}
                <Reveal delay={800}>
                  <div className="pt-8 border-t border-border/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                    <div>
                      <h4 className="font-heading text-xl font-bold text-foreground">100%</h4>
                      <p className="text-xs text-muted-foreground">Authentic Weaves</p>
                    </div>
                    <div>
                      <h4 className="font-heading text-xl font-bold text-foreground">Zero Risk</h4>
                      <p className="text-xs text-muted-foreground">WhatsApp Confirmation</p>
                    </div>
                    <div>
                      <h4 className="font-heading text-xl font-bold text-foreground">Pan-India</h4>
                      <p className="text-xs text-muted-foreground">Free Shipping</p>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Showcase Image */}
              <div className="lg:col-span-5 relative">
                <Reveal delay={300} variant="fade">
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-secondary group">
                    <Image
                      src="/products/banarasi-red.png"
                      alt="Banarasi Silk Saree — Vermilion Red"
                      fill
                      priority
                      loading="eager"
                      sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 45vw, 500px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        Boutique Highlight
                      </span>
                      <h3 className="font-heading text-2xl font-bold text-white mt-1">
                        Banarasi Silk — Vermilion Red
                      </h3>
                      <p className="text-xs text-white/80 mt-1">
                        Pure silk with gold zari work
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter 2: The Craft & Heritage (Editorial Split) ─────────────── */}
      <section id="craft" className="container-laxy">
        <div className="bg-card rounded-3xl border border-border p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <Reveal>
                <span className="eyebrow">02 · Our Craft</span>
                <h2 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mt-1">
                  Selected with Care, <br />
                  <span className="text-primary italic font-normal">Thread by Thread.</span>
                </h2>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  We don't mass-produce. Every saree in our boutique is inspected for texture, zari purity, and draping elegance. From Banarasi looms to Kanjivaram weavers, we bring authentic craftsmanship straight to your doorstep.
                </p>
              </Reveal>

              <Reveal delay={350}>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-base font-bold text-foreground">Verified Weaves</h4>
                      <p className="text-xs text-muted-foreground">Tested pure silk & cotton</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-base font-bold text-foreground">Direct Confirmation</h4>
                      <p className="text-xs text-muted-foreground">Personal WhatsApp support</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Photo Collage */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <Reveal delay={200}>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-sm group">
                  <Image
                    src="/products/kanjivaram-teal.png"
                    alt="Kanjivaram Silk Saree"
                    fill
                    sizes="(max-width: 1024px) 50vw, 300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-white font-heading">Kanjivaram Peacock Teal</span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={350}>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-sm group mt-6">
                  <Image
                    src="/products/chiffon-pink.png"
                    alt="Chiffon Georgette Saree"
                    fill
                    sizes="(max-width: 1024px) 50vw, 300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-white font-heading">Blush Pink Chiffon</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter 3: The Collection (Categories & Featured Grid) ────────── */}
      <section id="collection" className="container-laxy">
        <div className="space-y-12">
          {/* Categories */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="eyebrow">03 · Curated Collections</span>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-1">
                  Shop by Category
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group"
              >
                <span>View All Categories</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat, idx) => {
                const imgSrc = categoryImages[cat.slug] || "/products/banarasi-red.png";
                return (
                  <Reveal key={cat.id} delay={idx * 100}>
                    <Link
                      href={`/shop?category=${cat.slug}`}
                      className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 block"
                    >
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                        <h3 className="font-heading text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-white/80 mt-1 flex items-center gap-1 font-sans">
                          <span>Explore Collection</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Featured Sarees Grid */}
          <div className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="eyebrow">Featured Products</span>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-1">
                  Handpicked Sarees
                </h2>
              </div>
              <Link href="/shop" className="btn-outline-maroon text-xs px-5 py-2 hover:scale-[1.02]">
                <span>View Full Shop</span>
              </Link>
            </div>

            {featuredProducts.length === 0 ? (
              <div className="p-12 text-center bg-card rounded-2xl border border-border text-muted-foreground">
                No products available yet. Run database seed to populate.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featuredProducts.map((product, idx) => (
                  <Reveal key={product.id} delay={idx * 80}>
                    <ProductCard product={product as any} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Chapter 4: Occasion Showcase ──────────────────────────────────── */}
      <section id="occasions" className="container-laxy">
        <div className="space-y-8">
          <Reveal>
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="eyebrow">04 · Occasion Showcase</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Draped for Every Occasion
              </h2>
              <p className="text-muted-foreground text-sm">
                Whether you are attending a grand wedding or looking for everyday grace.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {occasions.map((occ, idx) => (
              <Reveal key={occ.name} delay={idx * 100}>
                <Link
                  href={`/shop?occasion=${occ.tag}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 block space-y-4"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary">
                    <Image
                      src={occ.img}
                      alt={occ.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {occ.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {occ.desc}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chapter 5: WhatsApp Guarantee & Ordering Guide ───────────────── */}
      <section id="guarantee" className="container-laxy">
        <div className="bg-card rounded-3xl border border-border p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <Reveal>
              <span className="eyebrow">05 · WhatsApp Ordering Guarantee</span>
              <h2 className="font-heading text-3xl sm:text-5xl font-bold text-foreground mt-1">
                How Ordering Works at Laxy Fashions
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                We make ordering sarees online simple, transparent, and completely personal.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              {/* Step 1 */}
              <Reveal delay={100}>
                <div className="p-5 rounded-2xl bg-secondary/70 border border-border/80 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-xs h-full">
                  <div className="w-9 h-9 rounded-full bg-rose-700 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-sm">
                    1
                  </div>
                  <h4 className="font-heading text-lg font-bold text-foreground">Browse & Cart</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Select your favorite sarees and enter your delivery address.
                  </p>
                </div>
              </Reveal>

              {/* Step 2 */}
              <Reveal delay={250}>
                <div className="p-5 rounded-2xl bg-secondary/70 border border-border/80 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-xs h-full">
                  <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-sm">
                    2
                  </div>
                  <h4 className="font-heading text-lg font-bold text-foreground">Submit Order</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Your order is placed securely without entering any credit card details.
                  </p>
                </div>
              </Reveal>

              {/* Step 3 */}
              <Reveal delay={400}>
                <div className="p-5 rounded-2xl bg-secondary/70 border border-border/80 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-xs h-full">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-sm">
                    3
                  </div>
                  <h4 className="font-heading text-lg font-bold text-foreground">WhatsApp Confirm</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    We verify stock and confirm delivery details directly with you on WhatsApp.
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={500}>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/shop" className="btn-maroon text-xs px-6 py-3 hover:scale-[1.02]">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Start Shopping Now</span>
                </Link>

                <a
                  href={whatsappUrl(
                    `Hello ${storeName}! I'd like to ask a question about your sarees.`,
                    waNumber
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline-maroon text-xs px-6 py-3 hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>Chat directly on WhatsApp</span>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
