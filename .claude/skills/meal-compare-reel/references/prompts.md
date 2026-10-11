# The Google Flow prompt set

Generated from the live board, so this file and the artifact can never drift apart.

Replace `{top dish}` and `{bottom dish}` with a **description of what the dish looks like**, not just its name — colour, garnish, toppings, how it sits. `two gulab jamun` invites the model to draw its own; `two dark amber gulab jamun in pale syrup with chopped pistachio on top` reproduces yours.

**Plate scale:** every image prompt fixes each plate at roughly half the frame width with wide bare tabletop on all sides. This is anchored in M — regenerate the master first, because every later image copies its camera height.

## Order

1. **M** master image — once for the channel
2. **D** empty tabletop — once
3. **F** both plates — before E
4. **E** top plate alone, by removing the lower plate from F
5. **C1a** clip 1: D to E
6. **C1b** clip 2: E to F
7. **C2** fallback if the hand fails

## Prompt M · The master image

*Nano Banana Pro · Image · 4 outputs · 9:16 · NO reference attached — generate once for the whole channel, then attach it to everything else*

```
Overhead 90° top-down food photograph, camera pointing straight down at a flat horizontal surface. The background is a plain seamless matte warm bone-white stone tabletop, laid flat and seen from directly above, colour #FAFAF7 fading very slightly to #E0E0DA toward the corners, with only a very fine natural stone speckle and subtle tonal variation — a real studio tabletop, not a flat digital colour. It is a horizontal surface, never a wall.

A single plain matte off-white stoneware plate with a slightly irregular hand-thrown rim sits a little off-centre in the frame, with generous empty tabletop all around it. It holds sliced grilled chicken breast with roasted red pepper, courgette and broccoli.

Styled to look as appetising and craveable as possible — generous, inviting, vibrant natural colour, caught at the exact moment you would most want to eat it. Deliberately and attractively plated: centred on the plate, filling it properly, with the main item as the clear hero, arranged the way that dish is genuinely served. Never a careless heap, and never a symmetrical diagram of evenly spaced compartments. Steam appears only if the dish is one served piping hot straight from a pan, pot, fryer or oven. Sweets, mithai, desserts, anything in syrup, anything at room temperature or chilled, and anything fresh, cold, raw or fruit give off no steam, vapour, mist or haze at all.

Camera height is set so that the plate's diameter is roughly half the width of the frame — never more than that. The plate sits small within a wide field of empty tabletop, not filling the frame, with generous bare tabletop on every side and clear margins along all four edges. Nothing is cropped and nothing touches an edge.

Lighting: a single large soft window light from the upper left, bright warm daylight, wrapping around the food so its colour and texture read clearly, with a gentle shadow falling to the lower right. Bright, clean and inviting — never dim, murky or heavily shadowed. No harsh specular highlights, no rim light, no second light source.

Camera: 50mm at f/5.6, fixed overhead height, sharp and clean across both plates. Crisp, bright, high quality, rich true-to-life colour.

No hands, no people, no text, no logos, no cutlery, no napkins, no props, no crumbs, no wall, no vertical surface, no plate cut off by the frame edge. Nothing burnt, blackened, stewed, wilted, shrivelled, dried out, greyed, muddy or dull in colour. Rich, fresh, appetising colour throughout. Vertical 9:16.
```

## Prompt D · Empty tabletop

*Nano Banana 2 · Image · 1 output · 9:16 · attach the master (Prompt M) — generate once, reuse forever*

```
Overhead 90° top-down food photograph, camera pointing straight down at a flat horizontal surface. The background is a plain seamless matte warm bone-white stone tabletop, laid flat and seen from directly above, colour #FAFAF7 fading very slightly to #E0E0DA toward the corners, with only a very fine natural stone speckle and subtle tonal variation — a real studio tabletop, not a flat digital colour. It is a horizontal surface, never a wall.

The frame shows nothing but the empty bone-white stone tabletop, edge to edge, with its fine natural speckle and subtle tonal variation, lit soft and even with only a gentle falloff toward the lower-right corner and no visible light streak, band or diagonal across the surface.

Lighting: a single large soft window light from the upper left, bright warm daylight, wrapping around the food so its colour and texture read clearly, with a gentle shadow falling to the lower right. Bright, clean and inviting — never dim, murky or heavily shadowed. No harsh specular highlights, no rim light, no second light source.

Camera: 50mm at f/5.6, fixed overhead height, sharp and clean across both plates. Crisp, bright, high quality, rich true-to-life colour.

No plate, no food, no hands, no people, no text, no logos, no cutlery, no napkins, no props, no crumbs, no shadows of removed objects, no wall, no vertical surface. Vertical 9:16.
```

## Prompt F · Both plates

*Nano Banana 2 · Image · 2 outputs · 9:16 · attach the master (Prompt M) — generate this before Prompt E. Describe each dish by APPEARANCE, not just name.*

