import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';

const LiveReviewManagement = ({ searchTerm, setSearchTerm }) => {
  const [liveReviews, setLiveReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  useEffect(() => {
    fetchLiveReviews();
  }, [searchTerm, filter]);

  const fetchLiveReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/live-reviews?search=${encodeURIComponent(searchTerm)}&filter=${encodeURIComponent(filter)}`, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch live reviews');
      const data = await response.json();
      setLiveReviews(data.liveReviews || []);
    } catch (err) {
      console.error('Failed to fetch live reviews:', err);
      setLiveReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch('/api/admin/live-reviews/status', {
        method: 'PUT',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          status: newStatus,
          fulfilledAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
        })
      });

      if (!response.ok) throw new Error('Failed to update live review status');
      fetchLiveReviews();
    } catch (err) {
      alert('Failed to update live review status: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white text-lg">Loading live reviews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Live Reviews</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search live reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Live Reviews Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {liveReviews.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">No live reviews found</div>
            <div className="text-sm text-gray-500">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Live reviews will appear here after purchases on the Live Review page'
              }
            </div>
          </div>
        ) : (
          <>
            <div className="sm:hidden space-y-3 p-3">
              {liveReviews.map(lr => (
                <div key={lr.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="text-white font-semibold text-sm">{lr.customer?.name || 'N/A'}</div>
                  <div className="text-gray-300 text-xs">{lr.customer?.email || 'N/A'}</div>
                  <div className="text-gray-300 text-xs">{lr.customer?.phone || 'N/A'}</div>
                  <div className="text-gray-300 text-xs">{lr.songName}</div>
                  <div className="text-gray-400 text-xs">{new Date(lr.createdAt).toLocaleString()}</div>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      lr.status === 'PENDING' ? 'bg-yellow-600' :
                      lr.status === 'COMPLETED' ? 'bg-green-600' :
                      'bg-red-600'
                    }`}>
                      {lr.status}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(lr.id, 'PENDING')}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                        title="Mark pending"
                      >
                        Queue
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(lr.id, 'COMPLETED')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                        title="Mark completed"
                      >
                        Fulfill
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(lr.id, 'CANCELLED')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Song Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {liveReviews.map(lr => (
                    <tr key={lr.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="text-white text-sm">{lr.customer?.name || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{lr.customer?.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{lr.customer?.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-white text-sm">{lr.songName}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{new Date(lr.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          lr.status === 'PENDING' ? 'bg-yellow-600' :
                          lr.status === 'COMPLETED' ? 'bg-green-600' :
                          'bg-red-600'
                        }`}>
                          {lr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(lr.id, 'PENDING')}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                            title="Mark pending"
                          >
                            Queue
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(lr.id, 'COMPLETED')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                            title="Mark completed"
                          >
                            Fulfill
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(lr.id, 'CANCELLED')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-300">Pending</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {liveReviews.filter(s => s.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Completed</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {liveReviews.filter(s => s.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-300">Cancelled</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {liveReviews.filter(s => s.status === 'CANCELLED').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveReviewManagement;
