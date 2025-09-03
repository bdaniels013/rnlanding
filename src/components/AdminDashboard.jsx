import React, { useState, useEffect } from 'react';
import { DollarSign, Users, CreditCard, Calendar, TrendingUp, Package, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rich Nick Admin Dashboard</h1>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Revenue Today"
            value={`$${dashboardData.revenue_today?.toLocaleString() || '0'}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="text-green-400"
          />
          <MetricCard
            title="Orders Today"
            value={dashboardData.orders_today || 0}
            icon={<Package className="w-6 h-6" />}
            color="text-blue-400"
          />
          <MetricCard
            title="Total Customers"
            value={dashboardData.total_customers || 0}
            icon={<Users className="w-6 h-6" />}
            color="text-purple-400"
          />
          <MetricCard
            title="Credits Outstanding"
            value={dashboardData.credits_outstanding || 0}
            icon={<CreditCard className="w-6 h-6" />}
            color="text-yellow-400"
          />
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="MRR"
            value={`$${dashboardData.mrr?.toLocaleString() || '0'}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="text-green-400"
            subtitle="Monthly Recurring Revenue"
          />
          <MetricCard
            title="ARR"
            value={`$${dashboardData.arr?.toLocaleString() || '0'}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="text-green-400"
            subtitle="Annual Recurring Revenue"
          />
          <MetricCard
            title="Active Subscriptions"
            value={dashboardData.active_subscriptions || 0}
            icon={<Calendar className="w-6 h-6" />}
            color="text-orange-400"
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Order ID</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Items</th>
                  <th className="text-left py-2">Total</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_orders?.map(order => (
                  <tr key={order.id} className="border-b border-gray-700/50">
                    <td className="py-2 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-2">
                      <div>{order.customer_name}</div>
                      <div className="text-gray-400 text-xs">{order.customer_email}</div>
                    </td>
                    <td className="py-2">{order.items}</td>
                    <td className="py-2">${order.total}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'PAID' ? 'bg-green-600' :
                        order.status === 'CREATED' ? 'bg-yellow-600' :
                        order.status === 'REFUNDED' ? 'bg-red-600' :
                        'bg-gray-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Platform Slots */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Platform Slots</h2>
          <div className="space-y-3">
            {dashboardData.upcoming_platform_slots?.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div>
                  <div className="font-medium">{slot.name}</div>
                  <div className="text-sm text-gray-400">{slot.partner}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{new Date(slot.slotAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400">{new Date(slot.slotAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-gray-800 rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={color}>
        {icon}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
