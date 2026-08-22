import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

const PAGES: Record<string, { title: string; body: string }> = {
  shipping: {
    title: "Shipping & delivery",
    body: `We dispatch orders manually and confirm delivery details with you on WhatsApp. Delivery charges, if any, are confirmed before dispatch. Typical delivery is 3–7 working days depending on your location.

We currently ship across India. International shipping is not available in V1.

Please ensure your address and phone number are correct when placing an order, as we'll contact you on WhatsApp to coordinate delivery.`,
  },
  returns: {
    title: "Returns",
    body: `Returns are handled case by case. Please contact us on WhatsApp within 2 days of delivery if there is an issue with your saree. We'll guide you through the process.

We accept returns for items that are:
• Significantly different from the description
• Damaged or defective on arrival

We do not accept returns for change-of-mind after delivery.`,
  },
  privacy: {
    title: "Privacy policy",
    body: `We collect only the information needed to fulfil your order — your name, phone number and delivery address. We never share your details with third parties for marketing.

Your order data is stored securely and used only to process and confirm your order. We do not use cookies for tracking.

No payment details are ever collected or stored on this website.`,
  },
  terms: {
    title: "Terms & conditions",
    body: `Orders placed on this website are requests and are confirmed manually by Laxy Fashions. Availability and final pricing are confirmed on WhatsApp before dispatch.

No online payment is processed on this site. Payment is arranged separately after confirmation.

Laxy Fashions reserves the right to decline or cancel orders at any time, in which case no payment is collected.`,
  },
  contact: {
    title: "Contact",
    body: `Reach us on WhatsApp at +91 98765 43210 — tap the button at the bottom of the page.

You can also message us on Instagram @laxyfashions.

We aim to respond within a few hours during business hours (10am – 7pm IST, Monday–Saturday).`,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug] ?? { title: slug, body: "" };
  return { title: page.title };
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug] ?? {
    title: "Page",
    body: "Content coming soon.",
  };

  return (
    <div className="container-laxy py-12 max-w-2xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
      <h1 className="font-heading text-4xl text-accent">{page.title}</h1>
      <div className="mt-5 text-foreground/80 leading-relaxed whitespace-pre-line">
        {page.body}
      </div>
    </div>
  );
}
