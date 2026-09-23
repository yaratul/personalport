# Project Memory & Operating Guidelines: Yaser Ahmmed Ratul Portfolio (yaratul.com)

## 1. Owner & Developer Identity
- **Owner Name**: Yaser Ahmmed Ratul (Aliases: MD Yaser Ahmmed Ratul, @yaratul, @yaratul2005)
- **Profession**: Full-Stack Developer, Server-Side Tracking (CAPI) Architect, DevOps & SEO Specialist
- **Location**: Cumilla Cantonment, Cumilla 3501, Bangladesh (Time zone: Asia/Dhaka GMT+6)
- **Primary Domain**: `https://yaratul.com` (DNS & CDN on Cloudflare)
- **Direct Email**: `owner@yaratul.com` (Cloudflare Email Routing forwarded to primary inbox `ratul41g@gmail.com`)
- **Direct Phone / WhatsApp**: `+880 1722081109` (Instant WhatsApp)
- **Social & Code Repositories**:
  - GitHub: `https://github.com/yaratul` and `https://github.com/yaratul2005`
  - LinkedIn: `https://www.linkedin.com/in/yaratul2004/`
  - X / Twitter: `https://x.com/yaratul2004`
  - Facebook: `https://www.facebook.com/yaratul2004/`
  - Instagram: `https://www.instagram.com/i.m.ratul/`
- **Verified Credentials**:
  - Meta Social Media Marketing Professional Certificate (ID: `EQ33G3U3UCDG`)
  - Google AI Professional Certificate (ID: `5SQ5LW13EAO2`)

---

## 2. Design System & Aesthetics (STRICT RULES)
- **Color Palette**: High-contrast, bold Red and White Neo-Brutalism / Editorial style.
  - **Primary Red**: `#e60026` (`var(--bg-red)`, `var(--text-red)`)
  - **Deep Black**: `#0a0a0a` (`var(--text-black)`)
  - **Crisp White**: `#ffffff` (`var(--bg-white)`, `var(--text-white)`)
  - **Off-White**: `#f9f9f9` (`var(--bg-offwhite)`)
- **Contrast & Hierarchy Inversion Rule**:
  - Any element or text placed on a **Red background** MUST be strictly **100% White** (`#ffffff`).
  - On a **White background**, headings and accents may be Red or Black, and body text is Deep Black.
  - Hard borders (`1.5px` - `2px` solid `#0a0a0a`) with neo-brutalist offset box shadows (`4px 4px 0px #0a0a0a` or `8px 8px 0px rgba(0,0,0,0.3)`).
- **Typography**:
  - Display / Headings: `Outfit`, sans-serif (`font-family: var(--font-title)`)
  - Body Copy: `Plus Jakarta Sans`, sans-serif (`font-family: var(--font-body)`)
  - Technical Specs / Pills / Metadata: `JetBrains Mono`, monospace (`font-family: var(--font-mono)`)
- **Interactive Enhancements**:
  - Lenis smooth scrolling paired with GSAP ScrollTrigger.
  - Dual-state magnetic custom cursor (`#cursor-dot`).
  - Fullscreen lightbox modal for architecture diagrams and certificates (`#lightbox-modal`).
  - Real-time Dhaka (GMT+6) status pill in the contact stage.

---

## 3. Section Architecture & Terminology Rules
- **Terminology**: NEVER use the word "System" when referring to project cards or portfolio items. Always use **"Project"** (e.g., `PROJECT // 01-06`, `Flagship Software Projects`, `Explore Projects`).
- **Hero Section (`#hero`)**:
  - Left column: Editorial headline, narrative lead, and primary CTAs.
  - Right column: Executive cutout portrait (`/gallery/yaratul_cutout.png`) seamlessly integrated on the white canvas with an ambient red glow aura and gradient fade mask. Scaled for tablet; hidden (`display: none !important`) on mobile (`<= 768px`) to avoid visual collision.
- **Projects Section (`#projects`)**:
  - **Desktop (`> 1024px`)**: Pinned horizontal scroll rail with 2-column slides (architectural specs on left, blueprint image on right).
  - **Mobile/Tablet (`<= 768px`)**: Interactive 3D flip card box (`transform: rotateY(180deg)`).
    - Front face: Unclipped project image, title, fullscreen zoom button, and "View Specs & Code ↺" toggle.
    - Back face: Complete technical breakdown, tech badges, repository link, and "View Blueprint Image ↺" toggle.
    - Protected triggers: Clicking external links (`a`) or zoom buttons (`.img-zoom-badge`) will NOT trigger card flip.
- **FAQ Section (`#faq`)**:
  - 26 questions across 6 intent categories: Hiring a Developer (7), Building an Online Store (3), SEO & Site Performance (7), Ad Tracking & Conversion API (3), SaaS & Developer Evaluation (2), Website Basics (4).
  - Interactive accordion: opening one item auto-collapses siblings in the same category.
  - Structured Data: Dedicated `<script type="application/ld+json">` containing `FAQPage` schema in `<head>`.
  - **Requirement**: Schema `name` and `acceptedAnswer.text` must match the visible DOM text with 100% exact fidelity (no paraphrasing).
- **Contact Stage (`#contact`)**:
  - Direct inquiry form routes to `https://formsubmit.co/ajax/owner@yaratul.com`.
  - Zero-config relay: receives inquiries and delivers formatted table emails to `owner@yaratul.com`.
  - Fail-safe fallback: pre-filled `mailto:owner@yaratul.com` link and WhatsApp link in case of network errors.

---

## 4. Build, Testing & Deployment Guidelines
- **Bundler**: Vite (`npm run build`). Always rebuild after updating `index.html` or assets.
- **Browser Testing**: Puppeteer with Windows Chrome executable path:
  `executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'`, args: `['--no-sandbox', '--disable-setuid-sandbox']`.
- **Git Routine**:
  1. Ensure changes are tested and verified.
  2. Run `npm run build` to confirm zero compilation errors and update `dist/`.
  3. Stage files (`git add ...`), commit with descriptive conventional commit messages (`feat(...)`, `fix(...)`), and push to `origin main`.

---

## 5. Cloudflare & Vercel Infrastructure Credentials
The following production environment variables are stored in Vercel (`personalport` project) for Cloudflare integration:
- **Cloudflare R2 Object Storage (S3 API Compatible)**:
  - `CF_S3_ENDPOINT`: Cloudflare R2 bucket S3 API endpoint URI
  - `CF_ACCESS_KEY_ID`: Cloudflare R2 Access Key ID
  - `CF_SECRET_ACCESS_KEY`: Cloudflare R2 Secret Access Key
- **Cloudflare Management API**:
  - `CF_ACCOUNT_ID`: Cloudflare Account ID
  - `CF_API_TOKEN`: Cloudflare Scoped API Token (DNS, Cache Purge, Workers)
  - `CF_GLOBAL_API_KEY`: Cloudflare Global API Key
- **Primary Use Cases**:
  - Direct zero-egress asset storage & CDN media delivery via Cloudflare R2.
  - Automated Cloudflare edge cache purging upon deployment.
  - Cloudflare Workers / Email Routing integrations and API endpoints.
