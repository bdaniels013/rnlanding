import React, { useState, useEffect } from 'react';
import { Plus, Minus, Users, CreditCard, History, Search, Filter } from 'lucide-react';
import CreditsHistory from './CreditsHistory';

export default function CreditsManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers', {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedCustomer || !creditsAmount || !reason) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/credits/add', {
        method: 'POST',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: parseInt(creditsAmount),
          reason: reason,
          type: 'MANUAL_ADD'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add credits');
      }
      
      // Refresh customers list
      await fetchCustomers();
      setShowAddModal(false);
      setCreditsAmount('');
      setReason('');
      setSelectedCustomer(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeductCredits = async () => {
    if (!selectedCustomer || !creditsAmount || !reason) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/credits/deduct', {
        method: 'POST',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: parseInt(creditsAmount),
          reason: reason,
          type: 'MANUAL_DEDUCT'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to deduct credits');
      }
      
      // Refresh customers list
      await fetchCustomers();
      setShowDeductModal(false);
      setCreditsAmount('');
      setReason('');
      setSelectedCustomer(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-white text-center">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Credits Management
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-2">Customer</th>
              <th className="text-left py-3 px-2">Email</th>
              <th className="text-left py-3 px-2">Phone</th>
              <th className="text-left py-3 px-2">Credits</th>
              <th className="text-left py-3 px-2">Last Updated</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                <td className="py-3 px-2">
                  <div className="font-medium text-white">{customer.name || 'N/A'}</div>
                </td>
                <td className="py-3 px-2 text-gray-300">{customer.email}</td>
                <td className="py-3 px-2 text-gray-300">{customer.phone || 'N/A'}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    customer.credits > 0 ? 'bg-green-600 text-white' : 
                    customer.credits === 0 ? 'bg-gray-600 text-white' : 
                    'bg-red-600 text-white'
                  }`}>
                    {customer.credits || 0}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-400">
                  {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowDeductModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                      Deduct
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowHistoryModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                    >
                      <History className="w-3 h-3" />
                      History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Credits - {selectedCustomer?.name || selectedCustomer?.email}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credits to Add
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter number of credits"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Reason for adding credits (e.g., Manual payment processed, Event attendance, etc.)"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleAddCredits}
                disabled={isProcessing || !creditsAmount || !reason}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {isProcessing ? 'Adding...' : 'Add Credits'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCreditsAmount('');
                  setReason('');
                  setSelectedCustomer(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deduct Credits Modal */}
      {showDeductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Deduct Credits - {selectedCustomer?.name || selectedCustomer?.email}
            </h3>
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Current Credits: <span className="font-bold">{selectedCustomer?.credits || 0}</span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credits to Deduct
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer?.credits || 0}
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter number of credits"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Reason for deducting credits (e.g., Event booking, Platform feature, etc.)"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleDeductCredits}
                disabled={isProcessing || !creditsAmount || !reason || parseInt(creditsAmount) > (selectedCustomer?.credits || 0)}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {isProcessing ? 'Deducting...' : 'Deduct Credits'}
              </button>
              <button
                onClick={() => {
                  setShowDeductModal(false);
                  setCreditsAmount('');
                  setReason('');
                  setSelectedCustomer(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits History Modal */}
      {showHistoryModal && selectedCustomer && (
        <CreditsHistory
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name || selectedCustomer.email}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}