```
Overhead 90° top-down food photograph, camera pointing straight down at a flat horizontal surface. The background is a plain seamless matte warm bone-white stone tabletop, laid flat and seen from directly above, colour #FAFAF7 fading very slightly to #E0E0DA toward the corners, with only a very fine natural stone speckle and subtle tonal variation — a real studio tabletop, not a flat digital colour. It is a horizontal surface, never a wall.

Two identical vessels sit one above the other on the tabletop, both centred left to right, with a clear gap of bare tabletop between them. Both are the same plain matte off-white stoneware plate — identical in size, shape, depth and colour, with slightly irregular hand-thrown rims. Never one plate and one bowl, never a bowl stacked on a plate, never two different vessels.

Camera height is set so that each plate's diameter is roughly half the width of the frame — never more than that. The plates sit small within a wide field of empty tabletop, not filling the frame. Generous bare tabletop shows on every side: a wide band above the upper plate, a clear gap between the two plates, a wide band below the lower plate, and clear margins along both left and right edges. Nothing is cropped and nothing touches an edge.

Upper plate, centred roughly one third of the way down the frame: {TOP DISH}. Styled to look as appetising and craveable as possible — generous, inviting, vibrant natural colour, caught at the exact moment you would most want to eat it. Deliberately and attractively plated: centred on the plate, filling it properly, with the main item as the clear hero, arranged the way that dish is genuinely served. Never a careless heap, and never a symmetrical diagram of evenly spaced compartments. Steam appears only if the dish is one served piping hot straight from a pan, pot, fryer or oven. Sweets, mithai, desserts, anything in syrup, anything at room temperature or chilled, and anything fresh, cold, raw or fruit give off no steam, vapour, mist or haze at all.

Lower plate, centred roughly two thirds of the way down the frame: {BOTTOM DISH}. Styled to look as appetising and craveable as possible — generous, inviting, vibrant natural colour, caught at the exact moment you would most want to eat it. Deliberately and attractively plated: centred on the plate, filling it properly, with the main item as the clear hero, arranged the way that dish is genuinely served. Never a careless heap, and never a symmetrical diagram of evenly spaced compartments. Steam appears only if the dish is one served piping hot straight from a pan, pot, fryer or oven. Sweets, mithai, desserts, anything in syrup, anything at room temperature or chilled, and anything fresh, cold, raw or fruit give off no steam, vapour, mist or haze at all.

The two plates hold completely different food and must look clearly different from each other. The lower plate is never a copy or a recolour of the upper one.

Portion fidelity is critical: show the full stated amount, not a neat or attractive serving. Where the amount is large, the plate is heaped well above the rim, piled high and spilling toward the edges. Never reduce, tidy or shrink the portion to balance the composition — the difference in volume between the two plates is the entire point of the image.

Shot from a single fixed overhead camera height, matching the reference image exactly, so both plates are visibly the same size — each roughly half the frame width — and only the food on them differs.

Lighting: a single large soft window light from the upper left, bright warm daylight, wrapping around the food so its colour and texture read clearly, with a gentle shadow falling to the lower right. Bright, clean and inviting — never dim, murky or heavily shadowed. No harsh specular highlights, no rim light, no second light source.

Camera: 50mm at f/5.6, fixed overhead height, sharp and clean across both plates. Crisp, bright, high quality, rich true-to-life colour.

No hands, no people, no text, no logos, no cutlery, no napkins, no props, no crumbs, no wall, no vertical surface, no plate cut off by the frame edge. Nothing burnt, blackened, stewed, wilted, shrivelled, dried out, greyed, muddy or dull in colour. Rich, fresh, appetising colour throughout. Vertical 9:16.
```

## Prompt E · Top plate alone

*Nano Banana 2 · Image · 1 output · 9:16 · attach PROMPT F's output as reference — removal only, never repositioning*

```
Take the reference image and remove only the lower plate and all of its food, so that area becomes bare bone-white stone tabletop matching the surrounding surface exactly in tone, speckle, grain and lighting, with no leftover shadow, outline, mark or discolouration where the plate used to be.

Everything else must remain absolutely identical to the reference — the upper plate holding {TOP DISH}, its exact position, its shadow, the tabletop, the light direction, the falloff and the vignette. Do not redraw, restyle, move or resize the upper plate or its food in any way. It stays exactly the same size — roughly half the frame width — in exactly the same position, with the same wide margin of empty tabletop around it.

The entire lower half of the frame is empty tabletop with nothing on it.

No second plate, no food in the lower half, no hands, no people, no text, no logos, no cutlery, no napkins, no props, no crumbs, no ghost shadows, no wall, no vertical surface. Vertical 9:16.
```

## Prompt C1a · Clip 1 — top plate placed

*Omni Flash · Video → Frames · start = empty tabletop (D) · end = Prompt E · 10s · 1080p*

