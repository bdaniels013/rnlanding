import React, { useState, useEffect } from 'react';

const SocialMediaGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/social-media/photos');
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Error fetching social media photos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Real View Counts & Analytics</h3>
          <div className="animate-pulse">
            <div className="bg-white/10 h-64 rounded-xl mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Real View Counts & Analytics</h3>
          <p className="text-red-400">Error loading photos: {error}</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Real View Counts & Analytics</h3>
          <p className="text-white/60">No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold mb-4">Real View Counts & Analytics</h3>
        
        {photos.length === 1 ? (
          // Single photo - display large
          <div className="max-w-4xl mx-auto">
            <img 
              src={photos[0].url} 
              alt={photos[0].altText || "Social Media Analytics"} 
              className="max-w-full h-auto rounded-xl mx-auto shadow-2xl"
            />
            {photos[0].altText && (
              <p className="text-white/60 text-sm mt-3">{photos[0].altText}</p>
            )}
          </div>
        ) : (
          // Multiple photos - display in grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img 
                  src={photo.url} 
                  alt={photo.altText || "Social Media Analytics"} 
                  className="w-full h-auto rounded-xl shadow-2xl"
                />
                {photo.altText && (
                  <p className="text-white/60 text-sm mt-3 text-left">{photo.altText}</p>
                )}
                <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {photo.platform.charAt(0).toUpperCase() + photo.platform.slice(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaGallery;
