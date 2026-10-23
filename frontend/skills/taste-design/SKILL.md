---
name: taste-design
description: Design La Cita with character and taste — real imagery, authentic direction, avoiding generic patterns. Based on Leonxlnx/taste-skill. Use this to ensure the app avoids looking like every other SaaS landing page and instead reflects Camila's struggle with authenticity and warmth.
compatibility: Next.js, Tailwind CSS, real photography
---

# Taste Design for La Cita

Design with **taste**: real photographs, honest direction, character. Based on [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill).

The problem: AI tends to assemble the **average landing page**. Three cards, purple gradient, stock photo, dashboard template. Taste-driven design breaks that pattern by:

1. **Real imagery** — photographs from open archives, credited, that tell a story
2. **Honest direction** — design decisions rooted in Camila's real problem, not trend forecasting
3. **Testable output** — check the design in a real browser; iterate until it feels right

## Philosophy for La Cita

**What makes La Cita different?**
- Camila's problem is **emotional**: guilt after missing gym. Not a fitness app; an appointment-keeping system.
- Her struggle is **real**: work meetings run over, she's tired, the guilt kills motivation.
- The solution is **simple**: a calendar + reminder that says "moving is not failing."

**So the design should:**
- Show warmth, not minimalism for its own sake
- Use real scenarios (a calendar, a person's morning, an office) not stock illustrations
- Reflect the tone: "no culpa, no vergüenza" — no shame language, no guilt-triggering colors
- Be calming, like talking to a friend who gets it

## Real Photography Rules

✅ **Use real photographs:**
- Open archive sources: [Unsplash](https://unsplash.com), [Pexels](https://pexels.com), [Flickr Commons](https://flickr.com/commons)
- Credited always (can be small, bottom of page)
- Contextual: show real calendars, real offices, real mornings — not "gym motivation" clichés

❌ **Avoid:**
- Stock gym photos (weights, muscles, fitness influencers)
- Corporate lifestyle photography
- 3D renders or AI-generated imagery
- Illustrations of people (unless illustrating a concept, and even then: spare)

## Layout Patterns to Break

**The average SaaS:**
- Hero: centered title + big button + product screenshot
- Features: 3 identical cards with icons (❌ prohibited in design-system)
- CTA: "Start free trial"
- Footer: links in columns

**For La Cita, instead:**
- Hero: a real photograph (a desk calendar, a gym entrance, a morning) + one sentence explaining the problem
- Features: narrative sections, each with a real photo + explanation
- CTA: "Link your Google Calendar" (do something, not start a trial)
- Navigation: minimal; focus on the one thing (calendar)

## Example Page Structure

### Section 1: The Problem (Hero)

```html
<div class="relative">
  <!-- Real photograph: an office desk with calendar visible -->
  <img src="/images/office-desk-calendar.jpg" alt="A desk calendar in an office" />
  <div class="absolute inset-0 bg-black/30" />
  <div class="absolute inset-0 flex items-end">
    <div className="p-8">
      <h1>«Mañana parto»</h1>
      <p>Domingo 23:55, cada semana. Y el lunes, la reunión se alarga, la culpa llega, y no volvés.</p>
      <button>Linkea tu calendario</button>
    </div>
  </div>
</div>
```

### Section 2: How It Works

```html
<div className="space-y-12">
  <!-- Step 1: Photo of a phone with a Telegram notification -->
  <div className="grid grid-cols-2 gap-8 items-center">
    <img src="/images/phone-notification.jpg" alt="A phone showing a message" />
    <div>
      <h2>Cada domingo a las 20:00</h2>
      <p>Te llega un mensaje. «¿Cuándo tu cita?» Dos horarios donde sí te queda, lista la cita en tu calendario.</p>
    </div>
  </div>
  
  <!-- Step 2: Photo of a calendar app -->
  <div className="grid grid-cols-2 gap-8 items-center">
    <div>
      <h2>Tu calendario, tu regla</h2>
      <p>No es otra app. Es tu Google Calendar. La cita está ahí junto a tus reuniones.</p>
    </div>
    <img src="/images/google-calendar.jpg" alt="Google Calendar showing an appointment" />
  </div>
  
  <!-- Step 3: Photo of someone texting -->
  <div className="grid grid-cols-2 gap-8 items-center">
    <img src="/images/person-texting.jpg" alt="Someone texting on their phone" />
    <div>
      <h2>«Hoy no puedo»</h2>
      <p>Si la reunión se alarga, movés. Sin culpa. Mover no es fallar.</p>
    </div>
  </div>
</div>
```

### Section 3: The Result

```html
<div className="bg-green-50 p-12 rounded-lg">
  <h2>«Tu mensualidad ya estaba pagada: hoy recuperaste $11.633.»</h2>
  <p>No es gamificación. Es verdad: cada cita es dinero que ya pusiste y que ahora vale.</p>
</div>
```

## Color Palette (Grounded)

- **Primary photo**: warm, natural light (morning offices, calm settings)
- **Text on photos**: white with black drop shadow (readable, not corporate)
- **CTA button**: blue (trust, action) not purple
- **Accent**: amber for "moved" status (warm, not alarming)
- **Background**: neutral white or light gray (let photos breathe)

## Photography Sources & Credits

Template for credits (small, bottom):

```
"Office desk" by [photographer] via Unsplash
"Phone notification" by [photographer] via Pexels
"Google Calendar" screenshot by Camila (or demo account)
```

**Find images for:**
- Morning in an office
- A person receiving a notification
- A calendar app on a phone
- Someone in a gym entrance (real person, not stock)
- A desk with coffee and calendar
- A person looking relieved

## Testing in Real Browser

Before shipping:

1. Load page in Chrome, Safari (mobile + desktop)
2. Check photograph load times (compress if >200KB)
3. Verify text contrast over photos (APCA threshold)
4. Test on slow connection (3G simulation)
5. Photograph doesn't distract from the message

## What NOT to Do

❌ Use "modern" design trends (glassmorphism, neumorphism, wavy SVGs)
❌ Purple gradient anywhere
❌ Hero with centered content + 3 cards
❌ AI-generated images (even if they look good)
❌ Fitness influencer or gym cliché photography
❌ Circular avatars with initials
❌ Explainer animations (they're filler)

✅ Real photographs that tell the story
✅ One job per section (problem → solution → proof)
✅ Warm, honest tone
✅ Text that explains, not decorates

## References

- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) — Design with character
- [tasteskill.dev](https://tasteskill.dev) — Case studies
- [tastecode.dev](https://tastecode.dev) — Design + agent integration
- [emilkowalski/skills](https://github.com/emilkowalski/skills) — Motion paired with taste
- [vercel-labs/web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)

## Next Step

Use this direction to redesign the landing page. After landing page, apply taste principles to the dashboard (calendar view, appointment cards).
