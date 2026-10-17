import { parseGIF, decompressFrames } from './assets/vendor/gifuct.js';

// Rendering GIF frames on the physics clock makes Pause freeze the actual
// frame, including its remaining delay, instead of restarting the GIF.
export function createGifPlayer(image, data) {
  const canvas = document.createElement('canvas');
  canvas.className = 'gif-canvas'; canvas.setAttribute('aria-hidden', 'true');
  let frames, width, height;
  try {
    const gif = parseGIF(data);
    width = gif.lsd.width; height = gif.lsd.height;
    const images = gif.frames.filter(frame => frame.image);
    const pixels = images.reduce((sum, frame) => sum + frame.image.descriptor.width * frame.image.descriptor.height, 0);
    if (!width || !height || width * height > 4_000_000 || pixels > 8_000_000 || images.length > 600) throw new Error('Use static pause for large GIFs');
    frames = decompressFrames(gif, true);
    if (!frames.length) throw new Error('No GIF frames');
  } catch {
    // Large or unusual GIFs can still be frozen without decoding every frame.
    canvas.width = Math.min(512, image.naturalWidth);
    canvas.height = Math.max(1, Math.round(image.naturalHeight * canvas.width / image.naturalWidth));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    image.after(canvas);
    return {
      advance() {}, reset() {},
      setPlaying(playing) { canvas.hidden = playing; image.classList.toggle('gif-source', !playing); },
      destroy() { canvas.remove(); canvas.width = canvas.height = 0; image.classList.remove('gif-source'); },
    };
  }
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const patchCanvas = document.createElement('canvas');
  const patchContext = patchCanvas.getContext('2d');
  let index = 0, elapsed = 0, restore = null;

  function paint() {
    const frame = frames[index];
    if (frame.disposalType === 3) restore = context.getImageData(0, 0, width, height);
    const { left, top, width: w, height: h } = frame.dims;
    patchCanvas.width = w; patchCanvas.height = h;
    patchContext.putImageData(new ImageData(frame.patch, w, h), 0, 0);
    context.drawImage(patchCanvas, left, top);
    canvas.dataset.frame = String(index);
  }
  function dispose() {
    const frame = frames[index];
    if (frame.disposalType === 2) context.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    else if (frame.disposalType === 3 && restore) context.putImageData(restore, 0, 0);
    restore = null;
  }
  paint(); image.after(canvas); image.classList.add('gif-source');
  return {
    advance(milliseconds) {
      if (frames.length < 2) return;
      elapsed += milliseconds;
      while (elapsed >= Math.max(20, frames[index].delay || 100)) {
        elapsed -= Math.max(20, frames[index].delay || 100);
        dispose(); index = (index + 1) % frames.length;
        if (index === 0) context.clearRect(0, 0, width, height);
        paint();
      }
    },
    setPlaying() {},
    reset() { index = elapsed = 0; restore = null; context.clearRect(0, 0, width, height); paint(); },
    destroy() { canvas.remove(); canvas.width = canvas.height = patchCanvas.width = patchCanvas.height = 0; frames = []; restore = null; image.classList.remove('gif-source'); },
  };
}
