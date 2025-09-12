import React, { useState, useEffect } from 'react';

const MediaManagement = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [altText, setAltText] = useState('');

  const platforms = [
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-500', icon: '📘' },
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-500', icon: '📷' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-500', icon: '▶️' }
  ];

  const fetchPhotos = async (platform = null) => {
    try {
      setLoading(true);
      const url = platform ? `/api/admin/social-media/photos?platform=${platform}` : '/api/admin/social-media/photos';
      const response = await fetch(url, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      } else {
        console.error('Failed to fetch photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileChange = (e) => {
    setUploadFiles(e.target.files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      
      for (let i = 0; i < uploadFiles.length; i++) {
        formData.append('photos', uploadFiles[i]);
      }
      formData.append('platform', selectedPlatform);
      formData.append('altText', altText);

      const response = await fetch('/api/admin/social-media/photos/upload', {
        method: 'POST',
        headers: {
          'x-admin-auth': 'true'
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Photos uploaded:', data.photos);
        setShowUploadModal(false);
        setUploadFiles(null);
        setAltText('');
        fetchPhotos();
      } else {
        const error = await response.json();
        alert('Upload failed: ' + error.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/admin/social-media/photos?id=${photoId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-auth': 'true'
        }
      });

      if (response.ok) {
        fetchPhotos();
      } else {
        alert('Failed to delete photo');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete photo');
    }
  };

  const handleToggleActive = async (photo) => {
    try {
      const response = await fetch('/api/admin/social-media/photos', {
        method: 'PUT',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: photo.id,
          platform: photo.platform,
          filename: photo.filename,
          originalName: photo.originalName,
          url: photo.url,
          altText: photo.altText,
          order: photo.order,
          isActive: !photo.isActive
        })
      });

      if (response.ok) {
        fetchPhotos();
      } else {
        alert('Failed to update photo');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update photo');
    }
  };

  const filteredPhotos = selectedPlatform === 'all' 
    ? photos 
    : photos.filter(photo => photo.platform === selectedPlatform);

  const groupedPhotos = platforms.reduce((acc, platform) => {
    acc[platform.id] = photos.filter(photo => photo.platform === platform.id);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Media Management</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📤</span>
          Upload Photos
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPlatform === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Platforms
        </button>
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              selectedPlatform === platform.id
                ? `${platform.color} text-white`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>{platform.icon}</span>
            {platform.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {platforms.map(platform => {
          const count = groupedPhotos[platform.id]?.length || 0;
          const activeCount = groupedPhotos[platform.id]?.filter(p => p.isActive).length || 0;
          return (
            <div key={platform.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{platform.icon}</span>
                <h3 className="font-semibold text-white">{platform.name}</h3>
              </div>
              <div className="text-sm text-gray-400">
                <div>Total: {count}</div>
                <div>Active: {activeCount}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading photos...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-white mb-2">No photos found</h3>
          <p className="text-gray-400 mb-4">
            {selectedPlatform === 'all' 
              ? 'Upload some photos to get started'
              : `No ${platforms.find(p => p.id === selectedPlatform)?.name} photos yet`
            }
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Upload Photos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map(photo => (
            <div key={photo.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="relative">
                <img
                  src={photo.url}
                  alt={photo.altText || photo.originalName}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleToggleActive(photo)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      photo.isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {photo.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {platforms.find(p => p.id === photo.platform)?.icon} {photo.platform}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-white truncate mb-1">
                  {photo.originalName}
                </h4>
                {photo.altText && (
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {photo.altText}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Upload Photos</h3>
            
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {platforms.map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.icon} {platform.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photos (Multiple files allowed)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Alt Text (Optional)
                </label>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the photos for accessibility..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFiles || uploading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    'Upload Photos'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManagement;
