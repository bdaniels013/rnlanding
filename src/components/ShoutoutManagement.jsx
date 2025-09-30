import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Search, Filter, Eye, Edit, Trash2, Plus } from 'lucide-react';

const ShoutoutManagement = ({ searchTerm, setSearchTerm, onEdit, onDelete, onAdd }) => {
  const [shoutouts, setShoutouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  useEffect(() => {
    fetchShoutouts();
  }, [searchTerm, filter]);

  const fetchShoutouts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/shoutouts?search=${searchTerm}&filter=${filter}`, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch shoutouts');
      }
      
      const data = await response.json();
      setShoutouts(data.shoutouts || []);
    } catch (err) {
      console.error('Failed to fetch shoutouts:', err);
      setShoutouts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shoutoutId, newStatus) => {
    try {
      const response = await fetch('/api/admin/shoutouts/status', {
        method: 'PUT',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: shoutoutId,
          status: newStatus,
          postedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update shoutout status');
      }
      
      // Refresh the list
      fetchShoutouts();
    } catch (err) {
      alert('Failed to update shoutout status: ' + err.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-600 text-yellow-100';
      case 'COMPLETED':
        return 'bg-green-600 text-green-100';
      case 'CANCELLED':
        return 'bg-red-600 text-red-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '📷';
      case 'facebook':
        return '👥';
      default:
        return '📱';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white text-lg">Loading shoutouts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Shoutout Management</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Shoutout
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search shoutouts..."
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

      {/* Shoutouts Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {shoutouts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">No shoutouts found</div>
            <div className="text-sm text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search terms or filters' 
                : 'Shoutouts will appear here when customers purchase shoutout services'
              }
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {shoutouts.map((shoutout) => (
                  <tr key={shoutout.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{shoutout.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{shoutout.customer?.email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformIcon(shoutout.platform)}</span>
                        <span className="text-sm text-gray-300 capitalize">{shoutout.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">@{shoutout.username}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(shoutout.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(shoutout.status)}`}>
                          {shoutout.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {shoutout.order ? `#${shoutout.order.id.slice(0, 8)}...` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(shoutout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {shoutout.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusUpdate(shoutout.id, 'COMPLETED')}
                            className="text-green-400 hover:text-green-300"
                            title="Mark as completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {shoutout.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusUpdate(shoutout.id, 'CANCELLED')}
                            className="text-red-400 hover:text-red-300"
                            title="Cancel shoutout"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(shoutout)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit shoutout"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(shoutout.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete shoutout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {shoutouts.filter(s => s.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Completed</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {shoutouts.filter(s => s.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-300">Cancelled</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {shoutouts.filter(s => s.status === 'CANCELLED').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoutoutManagement;
