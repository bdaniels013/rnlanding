import React, { useEffect, useState } from 'react';

const platformOptions = [
  { id: 'all', name: 'All' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' }
];

const EventFlyersManagement = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [reordering, setReordering] = useState(false);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/event-flyers', { headers: { 'x-admin-auth': 'true' } });
      const data = await res.json();
      setPhotos(Array.isArray(data.flyers) ? data.flyers : []);
    } catch (e) {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, []);

  const filtered = selectedPlatform === 'all'
    ? photos
    : photos.filter(p => p.platform === selectedPlatform);

  const handleDelete = async (id) => {
    if (!confirm('Delete this flyer?')) return;
    try {
      const res = await fetch(`/api/admin/event-flyers?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-auth': 'true' }
      });
      if (res.ok) fetchPhotos();
    } catch {}
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;
    try {
      setUploading(true);
      const form = new FormData();
      for (let i = 0; i < uploadFiles.length; i++) form.append('photos', uploadFiles[i]);
      form.append('altText', altText);
      const res = await fetch('/api/admin/event-flyers/upload', {
        method: 'POST',
        headers: { 'x-admin-auth': 'true' },
        body: form
      });
      if (res.ok) {
        setShowUploadModal(false);
        setUploadFiles(null);
        setAltText('');
        fetchPhotos();
      }
    } finally {
      setUploading(false);
    }
  };

  const onDragStart = (id) => setDraggingId(id);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    const list = [...filtered];
    const draggingIndex = list.findIndex(p => p.id === draggingId);
    const targetIndex = list.findIndex(p => p.id === targetId);
    if (draggingIndex === -1 || targetIndex === -1) return;
    const [moved] = list.splice(draggingIndex, 1);
    list.splice(targetIndex, 0, moved);
    const newOrderIds = list.map(p => p.id);
    try {
      setReordering(true);
      await fetch('/api/admin/event-flyers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-auth': 'true' },
        body: JSON.stringify({ flyerIds: newOrderIds })
      });
      fetchPhotos();
    } finally {
      setReordering(false);
      setDraggingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Event Flyers</h2>
        <div className="flex gap-2">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            {platformOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Upload Flyers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading flyers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-white/70">No flyers found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(photo => (
            <div
              key={photo.id}
              className={`bg-gray-800 rounded-lg overflow-hidden ${draggingId === photo.id ? 'ring-2 ring-purple-500' : ''}`}
              draggable
              onDragStart={() => onDragStart(photo.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(photo.id)}
            >
              <div className="relative">
                <img src={photo.imageData || photo.url} alt={photo.altText || photo.originalName} className="w-full h-40 sm:h-48 object-cover" />
                <div className="absolute top-2 left-2">
                  <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {photo.platform}
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="font-medium text-white truncate mb-1 text-sm sm:text-base">{photo.originalName}</div>
                {photo.altText && (
                  <div className="text-xs sm:text-sm text-gray-400 mb-2 line-clamp-2">{photo.altText}</div>
                )}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500">{new Date(photo.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="text-red-400 hover:text-red-300 text-xs sm:text-sm px-2 py-1 rounded hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-lg sm:text-xl font-bold text-white mb-4">Upload Event Flyers</div>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Details</label>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  rows="3"
                  placeholder="Event details"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Cancel</button>
                <button type="submit" disabled={!uploadFiles || uploading} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg">
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reordering && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg">Saving order…</div>
      )}
    </div>
  );
};

export default EventFlyersManagement;
