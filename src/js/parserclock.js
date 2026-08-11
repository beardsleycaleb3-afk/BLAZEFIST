// ═══════════════════════════════════════════════════════════════
//  src/js/parserclock.js  —  MP4 Frame Extractor  |  BLAZEFIST
//
//  Three extraction modes (auto-selected by capability):
//  1. VideoDecoder API  — zero-copy, frame-perfect (Chrome 94+)
//  2. Seek+Capture      — seeks video to each timestamp, snapshots
//  3. Live Video        — streams video directly to canvas each frame
//
//  Primary target: assets/sprites/fighter/east/32hitnormal.mp4
//  Also handles: fireset1-4.mp4, normalrun.mp4, tigerset1.mp4,
//                ultimatetiger.mp4
// ═══════════════════════════════════════════════════════════════

import { Clock } from './src/js/clock.js';

// ── Mode constants ────────────────────────────────────────────
export const PARSE_MODE = {
  AUTO:    'auto',
  DECODER: 'decoder',  // VideoDecoder API
  SEEK:    'seek',     // seek + canvas snapshot (reliable fallback)
  LIVE:    'live',     // draw live video to canvas (no pre-extract)
};

export class ParserClock extends Clock {
  constructor({
    src,
    mode        = PARSE_MODE.AUTO,
    frameWidth  = 92,
    frameHeight = 92,
    sourceFps   = 30,    // assumed source FPS for seek-mode frame stepping
    maxFrames   = 300,   // safety cap
    crossOrigin = 'anonymous',
  } = {}) {
    super('parserclock');
    this.src         = src;
    this.mode        = mode;
    this.frameWidth  = frameWidth;
    this.frameHeight = frameHeight;
    this.sourceFps   = sourceFps;
    this.maxFrames   = maxFrames;
    this.crossOrigin = crossOrigin;

    this.frames      = [];          // extracted ImageBitmap[]
    this.video       = null;        // <video> element
    this._offscreen  = null;        // OffscreenCanvas for extraction
    this._octx       = null;
    this.ready       = false;
    this.loading     = false;
    this.duration    = 0;
    this.frameCount  = 0;
    this._liveFrame  = 0;           // for LIVE mode frame counter
    this._resolvedMode = null;
  }

  // ── Public: load + extract ─────────────────────────────────
  async load(onProgress = null) {
    if (this.loading || this.ready) return this;
    this.loading = true;
    this._emit('loadstart', { src: this.src });

    // Build video element
    this.video = this._buildVideo(this.src);

    // Wait for metadata
    await this._waitForMetadata();
    this.duration   = this.video.duration;
    this.frameCount = Math.min(
      Math.floor(this.duration * this.sourceFps),
      this.maxFrames
    );

    this._emit('metadata', {
      duration: this.duration,
      frameCount: this.frameCount,
      naturalWidth:  this.video.videoWidth,
      naturalHeight: this.video.videoHeight,
    });

    // Build offscreen canvas
    this._offscreen = new OffscreenCanvas(this.frameWidth, this.frameHeight);
    this._octx      = this._offscreen.getContext('2d');

    // Resolve mode
    const resolved = this._resolveMode();
    this._resolvedMode = resolved;

    if (resolved === PARSE_MODE.DECODER) {
      await this._extractDecoder(onProgress);
    } else if (resolved === PARSE_MODE.SEEK) {
      await this._extractSeek(onProgress);
    }
    // LIVE mode: no pre-extraction

    this.ready   = true;
    this.loading = false;
    this._emit('ready', {
      mode:       resolved,
      frameCount: this.frames.length || this.frameCount,
      duration:   this.duration,
    });
    return this;
  }

  // ── Resolved mode selection ───────────────────────────────
  _resolveMode() {
    if (this.mode !== PARSE_MODE.AUTO) return this.mode;
    if (typeof VideoDecoder !== 'undefined' && typeof EncodedVideoChunk !== 'undefined') {
      return PARSE_MODE.DECODER;
    }
    return PARSE_MODE.SEEK;
  }

