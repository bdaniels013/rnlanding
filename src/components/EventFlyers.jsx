import React, { useEffect, useState } from 'react';

const EventFlyers = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <section className="py-16 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Upcoming Event Flyers</h2>
          </div>
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
          <div className="flex flex-wrap justify-center gap-6">
            {photos.map((p) => (
              <div key={p.id} className="relative max-w-2xl w-full">
                <img
                  src={p.imageData || p.url}
                  alt={p.altText || ''}
                  className="w-full h-auto object-contain rounded-xl mx-auto"
                />
                {p.platform && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


        </div>
    </section>
  );
};

export default EventFlyers;
