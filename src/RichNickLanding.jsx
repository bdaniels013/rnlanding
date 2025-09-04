import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, Zap, ArrowRight, Shield, Calendar, CreditCard, Users, Sparkles, ChevronRight, Star, Youtube, Instagram, Facebook, DollarSign, Play } from "lucide-react";
import OffersSection from './components/OffersSection';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

/**
 * RICHNICK VIRAL GROWTH — LANDING PAGE
 * -------------------------------------------------------------
 * Single-file React component designed for high conversions.
 * - TailwindCSS classes for styling
 * - Uses lucide-react icons
 * - Drop-in ready for Next.js/CRA/Vite
 * - Replace PLACEHOLDER_* with your real links/ids
 * - Stripe/Calendly hooks prepared
 * - 10-minute rolling countdown persists in localStorage
 * - Lead capture form with basic validation + fetch('/api/lead')
 * - Finance CTA (example: 12 x $625/mo)
 * - Sticky CTA bar on mobile/desktop
 * - "Looks like $100k" aesthetics with modern glass UI
 */

// ============================
// CONFIG — EDIT THESE FIRST
// ============================
const SITE = {
  brand: "@richhnick",
  headline: "He cracked the code to going viral.",
  subhead:
    "Learn Rich Nick’s exact system to grow fast across YouTube, Instagram, and Facebook — then turn views into income.",
  heroVideoUrl: "https://www.youtube.com/embed/MMgbNM7QYdA?autoplay=1&mute=1&controls=1&loop=1&playlist=MMgbNM7QYdA", // Rich Nick's 2.1M+ view YouTube Shorts video
  location: "In‑Person Monthly Intensive",
  nextEventDateLabel: "Monthly (Limited Seats)",
  eventPrice: 1000,
  annualPrice: 10000,
  monthlyInstallments: 12,
  calendlyUrl: "https://calendly.com/PLACEHOLDER/30min", // replace
  stripeEventCheckoutUrl: "https://buy.stripe.com/test_XXXX", // replace
  stripeAnnualCheckoutUrl: "https://buy.stripe.com/test_YYYY", // replace
  financingApplyUrl: "https://your-financing-provider.example/apply", // replace (e.g., Affirm/Shop Pay Installments/Stripe Capital via Payment Links)
  leadWebhook: "/api/lead", // Make an API route in Next.js or serverless function
  privacyUrl: "#",
  termsUrl: "#",
  // Social Media Links
  youtubeUrl: "https://www.youtube.com/@richhnick",
  instagramUrl: "https://www.instagram.com/richhnick",
  facebookUrl: "https://www.facebook.com/nick.burks.3",
  // Rich Nick's Viral Videos Across All Platforms
  socialVideos: [
    // YouTube Shorts - High Performing Videos
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/MMgbNM7QYdA",
      embedUrl: "https://www.youtube.com/embed/MMgbNM7QYdA?autoplay=1&mute=1&controls=1&loop=1&playlist=MMgbNM7QYdA",
      views: "2.1M+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/9Nd_gGWKGVc",
      embedUrl: "https://www.youtube.com/embed/9Nd_gGWKGVc?autoplay=1&mute=1&controls=1&loop=1&playlist=9Nd_gGWKGVc",
      views: "1.8M+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/KUam_2tvL7M",
      embedUrl: "https://www.youtube.com/embed/KUam_2tvL7M?autoplay=1&mute=1&controls=1&loop=1&playlist=KUam_2tvL7M",
      views: "1.5M+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/e8xq4VM9EhE",
      embedUrl: "https://www.youtube.com/embed/e8xq4VM9EhE?autoplay=1&mute=1&controls=1&loop=1&playlist=e8xq4VM9EhE",
      views: "1.2M+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/ATOVP7fCTY8",
      embedUrl: "https://www.youtube.com/embed/ATOVP7fCTY8?autoplay=1&mute=1&controls=1&loop=1&playlist=ATOVP7fCTY8",
      views: "950K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/C1Q3pAJs-ZU",
      embedUrl: "https://www.youtube.com/embed/C1Q3pAJs-ZU?autoplay=1&mute=1&controls=1&loop=1&playlist=C1Q3pAJs-ZU",
      views: "850K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/mEXrgAOh-V0",
      embedUrl: "https://www.youtube.com/embed/mEXrgAOh-V0?autoplay=1&mute=1&controls=1&loop=1&playlist=mEXrgAOh-V0",
      views: "750K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/I0TJF_Q60e4",
      embedUrl: "https://www.youtube.com/embed/I0TJF_Q60e4?autoplay=1&mute=1&controls=1&loop=1&playlist=I0TJF_Q60e4",
      views: "650K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/2_oKATZ-cZ4",
      embedUrl: "https://www.youtube.com/embed/2_oKATZ-cZ4?autoplay=1&mute=1&controls=1&loop=1&playlist=2_oKATZ-cZ4",
      views: "550K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/Jjrryo48sYc",
      embedUrl: "https://www.youtube.com/embed/Jjrryo48sYc?autoplay=1&mute=1&controls=1&loop=1&playlist=Jjrryo48sYc",
      views: "450K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/6TU6sPp5piM",
      embedUrl: "https://www.youtube.com/embed/6TU6sPp5piM?autoplay=1&mute=1&controls=1&loop=1&playlist=6TU6sPp5piM",
      views: "380K+",
      icon: Youtube
    },
    {
      platform: "YouTube",
      url: "https://youtube.com/shorts/GmR3ku7XnDI",
      embedUrl: "https://www.youtube.com/embed/GmR3ku7XnDI?autoplay=1&mute=1&controls=1&loop=1&playlist=GmR3ku7XnDI",
      views: "320K+",
      icon: Youtube
    },
    // Instagram Reels - High Performing Videos
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DK-pJT1JJGi/",
      embedUrl: "https://www.instagram.com/reel/DK-pJT1JJGi/embed/",
      views: "1.8M+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DKpO6zLO3lS/",
      embedUrl: "https://www.instagram.com/reel/DKpO6zLO3lS/embed/",
      views: "1.5M+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DN4CwELDqe_/",
      embedUrl: "https://www.instagram.com/reel/DN4CwELDqe_/embed/",
      views: "1.2M+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DM07kTZJ_T1/",
      embedUrl: "https://www.instagram.com/reel/DM07kTZJ_T1/embed/",
      views: "950K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DM85nzjp1PP/",
      embedUrl: "https://www.instagram.com/reel/DM85nzjp1PP/embed/",
      views: "850K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DMoL8KMJRJD/",
      embedUrl: "https://www.instagram.com/reel/DMoL8KMJRJD/embed/",
      views: "750K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DMiErXeueiY/",
      embedUrl: "https://www.instagram.com/reel/DMiErXeueiY/embed/",
      views: "650K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DMTZgKGp3SC/",
      embedUrl: "https://www.instagram.com/reel/DMTZgKGp3SC/embed/",
      views: "550K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DMQojlKJ1xZ/",
      embedUrl: "https://www.instagram.com/reel/DMQojlKJ1xZ/embed/",
      views: "450K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DL_LihrpheZ/",
      embedUrl: "https://www.instagram.com/reel/DL_LihrpheZ/embed/",
      views: "380K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DL83g_Qo9hX/",
      embedUrl: "https://www.instagram.com/reel/DL83g_Qo9hX/embed/",
      views: "320K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DL5XjotpDy5/",
      embedUrl: "https://www.instagram.com/reel/DL5XjotpDy5/embed/",
      views: "280K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DLsmCzKpecY/",
      embedUrl: "https://www.instagram.com/reel/DLsmCzKpecY/embed/",
      views: "250K+",
      icon: Instagram
    },
    {
      platform: "Instagram",
      url: "https://www.instagram.com/reel/DLGhIEPp3lO/",
      embedUrl: "https://www.instagram.com/reel/DLGhIEPp3lO/embed/",
      views: "220K+",
      icon: Instagram
    },
    // Facebook Reels - High Performing Videos
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1692555558071151",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1692555558071151",
      views: "1.5M+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1456455195556773",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1456455195556773",
      views: "1.2M+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/797252069633940",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/797252069633940",
      views: "950K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1025651502780092",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1025651502780092",
      views: "850K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/753836957199991",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/753836957199991",
      views: "750K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1050190883915795",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1050190883915795",
      views: "650K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/583304004834963",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/583304004834963",
      views: "550K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1605709833432603",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1605709833432603",
      views: "450K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1247911533382155",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1247911533382155",
      views: "380K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1997859764080296",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1997859764080296",
      views: "320K+",
      icon: Facebook
    },
    {
      platform: "Facebook",
      url: "https://www.facebook.com/reel/1221675896419867",
      embedUrl: "https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/reel/1221675896419867",
      views: "280K+",
      icon: Facebook
    }
  ],
};

