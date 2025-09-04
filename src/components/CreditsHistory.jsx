import React, { useState, useEffect } from 'react';
import { History, Plus, Minus, Calendar, User, FileText } from 'lucide-react';

export default function CreditsHistory({ customerId, customerName, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customerId) {
      fetchCreditsHistory();
    }
  }, [customerId]);

  const fetchCreditsHistory = async () => {
    try {
      const response = await fetch(`/api/admin/credits/history/${customerId}`, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch credits history');
      }
      
      const data = await response.json();
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'MANUAL_ADD':
      case 'PAYMENT_CREDITS':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'MANUAL_DEDUCT':
      case 'EVENT_BOOKING':
      case 'PLATFORM_FEATURE':
        return <Minus className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'MANUAL_ADD':
      case 'PAYMENT_CREDITS':
        return 'text-green-400';
      case 'MANUAL_DEDUCT':
      case 'EVENT_BOOKING':
      case 'PLATFORM_FEATURE':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="text-white text-center">Loading credits history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Credits History - {customerName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="overflow-y-auto max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No credits history found for this customer.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((transaction, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-medium text-white">
                          {transaction.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-400">
                          {transaction.reason}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.delta > 0 ? '+' : ''}{transaction.delta}
                      </div>
                      <div className="text-sm text-gray-400">
                        Balance: {transaction.balance_after}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {transaction.admin_user || 'System'}
                    </div>
                    {transaction.ref_order_id && (
                      <div className="text-blue-400">
                        Order: {transaction.ref_order_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
