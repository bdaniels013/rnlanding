import React, { useState, useEffect } from 'react';
import { DollarSign, Users, CreditCard, Calendar, TrendingUp, Package, AlertCircle, LogOut, User, Plus, Edit, Trash2, Search, Filter, X, Image } from 'lucide-react';
import CreditsManagement from './CreditsManagement';
import MediaManagement from './MediaManagement';

const AdminDashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [customerInfoCaptures, setCustomerInfoCaptures] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingOffer, setEditingOffer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [offerForm, setOfferForm] = useState({ 
    sku: '', 
    name: '', 
    priceCents: '', 
    isSubscription: false, 
    creditsValue: 0, 
    isCreditEligible: false,
    description: '',
    features: [],
    badge: '',
    isActive: true
  });

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
    const user = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !user) {
      onLogout(false);
      return;
    }
    
    setCurrentUser(user);
    fetchDashboardData();
    fetchCustomerInfoCaptures();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchCustomerInfoCaptures();
      if (activeTab === 'customers') fetchCustomers();
      if (activeTab === 'offers') fetchOffers();
    }, 30000);
    return () => clearInterval(interval);
  }, [onLogout]);

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'offers') {
      fetchOffers();
    }
  }, [activeTab, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    onLogout(false);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
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

  const fetchCustomerInfoCaptures = async () => {
    try {
      const response = await fetch('/api/admin/customer-info', {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer info captures');
      }
      
      const data = await response.json();
      setCustomerInfoCaptures(data);
    } catch (err) {
      console.error('Failed to fetch customer info captures:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      const response = await fetch(`/api/admin/customers?search=${searchTerm}`, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Customers response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Customers API error:', errorText);
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Customers data:', data);
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  const fetchOffers = async () => {
    try {
      console.log('Fetching offers...');
      const response = await fetch(`/api/admin/offers?search=${searchTerm}`, {
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Offers response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Offers API error:', errorText);
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Offers data:', data);
      setOffers(data.offers || []);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setOffers([]);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/admin/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const requestBody = editingCustomer 
        ? { id: editingCustomer.id, ...customerForm }
        : customerForm;
      
      const response = await fetch(url, {
        method,
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save customer');
      }
      
      setShowCustomerModal(false);
      setEditingCustomer(null);
      setCustomerForm({ name: '', email: '', phone: '', notes: '' });
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/admin/offers';
      const method = editingOffer ? 'PUT' : 'POST';
      
      const requestBody = editingOffer ? { id: editingOffer.id, ...offerForm } : offerForm;
      
      const response = await fetch(url, {
        method,
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save offer');
      }
      
      setShowOfferModal(false);
      setEditingOffer(null);
      setOfferForm({ 
        sku: '', 
        name: '', 
        priceCents: '', 
        isSubscription: false, 
        creditsValue: 0, 
        isCreditEligible: false,
        description: '',
        features: [],
        isActive: true
      });
      fetchOffers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const response = await fetch(`/api/admin/customers?id=${customerId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer');
      }
      
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      const response = await fetch(`/api/admin/offers?id=${offerId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-auth': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete offer');
      }
      
      fetchOffers();
    } catch (err) {
      alert(err.message);
    }
  };

  const openCustomerModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({ name: '', email: '', phone: '', notes: '' });
    }
    setShowCustomerModal(true);
  };

  const openOfferModal = (offer = null) => {
    console.log('Opening offer modal with offer:', offer);
    if (offer) {
      setEditingOffer(offer);
      setOfferForm({
        sku: offer.sku,
        name: offer.name,
        priceCents: offer.priceCents, // Keep as cents for internal storage
        isSubscription: offer.isSubscription,
        creditsValue: offer.creditsValue,
        isCreditEligible: offer.isCreditEligible,
        description: offer.description || '',
        features: offer.features || [],
        badge: offer.badge || '',
        isActive: offer.isActive
      });
    } else {
      setEditingOffer(null);
      setOfferForm({ 
        sku: '', 
        name: '', 
        priceCents: 0, // Start with 0 cents for new offers
        isSubscription: false, 
        creditsValue: 0, 
        isCreditEligible: false,
        description: '',
        features: [],
        badge: '',
        isActive: true
      });
    }
    setShowOfferModal(true);
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
      <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Rich Nick Admin Dashboard</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-4 h-4" />
              <span>Welcome, {currentUser}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <div className="text-xs sm:text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="mt-4 flex flex-wrap gap-1 bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center ${
              activeTab === 'dashboard'
                ? 'bg-gray-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center ${
              activeTab === 'customers'
                ? 'bg-gray-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center ${
              activeTab === 'offers'
                ? 'bg-gray-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <span className="hidden xs:inline">Offers & Services</span>
            <span className="xs:hidden">Offers</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center ${
              activeTab === 'media'
                ? 'bg-gray-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span>Media</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-1 sm:px-2">Order ID</th>
                  <th className="text-left py-2 px-1 sm:px-2 hidden sm:table-cell">Customer</th>
                  <th className="text-left py-2 px-1 sm:px-2">Items</th>
                  <th className="text-left py-2 px-1 sm:px-2">Total</th>
                  <th className="text-left py-2 px-1 sm:px-2">Status</th>
                  <th className="text-left py-2 px-1 sm:px-2 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_orders?.map(order => (
                  <tr key={order.id} className="border-b border-gray-700/50">
                    <td className="py-2 px-1 sm:px-2 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-2 px-1 sm:px-2 hidden sm:table-cell">
                      <div className="text-xs sm:text-sm">{order.customer_name}</div>
                      <div className="text-gray-400 text-xs">{order.customer_email}</div>
                    </td>
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{order.items}</td>
                    <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">${order.total}</td>
                    <td className="py-2 px-1 sm:px-2">
                      <span className={`px-1 sm:px-2 py-1 rounded text-xs ${
                        order.status === 'PAID' ? 'bg-green-600' :
                        order.status === 'CREATED' ? 'bg-yellow-600' :
                        order.status === 'REFUNDED' ? 'bg-red-600' :
                        'bg-gray-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-1 sm:px-2 text-gray-400 text-xs hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Info Captures */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Customer Info Captures</h2>
          <div className="text-xs sm:text-sm text-gray-400 mb-4">
            Customer information captured when they click "Continue to Review"
          </div>
          
          {customerInfoCaptures.length === 0 ? (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-300 text-xs sm:text-sm">
                No customer info captures yet. Try clicking "Continue to Review" on the checkout flow.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-1 sm:px-2">Name</th>
                    <th className="text-left py-2 px-1 sm:px-2 hidden sm:table-cell">Email</th>
                    <th className="text-left py-2 px-1 sm:px-2 hidden md:table-cell">Phone</th>
                    <th className="text-left py-2 px-1 sm:px-2">Offer</th>
                    <th className="text-left py-2 px-1 sm:px-2 hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInfoCaptures.map(capture => (
                    <tr key={capture.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                      <td className="py-2 px-1 sm:px-2 font-medium text-white text-xs sm:text-sm">{capture.name}</td>
                      <td className="py-2 px-1 sm:px-2 text-gray-300 text-xs sm:text-sm hidden sm:table-cell">{capture.email}</td>
                      <td className="py-2 px-1 sm:px-2 text-gray-300 text-xs sm:text-sm hidden md:table-cell">{capture.phone || 'N/A'}</td>
                      <td className="py-2 px-1 sm:px-2 text-gray-300 text-xs sm:text-sm">{capture.selectedOffer}</td>
                      <td className="py-2 px-1 sm:px-2 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(capture.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Credits Management */}
        <CreditsManagement />

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
          </>
        )}

        {/* Customer Management */}
        {activeTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onEdit={openCustomerModal}
            onDelete={handleDeleteCustomer}
            onAdd={() => openCustomerModal()}
          />
        )}

        {/* Offers Management */}
        {activeTab === 'offers' && (
          <OffersManagement
            offers={offers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onEdit={openOfferModal}
            onDelete={handleDeleteOffer}
            onAdd={() => openOfferModal()}
          />
        )}

        {/* Media Management */}
        {activeTab === 'media' && (
          <MediaManagement />
        )}
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <CustomerModal
          customer={editingCustomer}
          form={customerForm}
          setForm={setCustomerForm}
          onSubmit={handleCustomerSubmit}
          onClose={() => {
            setShowCustomerModal(false);
            setEditingCustomer(null);
            setCustomerForm({ name: '', email: '', phone: '', notes: '' });
          }}
        />
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <OfferModal
          offer={editingOffer}
          form={offerForm}
          setForm={setOfferForm}
          onSubmit={handleOfferSubmit}
          onClose={() => {
            setShowOfferModal(false);
            setEditingOffer(null);
            setOfferForm({ 
              sku: '', 
              name: '', 
              priceCents: '', 
              isSubscription: false, 
              creditsValue: 0, 
              isCreditEligible: false,
              description: '',
              features: [],
              isActive: true
            });
          }}
        />
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-gray-800 rounded-lg p-3 sm:p-6">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-gray-400 text-xs sm:text-sm truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-white truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
      </div>
      <div className={`${color} flex-shrink-0 ml-2`}>
        <div className="w-5 h-5 sm:w-6 sm:h-6">
          {icon}
        </div>
      </div>
    </div>
  </div>
);

// Customer Management Component
const CustomerManagement = ({ customers, searchTerm, setSearchTerm, onEdit, onDelete, onAdd }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 className="text-2xl font-bold">Customer Management</h2>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Customer
      </button>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {customers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">No customers found</div>
          <div className="text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer using the "Add Customer" button above'}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{customer.name}</div>
                    {customer.notes && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{customer.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{customer.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{customer.phone || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{customer.totalCredits || 0}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{customer.orders?.length || 0}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(customer)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(customer.id)}
                        className="text-red-400 hover:text-red-300"
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
  </div>
);

// Offers Management Component
const OffersManagement = ({ offers, searchTerm, setSearchTerm, onEdit, onDelete, onAdd }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 className="text-2xl font-bold">Offers & Services Management</h2>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Offer
      </button>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search offers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {offers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">No offers found</div>
          <div className="text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first offer using the "Add Offer" button above'}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sales</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{offer.name}</div>
                    {offer.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{offer.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{offer.sku}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">${(offer.priceCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {offer.isSubscription ? 'Subscription' : 'One-time'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {offer.isCreditEligible ? offer.creditsValue : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {offer.paidSales || 0} paid
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      offer.isActive ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(offer)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(offer.id)}
                        className="text-red-400 hover:text-red-300"
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
  </div>
);

// Customer Modal Component
const CustomerModal = ({ customer, form, setForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {customer ? 'Edit Customer' : 'Add Customer'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {customer ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);

// Offer Modal Component
const OfferModal = ({ offer, form, setForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {offer ? 'Edit Offer' : 'Add Offer'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">SKU *</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Price (USD) *</label>
            <input
              type="number"
              step="0.01"
              value={form.priceCents ? (form.priceCents / 100).toFixed(2) : ''}
              onChange={(e) => setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value || 0) * 100) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Enter price in dollars (e.g., 1000.00 for $1000.00)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Credits Value</label>
            <input
              type="number"
              value={form.creditsValue}
              onChange={(e) => setForm({ ...form, creditsValue: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Badge Text (Optional)</label>
          <input
            type="text"
            value={form.badge}
            onChange={(e) => setForm({ ...form, badge: e.target.value })}
            placeholder="e.g., Most Popular, Limited Time, Best Value"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Leave empty for no badge</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Features (one per line)</label>
          <textarea
            value={form.features ? form.features.join('\n') : ''}
            onChange={(e) => {
              const lines = e.target.value.split('\n');
              setForm({ ...form, features: lines });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const textarea = e.target;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                const newValue = value.substring(0, start) + '\n' + value.substring(end);
                
                // Update the form state
                setForm({ ...form, features: newValue.split('\n') });
                
                // Update the textarea value directly and set cursor position
                textarea.value = newValue;
                textarea.setSelectionRange(start + 1, start + 1);
              }
            }}
            rows={4}
            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Enter each feature on a new line. Press Enter to add new lines.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.isSubscription}
              onChange={(e) => setForm({ ...form, isSubscription: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">Subscription</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.isCreditEligible}
              onChange={(e) => setForm({ ...form, isCreditEligible: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">Credit Eligible</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">Active</span>
          </label>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {offer ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AdminDashboard;
