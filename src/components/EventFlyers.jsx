import React, { useEffect, useState } from 'react';

const allowedPlatforms = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' }
];

const EventFlyers = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState(null);
  const [altText, setAltText] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/event-flyers');
      if (!res.ok) throw new Error('Failed to load flyers');
      const data = await res.json();
      setPhotos(data.flyers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const onUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const form = new FormData();
      for (let i = 0; i < files.length; i++) {
        form.append('photos', files[i]);
      }
      form.append('platform', platform);
      form.append('altText', altText);
      const res = await fetch('/api/admin/event-flyers/upload', {
        method: 'POST',
        headers: { 'x-admin-auth': 'true' },
        body: form
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      setShowUpload(false);
      setFiles(null);
      setAltText('');
      await fetchPhotos();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="py-16 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Upcoming Event Flyers</h2>
            <p className="text-white/80 mt-2">Upload and showcase graphics for upcoming events.</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:brightness-110"
          >
            Upload Flyers
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <div className="text-white/70 mt-3">Loading flyers...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400">{error}</div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white/70">No flyers yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((p) => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="relative">
                  <img src={p.imageData || p.url} alt={p.altText || p.originalName} className="w-full h-64 object-cover" />
                  {p.platform && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold truncate">{p.originalName}</div>
                  {p.altText && <div className="text-white/70 text-sm mt-1 line-clamp-2">{p.altText}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {showUpload && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Upload Event Flyers</h3>
              <form onSubmit={onUpload}>
                <div className="mb-4">
                  <label className="block text-sm mb-2">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    {allowedPlatforms.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-2">Flyer Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm mb-2">Event Details</label>
                  <textarea
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    rows={3}
                    placeholder="Date, location, headliners, notes"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !files}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventFlyers;
