# GRID-RIFT visual reference package · v0.2

## Status
All six supplied PNGs are present in the canonical `assets/visual-references/` directory. Their SHA-256 hashes were verified against the manifest below on 2026-10-20. The owner's originals in `visual-references/` are retained. The revised gameplay and topology references (01 and 02) were opened and visually inspected: both are readable, including route annotations and the central relay. These are concept references, not measured geometry or implemented gameplay.

| File | Purpose | Priority |
|---|---|---|
| [00-cover.png](../assets/visual-references/00-cover.png) | Identity and atmosphere; not a gameplay geometry specification | Mood |
| [01-gameplay-tactical-v2.png](../assets/visual-references/01-gameplay-tactical-v2.png) | **Revised** actual gameplay viewing angle and terrain density | High |
| [02-arena-layout-tactical-v2.png](../assets/visual-references/02-arena-layout-tactical-v2.png) | **Revised** tactical topology and route choices | High |
| [03-runner-character.png](../assets/visual-references/03-runner-character.png) | First unit silhouette, helmet, front/side/back appearance | High |
| [04-environment-kit.png](../assets/visual-references/04-environment-kit.png) | Reusable environmental blocks and relay form | Medium |
| [05-combat-language.png](../assets/visual-references/05-combat-language.png) | Readable windup, projectile, dash and relay states | High |

## Approval and intent
The owner preferred a **restrained, iconic Tron/Daft Punk-influenced** direction over a crowded cinematic science-fiction poster. Retain the appeal of smooth helmets, clean geometric forms, purposeful light, cyan/amber, and broad outdoor horizons. Avoid copying a specific franchise design.

The original first gameplay and arena map references were rejected as **too simple and easy**. The revised images 01 and 02 replace those older references. Their intention is to make terrain itself create strategic difficulty: asymmetrical elevated and lower spaces; cover; unequal visibility; a fast exposed route; slower protected route; riskier flank; hidden cut-through; small secondary node; internal cover at the central relay; and nontrivial retreats. The terrain should offer multiple sensible but consequential choices, closer to MOBA positional depth without MOBA visual clutter.

## Rules for Codex
- Images are concept references, **not exact level plans, engine assets, or validated geometry**.
- Preserve sight-line, collision, navigation, and visibility truth in simulation data. **Do not infer exact distances, slopes, jump access, occlusion or capture timings from pixels.**
- The design document and experiment schemas determine actual mechanics; proposed extra scan nodes, underpasses, flanks, elevations, and concealment need explicit rules and tests before they are active.
- The stage 1 first encounter must remain manageable. Implement tactical decisions incrementally, checking counterplay and path accessibility. No artificial challenge from unreadable controls, decorative mist, or misleading lighting.
- Do not treat a visual annotation as an automatic extra game objective or a permanent universal engine assumption.
- Smooth surfaces and minimal neon should improve readability; tactical density must come from geometry and interactions, not asset clutter.
- The hero sheet includes a trailing fabric-like element; this is optional and may be removed if it obscures the silhouette in gameplay.
- The concept-sheet Q/W graphics are illustrative; the authoritative mapping and abilities come from `docs/06-GAMEPLAY-SYSTEMS.md`.
- View and evaluate the **two revised battlefield images together**: visual target (01) and topology reference (02). If they disagree, resolve the level layout in a versioned source-of-truth map specification, not through visual guessing.

## Image checksums (SHA-256)
These identify the original generated PNG binaries in the separate package.

```
7e8db6def909e7c06716c01d9f9b67c0a79bb2b4285f622d8f80cb72153dd27d  00-cover.png
6c3a44ac5bfb1707b9f3458fa7dda0ca8f7bb6084d7c0b4fda6630bd6547327b  01-gameplay-tactical-v2.png
34ff09b07ae4952f342434dc0fa21d343ed084c0ac038aa8437347d139b9db13  02-arena-layout-tactical-v2.png
69e3a0caf304ad8aa89bb7a659487765eb72fcb6ea4648bbfbda29cf204ab471  03-runner-character.png
cf1f264d0d1d53bab3866dec40fe5d7857cbc54c6b292f6b65e0d5ed64c10a38  04-environment-kit.png
adbd9a26366164b6d3dd43ca19633ac69e124d335deeec1fe0a3d7dc8f6c69ae  05-combat-language.png
```

The verified file links above retain these hashes as a reference point. This is a **visual reference-only** update, not a change to the simulation architecture or a claim that Stage 1 is implemented.
