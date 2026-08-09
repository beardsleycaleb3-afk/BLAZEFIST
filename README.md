# fight
Mobile fighter game
# Fight Game PWA

A high-performance, mobile-first touch Progressive Web App (PWA) fighting game engineered with a dual-worker architecture, dynamic runtime asset mappers, and an off-screen canvas pre-rendering pipeline.

---

## Architecture Overview

This project splits background operations into two specialized worker domains to ensure absolute 60 FPS performance on mobile touch devices:

1. **Service Worker (`sw.js`)**: 
   * Manages offline capability and network interception via the Cache API.
   * Features a **Dynamic Runtime Asset Mapper** that programmatically constructs manifest paths for backgrounds, video sets, sprite sheets, and sequenced character frames.
   * Utilizes **Sequenced Chunk Caching** (processing assets in regulated increments) combined with an **OffscreenCanvas Pre-render Pipeline** to decode and rasterize `.png` bitmaps during installation without blocking the main UI thread.
2. **Dedicated Web Worker (`worker.js`)**:
   * Runs off the main thread to handle heavy computational math, data compression routines, and background game-state matrix parsing.
   * Communicates asynchronously with the main game loop via structured message passing (`postMessage`).

---

## Project Structure

```text
├── index.html            # Main viewport and canvas game shell
├── styles.css            # Absolute portrait touch-locking layout styles
├── manifest.json         # PWA standalone web app manifest configuration
├── sw.js                 # Service Worker (offline cache & off-screen canvas mapper)
├── worker.js             # Dedicated background worker for data/math crunching
├── favicon.png           # Browser icon asset
├── icon-192.png          # PWA 192x192 splash icon
├── icon-512.png          # PWA 512x512 splash icon
└── assets/               
    └── sprites/
        ├── animations/   # Multi-character sprite sheets (.png)
        ├── fighter/      
        │   ├── east/     # Standard directional fighter frames & video sets
        │   └── flaming/  # Alternate state fighter sequences & effects
        └── stages/       
            └── backgrounds/ # Stage background environments (stage1 - stage9)