```
Only one hand ever appears in this clip. The second hand never enters the frame. At no point are two hands visible.

The clip begins on a completely empty tabletop. Nothing is on it. The plate is NOT on the table at the start and must never fade in, appear, or materialise on its own.

A single woman's right hand enters from the bottom of the frame already carrying an off-white stoneware plate holding {TOP DISH}, balanced flat and level on her open palm with her fingers spread beneath it, the way a waiter carries a plate one-handed. It is visibly resting on her palm the entire time it is moving. She lowers it level onto the surface, slides her hand out from underneath, and withdraws smoothly back out of the bottom of the frame over about three seconds. Her other hand never appears, never enters frame, and never touches any plate. She places it in the upper part of the tabletop.

Match the final reference frame exactly. Do not redraw, restyle or reinterpret any dish from a generic idea of what it is called — copy precisely what is in that frame. Keep the same colours, the same garnish in the same places, the same sauces and swirls in the same pattern, and the same pieces in the same positions. Every garnish, syrup, sauce, nut, sprinkle, herb, drizzle and small bowl stays exactly where it is. Do not lighten, brighten, recolour, simplify or clean up the food. Nothing falls off, disappears, or changes in shape, amount or position.

Her hand wears a thin transparent food-safe glove, close-fitting and smooth against the skin, with no bunching, no wrinkles, no air pockets and no loose plastic at the fingertips. The hand beneath is clearly visible through it: a woman's hand, slender fingers, short neat natural nails, no rings, no watch, no bracelet. A soft sage-grey knit sleeve at the wrist. Exactly five fingers, natural human hand anatomy.

Once the hand has left, the food stays still and holds its shape and colour. Steam appears only if the dish is one served piping hot straight from a pan, pot, fryer or oven. Sweets, mithai, desserts, anything in syrup, anything at room temperature or chilled, and anything fresh, cold, raw or fruit give off no steam, vapour, mist or haze at all. The camera does not move, zoom, pan or drift at any point. The framing never changes and nothing is cropped or enlarged. No people, no text, no camera shake, and never a second hand.
```

## Prompt C1b · Clip 2 — bottom plate placed

*Omni Flash · Video → Frames · start = Prompt E · end = Prompt F · 10s · 1080p*

```
Only one hand ever appears in this clip. The second hand never enters the frame. At no point are two hands visible.

At the start of the clip, a plate holding {TOP DISH} is already sitting in the upper part of the frame, and the lower part of the tabletop is completely empty. That upper plate and everything on it must not move, shift, rotate, be touched or change in any way at any point.

The second plate is NOT on the table at the start and must never fade in, appear, or materialise on its own. A single woman's right hand enters from the bottom of the frame already carrying a plate holding {BOTTOM DISH}, balanced flat and level on her open palm with her fingers spread beneath it, the way a waiter carries a plate one-handed. It is visibly resting on her palm the entire time it is moving. She lowers it level onto the surface, slides her hand out from underneath, and withdraws smoothly back out of the bottom of the frame over about three seconds. Her other hand never appears, never enters frame, and never touches any plate. She places it in the empty lower part of the tabletop, beneath the first plate.

The two plates hold completely different food and must stay different for the whole clip. The upper plate holds {TOP DISH}. The lower plate holds {BOTTOM DISH}. The lower plate never becomes a copy of the upper plate, and never takes on its colour, texture or contents.

Match the final reference frame exactly. Do not redraw, restyle or reinterpret any dish from a generic idea of what it is called — copy precisely what is in that frame. Keep the same colours, the same garnish in the same places, the same sauces and swirls in the same pattern, and the same pieces in the same positions. Every garnish, syrup, sauce, nut, sprinkle, herb, drizzle and small bowl stays exactly where it is. Do not lighten, brighten, recolour, simplify or clean up the food. Nothing falls off, disappears, or changes in shape, amount or position.

Her hand wears a thin transparent food-safe glove, close-fitting and smooth against the skin, with no bunching, no wrinkles, no air pockets and no loose plastic at the fingertips. The hand beneath is clearly visible through it: a woman's hand, slender fingers, short neat natural nails, no rings, no watch, no bracelet. A soft sage-grey knit sleeve at the wrist. Exactly five fingers, natural human hand anatomy.

Once the hand has left, both plates stay still and hold their shape and colour. For each plate independently: Steam appears only if the dish is one served piping hot straight from a pan, pot, fryer or oven. Sweets, mithai, desserts, anything in syrup, anything at room temperature or chilled, and anything fresh, cold, raw or fruit give off no steam, vapour, mist or haze at all. The camera does not move, zoom, pan or drift at any point. The framing never changes and nothing is cropped or enlarged. No people, no text, no camera shake, and never a second hand.
```

## Prompt C2 · Fallback — no hand

*Use only if the glove returns with a wrong finger count or fuses into the plate · start frame only, no end frame*

```
Near-static locked-off overhead shot. The camera does not move, zoom, pan or drift. The framing stays exactly as it is for the entire clip and the plates are never cropped or enlarged. The food does not move or change shape and holds its colour. Steam appears only if the dish is one served piping hot straight from a pan, pot, fryer or oven. Sweets, mithai, desserts, anything in syrup, anything at room temperature or chilled, and anything fresh, cold, raw or fruit give off no steam, vapour, mist or haze at all. No hands, no people, no camera movement, no text.
```