  // ── Mode 1: VideoDecoder (Chrome 94+) ────────────────────
  async _extractDecoder(onProgress) {
    try {
      // Fetch the video as ArrayBuffer for demuxing
      const resp = await fetch(this.src);
      const buf  = await resp.arrayBuffer();

      // We need to demux MP4. Use a minimal MP4 box parser to
      // extract H.264 NAL units, then feed to VideoDecoder.
      // For compatibility we fall back to seek-mode if demux fails.
      await this._demuxAndDecode(buf, onProgress);
    } catch (err) {
      console.warn('[ParserClock] VideoDecoder path failed:', err.message);
      this._resolvedMode = PARSE_MODE.SEEK;
      await this._extractSeek(onProgress);
    }
  }

  async _demuxAndDecode(buf, onProgress) {
    // Minimal MP4 demuxer — finds mdat/trak/stbl boxes
    const decoder = new VideoDecoder({
      output: async (frame) => {
        try {
          const bmp = await createImageBitmap(frame,
            { resizeWidth: this.frameWidth, resizeHeight: this.frameHeight });
          this.frames.push(bmp);
          frame.close();
          onProgress?.(this.frames.length / this.frameCount);
          this._emit('frame-extracted', { index: this.frames.length - 1 });
        } catch(e) { frame.close(); }
      },
      error: (e) => { throw e; },
    });

    // Configure for H.264 (most common in MP4)
    decoder.configure({
      codec:             'avc1.42E01E',   // Baseline H.264
      codedWidth:        this.video.videoWidth  || 512,
      codedHeight:       this.video.videoHeight || 512,
      optimizeForLatency: false,
    });

    // Parse MP4 boxes to get encoded chunks
    const chunks = parseMp4Chunks(buf);
    if (!chunks.length) throw new Error('No chunks found in MP4');

    for (let i = 0; i < Math.min(chunks.length, this.maxFrames); i++) {
      const chunk = chunks[i];
      decoder.decode(new EncodedVideoChunk({
        type:      chunk.isKey ? 'key' : 'delta',
        timestamp: chunk.timestamp,
        duration:  chunk.duration,
        data:      chunk.data,
      }));
    }

    await decoder.flush();
    decoder.close();
  }

  // ── Mode 2: Seek + Canvas Capture ────────────────────────
  async _extractSeek(onProgress) {
    // Must be loaded enough to seek
    await this._waitForCanPlay();

    for (let i = 0; i < this.frameCount; i++) {
      const t = i / this.sourceFps;
      if (t > this.duration - 0.001) break;

      await this._seekTo(t);
      const bmp = await this._snapFrame();
      if (bmp) {
        this.frames.push(bmp);
        onProgress?.(i / this.frameCount);
        this._emit('frame-extracted', { index: i, timestamp: t });
      }
    }
  }

