import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { uploadImageAsset } from '../services/storage';

export default function ImageUploadButton({
  onUploaded,
  storagePath = 'uploads',
  label = 'Upload Photo',
  maxWidth = 480,
  maxHeight = 480,
  className = '',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const result = await uploadImageAsset(file, storagePath, { maxWidth, maxHeight });
      onUploaded(result.url, result.source);
    } catch (err) {
      setError(err?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 text-xs font-serif transition-colors disabled:opacity-50'
        }
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span>{uploading ? 'Compressing…' : label}</span>
      </button>
      {error && <span className="text-[10px] font-mono text-red-400">{error}</span>}
    </div>
  );
}
