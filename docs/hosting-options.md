# Hosting options for the Threadwell site (research, 8 October 2026)

Nothing here is decided or configured; the owner is choosing. The site is static, has no build step and is small, so any static host works. Figures come from third-party comparison pages and GitHub's own documentation. **Re-check current limits on each provider's pricing page before relying on them.**

| Host | Free-tier shape | Fits this site because | Watch out for |
|---|---|---|---|
| **GitHub Pages** | Public repos on a free account (private repos need a paid plan). Site up to 1 GB, soft 100 GB/month bandwidth, soft 10 builds/hour. Custom domain and HTTPS supported. | The repo already exists (`threadwell/Threadwell-site`) and the metadata and 404 already assume it; push to deploy; nothing else to run. | The repo (and site source) must be public. A project site lives under `/Threadwell-site/` (the site already sets `SITE_ROOT`); a custom domain would serve from `/`, which means changing `SITE_ROOT`, canonical URLs and the social tags. Simple 404 handling only. |
| **Cloudflare Pages** | Unlimited bandwidth and static requests on the free tier; 500 builds a month. Free HTTPS and a custom domain. | Keeps serving if traffic spikes; serves from the root of its own domain. | Another account and dashboard to manage; a custom domain is the cleanest way to a stable address. |
| **Netlify** | Credit-based free plan (about 300 credits a month); a hard cap pauses the site until the next cycle. | Easy deploys and previews. | The cap can take the site down on a traffic spike, which is a poor fit for a privacy-policy page the app links to. |

## Recommendation (for the owner to weigh)
- **Start on GitHub Pages**: it is what the site is already built for, costs nothing and needs no new account. Do the push, enable Pages, then test a bad URL for the 404.
- **Buy a small custom domain before the Play listing**, if you want one: the privacy policy URL printed in the store listing should never change. With a domain you can keep GitHub Pages or move to Cloudflare Pages later without changing the address. Then update `SITE_ROOT`, the canonical and social-image URLs, and `404.html`.
- Keep the policy pages (`privacy.html`, `app-privacy.html`) at fixed paths whatever you pick, and keep them in step with `docs/PRIVACY.md` and `docs/PRIVACY_AUDIT.md` in the app repo.

## Sources
- GitHub: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- Comparison: [Where to Host a Static Website in 2026](https://playcode.io/blog/where-to-host-a-static-website)
- Comparison: [Best Cloudflare Pages Alternatives (2026)](https://developer.puter.com/blog/cloudflare-pages-alternatives/)
- Comparison: [Best GitHub Pages Alternatives (2026)](https://developer.puter.com/blog/github-pages-alternatives/)