  _seekTo(t) {
    return new Promise(resolve => {
      const onSeeked = () => {
        this.video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      this.video.addEventListener('seeked', onSeeked, { once: true });
      this.video.currentTime = t;
    });
  }

  async _snapFrame() {
    try {
      this._octx.clearRect(0, 0, this.frameWidth, this.frameHeight);
      this._octx.drawImage(this.video, 0, 0, this.frameWidth, this.frameHeight);
      return await createImageBitmap(this._offscreen);
    } catch(e) { return null; }
  }

  // ── Mode 3: Live draw (no pre-extraction) ────────────────
  // Call drawLive() each render frame to paint current video position
  drawLive(ctx, x, y, w, h) {
    if (!this.video || this.video.readyState < 2) return false;
    ctx.drawImage(this.video, x, y, w ?? this.frameWidth, h ?? this.frameHeight);
    return true;
  }

  // Sync video to a specific game frame for live mode
  syncToGameFrame(gameFrame, animFps) {
    if (!this.video || !this.duration) return;
    const t = (gameFrame / animFps) % this.duration;
    if (Math.abs(this.video.currentTime - t) > 0.05) {
      this.video.currentTime = t;
    }
  }

  // Start/stop live video playback
  playLive()  { this.video?.play().catch(()=>{}); return this; }
  pauseLive() { this.video?.pause();               return this; }

  // ── Frame accessors ───────────────────────────────────────
  getFrame(index) {
    if (!this.frames.length) return null;
    return this.frames[((index % this.frames.length) + this.frames.length) % this.frames.length];
  }

  getFrameAtTime(t) {
    const i = Math.floor(t * this.sourceFps);
    return this.getFrame(i);
  }

  getFrameForGame(gameElapsedMs, animFps = this.sourceFps) {
    const i = Math.floor((gameElapsedMs / 1000) * animFps);
    return this.getFrame(i);
  }

  // Draw extracted frame to context
  drawFrame(ctx, index, x, y, w, h) {
    const bmp = this.getFrame(index);
    if (!bmp) return false;
    ctx.drawImage(bmp, x, y, w ?? this.frameWidth, h ?? this.frameHeight);
    return true;
  }

  // ── Video element builder ─────────────────────────────────
  _buildVideo(src) {
    const v = document.createElement('video');
    v.crossOrigin  = this.crossOrigin;
    v.muted        = true;
    v.playsInline  = true;
    v.preload      = 'auto';
    v.style.cssText = 'position:absolute;top:-9999px;left:-9999px;';
    v.src          = src;
    document.body.appendChild(v);
    return v;
  }

  _waitForMetadata() {
    if (this.video.readyState >= 1) return Promise.resolve();
    return new Promise((res, rej) => {
      this.video.addEventListener('loadedmetadata', res, { once: true });
      this.video.addEventListener('error', rej, { once: true });
      this.video.load();
    });
  }

  _waitForCanPlay() {
    if (this.video.readyState >= 3) return Promise.resolve();
    return new Promise((res, rej) => {
      this.video.addEventListener('canplaythrough', res, { once: true });
      this.video.addEventListener('error', rej, { once: true });
    });
  }

  // ── Cleanup ───────────────────────────────────────────────
  destroy() {
    this.video?.pause();
    this.video?.remove();
    this.video  = null;
    this.frames.forEach(f => f.close?.());
    this.frames = [];
    this.ready  = false;
    this._emit('destroy', {});
  }
}

// ═══════════════════════════════════════════════════════════════
//  Minimal MP4 Box Parser
//  Extracts H.264 encoded chunks from an MP4 ArrayBuffer.
//  Handles: ftyp, moov, trak, mdia, minf, stbl, mdat
// ═══════════════════════════════════════════════════════════════
export function parseMp4Chunks(buf) {
  const view   = new DataView(buf);
  const chunks = [];
  let   offset = 0;

  function readBox(off, end) {
    while (off < end - 8) {
      const size = view.getUint32(off, false);
      if (size < 8 || off + size > end) break;
      const type = String.fromCharCode(
        view.getUint8(off+4), view.getUint8(off+5),
        view.getUint8(off+6), view.getUint8(off+7)
      );
      const boxEnd = off + size;

      if (['moov','trak','mdia','minf','stbl'].includes(type)) {
        readBox(off + 8, boxEnd);
      } else if (type === 'mdat') {
        // Raw media data — treat as single chunk for simple MP4s
        chunks.push({
          isKey:     true,
          timestamp: 0,
          duration:  33333,  // ~30fps default
          data:      new Uint8Array(buf, off + 8, size - 8),
        });
      } else if (type === 'stco') {
        // Sample table chunk offsets — extract per-sample chunks
        const version    = view.getUint8(off + 8);
        const entryCount = view.getUint32(off + 12, false);
        for (let i = 0; i < entryCount && i < 300; i++) {
          const chunkOffset = view.getUint32(off + 16 + i * 4, false);
          if (chunkOffset + 4 < buf.byteLength) {
            const nalSize = view.getUint32(chunkOffset, false);
            const end2    = Math.min(chunkOffset + 4 + nalSize, buf.byteLength);
            chunks.push({
              isKey:     i === 0,
              timestamp: i * 33333,
              duration:  33333,
              data:      new Uint8Array(buf, chunkOffset + 4, end2 - chunkOffset - 4),
            });
          }
        }
      }
      off = boxEnd;
    }
  }

  try { readBox(0, buf.byteLength); } catch(e) { /* partial parse is fine */ }
  return chunks;
}

export default ParserClock;