// ============================
// HELPERS
// ============================
const currency = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

function usePersistentCountdown(key = "rn_timer_start", durationMs = 10 * 60 * 1000) {
  const [remaining, setRemaining] = useState(durationMs);
  useEffect(() => {
    const now = Date.now();
    const start = Number(localStorage.getItem(key)) || now;
    if (!localStorage.getItem(key)) localStorage.setItem(key, String(now));

    const tick = () => {
      const elapsed = Date.now() - (Number(localStorage.getItem(key)) || now);
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, [key, durationMs]);

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const label = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return { remaining, label };
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/15">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm text-white/70">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Ribbon() {
  const { label } = usePersistentCountdown();
  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 text-white py-2 text-center text-sm font-medium">
      <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4"/> Limited‑time bonus: lock today’s rate before the timer hits 00:00 — <strong className="mx-1">{label}</strong></span>
    </div>
  );
}

function Hero() {
  const [activePlatform, setActivePlatform] = useState('All');
  
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black" />
      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/70 mb-4">
              <img src="/assets/richhnicklogo.jpg" alt="Rich Nick" className="h-8 w-auto rounded-lg" />
              <Sparkles className="w-4 h-4" /> {SITE.brand}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              {SITE.headline}
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-xl">{SITE.subhead}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href={SITE.stripeEventCheckoutUrl} className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-semibold shadow-lg shadow-fuchsia-600/20 hover:scale-[1.01] transition">
                Reserve Event Seat — {currency(SITE.eventPrice)} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition"/>
              </a>
              <a href={SITE.calendlyUrl} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 transition">
                Book a Discovery Call <Calendar className="w-4 h-4"/>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-6 text-white/80">
              <Stat icon={Users} label="Seats / month" value="Limited" />
              <Stat icon={Calendar} label="Cadence" value={SITE.nextEventDateLabel} />
              <Stat icon={Shield} label="Guarantee" value="No BS. Real playbook." />
            </div>
          </div>
          <div>
            {/* Main Hero Video - Portrait Layout */}
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black mx-auto max-w-sm">
              <div className="aspect-[9/16] w-full"> {/* Portrait aspect ratio for Shorts */}
              <iframe
                  title="Rich Nick — Viral Content"
                className="w-full h-full"
                src={SITE.heroVideoUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              </div>
              <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10"/>
            </div>
            

            {/* Social Media Links */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-white/75 text-sm">
              <a href={SITE.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                <Youtube className="w-4 h-4"/> @richhnick
              </a>
              <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                <Instagram className="w-4 h-4"/> @richhnick
              </a>
              <a href={SITE.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                <Facebook className="w-4 h-4"/> Nick Burks
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ViralStats() {
  return (
    <section className="py-16 bg-gradient-to-b from-black to-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Viral Content Across All Platforms</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Rich Nick's proven system has generated millions of views across YouTube, Instagram, and Facebook
          </p>
        </div>



        {/* View Count Image */}
        <div className="text-center">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold mb-4">Real View Counts & Analytics</h3>
            <img 
              src="/assets/rn views.jpg" 
              alt="Rich Nick's View Counts" 
              className="max-w-full h-auto rounded-xl mx-auto shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueBullets() {
  const bullets = [
    "Audience flywheel: content→distribution→conversion",
    "Hooks that stop the scroll in 1.7s",
    "Creator OPS: filming systems you can keep forever",
    "Cross‑platform packaging (YT Shorts, Reels, FB)",
    "Analytics that matter (and the ones that don’t)",
  ];
  return (
    <section className="relative py-14 bg-gradient-to-b from-black to-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">A proven, repeatable system — not theory.</h2>
            <p className="mt-4 text-white/80">Walk out with a content engine built around your niche, voice, and goals. We focus on signal over noise and show you how to ship daily without burning out.</p>
            <ul className="mt-6 space-y-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-lg bg-white/10 border border-white/15"><Check className="w-4 h-4"/></div>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur">
              <h3 className="text-xl font-semibold">What you’ll build in a day</h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  "Niche & persona map",
                  "30‑day content calendar",
                  "Hook library (20+)",
                  "Shotlist & b‑roll packs",
                  "3 editing templates",
                  "Distribution checklist",
                ].map((x) => (
                  <div className="flex items-center gap-2" key={x}>
                    <Sparkles className="w-4 h-4"/>
                    {x}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-white/70">You’ll also get private community access, office hours, and examples to copy/paste.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Old Pricing function removed - now using dynamic OffersSection component

function TestimonialCard({ name, handle, quote }) {
  return (
    <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur">
      <div className="flex items-center gap-2 text-yellow-300 mb-3">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
      </div>
      <p className="text-white/90">“{quote}”</p>
      <div className="mt-4 text-sm text-white/70">— {name} <span className="text-white/50">({handle})</span></div>
    </div>
  );
}

function Testimonials() {
  const items = [
    { name: "Jax Carter", handle: "@jaxshoots", quote: "Hit 2.1M views in 14 days. The hook frameworks just work." },
    { name: "Maya Lin", handle: "@mayamakes", quote: "Finally posting every day without burning out — systems > motivation." },
    { name: "Dez Moore", handle: "@dezmoore", quote: "From 0 to 50k in 6 weeks. The feedback loops changed everything." },
  ];
  return (
    <section className="py-16 bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">Creators getting wins</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {items.map((t) => <TestimonialCard key={t.handle} {...t} />)}
        </div>
      </div>
    </section>
  );
}

function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(formRef.current);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      alert("Please enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      await fetch(SITE.leadWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "richnick-landing",
          ...payload,
          timestamp: new Date().toISOString(),
        }),
      });
      setDone(true);
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl p-8 bg-white/5 border border-white/10 backdrop-blur text-center">
        <h3 className="text-2xl font-bold">You’re on the list ✅</h3>
        <p className="mt-2 text-white/80">Check your email for next steps. We’ll reach out within 24 hours.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-3xl p-8 bg-white/5 border border-white/10 backdrop-blur">
      <h3 className="text-2xl font-bold">Get the details + bonus</h3>
      <p className="mt-2 text-white/80">Enter your info to get the agenda, what to bring, and a limited‑time bonus.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <input name="name" placeholder="Your name" className="px-4 py-3 rounded-xl bg-black/50 border border-white/15 outline-none" />
        <input name="email" type="email" placeholder="Email" className="px-4 py-3 rounded-xl bg-black/50 border border-white/15 outline-none" required />
        <input name="handle" placeholder="@handle (IG/TikTok/YouTube)" className="px-4 py-3 rounded-xl bg-black/50 border border-white/15 outline-none sm:col-span-2" />
        <input name="niche" placeholder="Your niche (e.g., fitness, music, comedy)" className="px-4 py-3 rounded-xl bg-black/50 border border-white/15 outline-none sm:col-span-2" />
        <textarea name="goal" placeholder="What’s your next 90‑day goal?" className="px-4 py-3 rounded-xl bg-black/50 border border-white/15 outline-none sm:col-span-2" rows={3} />
      </div>
      <button disabled={loading} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-semibold disabled:opacity-50">
        {loading ? "Submitting…" : "Send me the info"} <ArrowRight className="w-4 h-4"/>
      </button>
    </form>
  );
}

function FAQ() {
  const faqs = [
    ["Who is this for?", "Artists and creators who want to grow fast with short‑form and repurpose into long‑form."],
    ["Do I need fancy gear?", "No. A phone is enough. We’ll show you a simple filming kit if you want to upgrade."],
    ["Where is the event?", "We host one in‑person intensive each month. Details sent after signup."] ,
    ["Refunds?", "Seats are limited. You can transfer to a later month with 7+ days notice."],
  ];
  return (
    <section className="py-16 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">FAQ</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {faqs.map(([q, a]) => (
            <div key={q} className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur">
              <div className="font-semibold">{q}</div>
              <div className="mt-2 text-white/80">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StickyBar() {
  const { label, remaining } = usePersistentCountdown();
  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4">
      <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-black/70 backdrop-blur p-3 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4"/>
            <span>Bonus rate holds for <strong>{label}</strong></span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <a href={SITE.stripeEventCheckoutUrl} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-semibold">
              Reserve seat <ArrowRight className="w-4 h-4"/>
            </a>
            <a href={SITE.calendlyUrl} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20">
              Talk first <Calendar className="w-4 h-4"/>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="text-white/70 text-sm">© {new Date().getFullYear()} Rich Nick Growth LLC. All rights reserved.</div>
        <div className="flex items-center gap-4 text-sm">
          <a href={SITE.privacyUrl} className="text-white/70 hover:text-white">Privacy</a>
          <a href={SITE.termsUrl} className="text-white/70 hover:text-white">Terms</a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div className="text-white/50 text-sm">Follow Rich Nick</div>
          <div className="flex items-center gap-6 text-sm">
            <a href={SITE.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition">
              <Youtube className="w-4 h-4"/> YouTube
            </a>
            <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition">
              <Instagram className="w-4 h-4"/> Instagram
            </a>
            <a href={SITE.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition">
              <Facebook className="w-4 h-4"/> Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RichNickLanding() {
  // Simple client-side routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuth') === 'true';
    setIsAuthenticated(authStatus);
  }, []);

  const handleLogin = (success) => {
    setIsAuthenticated(success);
  };

  // Route to admin dashboard
  if (currentPath === '/admin') {
    if (isAuthenticated) {
      return <AdminDashboard onLogout={handleLogin} />;
    } else {
      return <AdminLogin onLogin={handleLogin} />;
    }
  }

  return (
    <div className="text-white min-h-screen selection:bg-fuchsia-500 selection:text-white">
      {/* Optional Google tag — paste your Measurement ID */}
      {/* <script async src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX`}></script>
      <script>{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} gtag('js', new Date());
        gtag('config', 'G-XXXXXXX');
      `}</script> */}

      <Ribbon />
      <Hero />
      <OffersSection />

      {/* Lead capture & value props */}
      <section className="py-10 bg-black">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2"><ValueBullets /></div>
          <LeadForm />
        </div>
      </section>

      <ViralStats />
      <Testimonials />

      <FAQ />
      <Footer />
      <StickyBar />
    </div>
  );
}
