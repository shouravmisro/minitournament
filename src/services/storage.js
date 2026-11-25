import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initFirebase, isFirebaseConfigured } from './firebase';

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Compresses an image file in-browser via Canvas so uploads stay fast and lightweight.
 */
export async function compressImageFile(
  file,
  { maxWidth = 480, maxHeight = 480, quality = 0.82, maxDataUrlLength = 110000 } = {}
) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, or WebP).');
  }

  const img = await loadImageElement(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fall back to JPEG if browser lacks WebP encoder
  let mime = 'image/webp';
  let dataUrl = canvas.toDataURL(mime, quality);
  if (!dataUrl.startsWith('data:image/webp')) {
    mime = 'image/jpeg';
    dataUrl = canvas.toDataURL(mime, quality);
  }

  // Step down quality if data URL fallback exceeds safe Firestore threshold
  let currentQuality = quality;
  while (dataUrl.length > maxDataUrlLength && currentQuality > 0.35) {
    currentQuality -= 0.12;
    dataUrl = canvas.toDataURL(mime, currentQuality);
  }

  const blob = await canvasToBlob(canvas, mime, currentQuality);
  return { blob, dataUrl, mime };
}

/**
 * Compresses and uploads an image to Firebase Storage when available,
 * gracefully falling back to the compact compressed data URL if Storage is disabled.
 */
export async function uploadImageAsset(file, storagePathPrefix = 'avatars', options = {}) {
  const { blob, dataUrl, mime } = await compressImageFile(file, options);

  if (isFirebaseConfigured() && blob) {
    try {
      const res = initFirebase();
      if (res?.app) {
        const storage = getStorage(res.app);
        const ext = mime === 'image/webp' ? 'webp' : 'jpg';
        const objectRef = ref(storage, `${storagePathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`);

        const uploadPromise = uploadBytes(objectRef, blob, { contentType: mime }).then(() =>
          getDownloadURL(objectRef)
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Storage upload timed out')), 7000)
        );
        const url = await Promise.race([uploadPromise, timeoutPromise]);
        return { url, source: 'storage' };
      }
    } catch (err) {
      console.warn('Firebase Storage unavailable or blocked; using compressed inline image fallback:', err?.message || err);
    }
  }

  return { url: dataUrl, source: 'inline' };
}
