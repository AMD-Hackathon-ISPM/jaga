# Jaga · Design Guidelines

> Brand, voice, color, type, components, motion, and the signature visual.
> Companions: `product-brief.md` · `product-requirements.md` · `project-architecture.md` · `context-dump.md`.

---

## Personality
Calm, trustworthy, clinical-but-warm, and unmistakably **made for the field**. Jaga should feel like a steady guardian, not a flashy gadget — confident and clear under pressure, legible on a cheap phone in bright sunlight, reassuring to a worried patient and a busy health worker alike.

## Voice & tone
- Plain, direct, kind. Sentence case. No hype, no exclamation marks, no emoji.
- **Bilingual: Bahasa Indonesia + English**, Bahasa-first for field UI. Plain-language results a non-specialist understands.
- Always frame results as **triage and next step** ("Refer for a confirmatory test"), never as a diagnosis or a verdict on the person.

## Color
- **Primary:** a calm teal/green (health, breath, growth) for brand, navigation, and primary actions.
- **Risk semantics (used sparingly, never alarmist):** Low = green, Elevated = amber, High = red — paired always with text + an icon, never color alone (color-blind safe).
- **Neutrals:** high-contrast ink on near-white for legibility; a dark surface only behind the X-ray viewer.
- The **spectrogram** uses a perceptual colormap (blue → teal → amber → red) that reads in both light and dark.

## Typography
- One highly legible humanist sans (e.g. Inter / system) for everything; large base size for field readability.
- Numbers and risk percentages are large and unambiguous; round all displayed values.

## Layout & components
- **Big touch targets**, generous spacing, one primary action per screen — usable one-handed, in the field, by a non-technical worker.
- Step-based capture flow (demographics → symptoms → cough → optional X-ray → result) with a clear progress indicator and clear required/optional badges.
- Cards for each result panel; a single decisive triage banner on top.
- Connectivity states are explicit and friendly: clear loading, retry, and "submitting securely" states (inference is online), graceful on slow/intermittent networks.

## The signature visual (the "wow")
The **result reveal**: the cough **mel-spectrogram** animates in with a **model-attention overlay** (labelled "where the model focused," not "the reason"), the calibrated **risk band** resolves, and the key contributing factors surface — making the AI's reasoning *visible*, not a black box. *(Stretch: if a digital X-ray was added, its independent likelihood + attention heatmap appear in a separate panel — shown alongside, not blended into the score.)* This is the one deliberate, memorable motion moment.

## Motion
Subtle and functional everywhere except the result reveal. Respect reduced-motion settings. Nothing decorative that costs performance on a low-end device.

## Iconography
Simple, universally legible outline icons (microphone, lungs, shield/guard, check, refer). Pair icons with words for low-literacy accessibility.

## Accessibility & field constraints
- Resilient on **slow / intermittent networks** (inference is online — handle latency, timeouts, and retries gracefully), on **low-end Android**, and on **small / low-brightness screens**.
- High contrast; large type; color never the sole signal; screen-reader labels.
- Low-literacy support: icons + plain language + (future) voice prompts in Bahasa.
- Keep the whole experience lightweight — fast on modest hardware is a design requirement, not a nice-to-have.
