# Companion appearance and movement

These are custom vector fan-art interpretations, not official character assets or motion-captured performances. The source traits below inform the animation; numerical speeds, walk timing, limb angles, and workspace interactions are original design choices. No speech bubbles or floating chat controls are shown.

## Virat Kohli

Reference: [ICC's interview about his batting adjustments](https://www.icc-cricket.com/news/kohli-reveals-game-plan-as-countdown-continues-to-t20-world-cup), and [BCCI's discussion of his routine and planning](https://www.bcci.tv/news/article/virat-kohli-the-man-behind-the-batsman).

The ICC describes his right-handed batting, cover drive, and use of his feet to meet the ball earlier. Our signature sequence interprets that as preparation and backlift, a small weight shift forward, downswing/contact, elevated follow-through, and recovery. A local ball animation is synchronized to contact rather than appearing on every tap. The bat has its own pivot, and the hands and torso follow different timing curves. The everyday walk uses a longer stride and much smaller body bob than the Pokémon. Appearance uses a stylized bearded face, dark hair, a blue jersey and number 18; no photorealistic likeness is claimed.

## Goku

References: [Official technique compendium](https://en.dragon-ball-official.com/news/01_140.html) and [official Kamehameha feature](https://en.dragon-ball-official.com/news/01_659.html).

The official compendium describes concentrating energy and releasing it through the hands. The signature animation therefore has anticipation, a lowered stance, hands drawn back toward the hip, a growing energy orb, forward hand movement, a brief local beam, and a return to rest. It runs once, with no autonomous attacks across the application. Dark spiky hair, an orange outfit and blue accents distinguish the silhouette. Goku's gait is more energetic and longer-strided than Knot's, with counter-swinging arms. These are custom poses rather than a copied animation sequence.

## Pikachu

References: [Official Pokédex](https://www.pokemon.com/uk/pokedex/pikachu) and [the original creators' design interview](https://www.pokemon.com/us/pokemon-news/creator-profile-the-creators-of-pikachu).

The official descriptions identify cheek electricity, black ear tips, yellow coloration and a lightning-shaped tail. The custom action braces the body, brings the ears into the motion, discharges local cheek sparks, then settles. Shorter steps and a quicker cadence distinguish its walk. Ear and tail motion use separate pivots so they lag the body rather than moving as one rigid piece. The effect is bounded to the pet, without strobing the interface.

## Charmander

Reference: [Official Pokédex](https://www.pokemon.com/us/pokedex/charmander). The page was blocked to the research tool during this session; [Pokémon's official card catalogue](https://assets.pokemon.com/assets/cms/pdf/tcg/carddex/EX_Dragon.pdf) confirms the Fire-type character. The familiar orange silhouette, cream belly, and flame-tipped tail are implemented as stylized art; the exact flame and Ember choreography is our interpretation.

Charmander uses a slower, deliberate gait. Its tail pivots separately from the torso, and its flame has a small secondary motion. The Ember sequence draws the body back, releases a short local flame, and settles. The tail flame stays visible in sleep and does not turn into a damage or productivity indicator.

## Shared movement and interaction rules

- Travel accelerates into a walk and slows near the destination. Step phase is based on distance, not elapsed animation time, keeping the feet tied to actual movement.
- Direction changes keep the front-facing silhouette intact; shoulder lead and gaze replace horizontal mirroring, so the pet never collapses to an edge and jersey text stays readable.
- Left and right feet alternate between contact and swing; arms counter-swing. Body bob and sway are character-specific.
- Idle movement is restrained; humans do not use the same bouncing walk as small creatures.
- Dragging, falling and landing use the shared physics controller. Signature actions stop wandering and run once on double-tap or menu action. Opening options pauses walking.
- Right-click, touch long-press, or Shift+F10 opens options. Settings has the character picker.
- System reduced-motion preferences and WebTrak's own motion setting suppress decorative movement and effects. Animation pauses when the page is hidden.

Regression checks cover stationary feet, alternating steps, stride periodicity, and distinct profiles. Visual checks remain necessary to judge character likeness and animation quality.
