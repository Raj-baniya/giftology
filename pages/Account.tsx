import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/ui/Icons';
import { motion } from 'framer-motion';
import { store } from '../services/store';
import { Order } from '../types';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-lg transition-all flex-shrink-0 whitespace-nowrap text-sm md:text-base ${active ? 'bg-primary/20 text-black font-bold border border-primary/20' : 'text-textMuted hover:bg-gray-100 border border-transparent'
      } ${window.innerWidth < 768 ? 'w-auto' : 'w-full text-left'}`}
  >
    <Icon className="w-4 h-4 md:w-5 md:h-5" />
    {label}
  </button>
);

const ChangePasswordForm = () => {
  const { changePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await changePassword(password);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <div className="relative">
          <Icons.Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="••••••••"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <div className="relative">
          <Icons.Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="••••••••"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-70"
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
};

export const Account = () => {
  const { user, updateProfile, loading, logout } = useAuth();
  const { alertState, showAlert, closeAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const [userOrders, userAddresses] = await Promise.all([
            store.getOrders(user.id),
            store.getUserAddresses(user.id)
          ]);
          setOrders(userOrders);
          setAddresses(userAddresses);
        } catch (error) {
          console.error("Failed to fetch data", error);
        } finally {
          setOrdersLoading(false);
        }
      }
    };

    if (!loading && user) {
      fetchData();
    }
  }, [user, loading]);

  const handleDeleteAddress = async (index: number) => {
    showAlert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      'warning',
      {
        confirmText: 'Delete',
        onConfirm: async () => {
          try {
            const updated = await store.deleteUserAddress(user!.id, index);
            setAddresses(updated);
            showAlert('Success', 'Address deleted successfully.', 'success');
          } catch (error) {
            console.error('Failed to delete address', error);
            showAlert('Error', 'Failed to delete address.', 'error');
          }
        },
        cancelText: 'Cancel'
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const handleUpdateName = async () => {
    if (newName.trim()) {
      await updateProfile(newName);
      setIsEditing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/30 rounded-full flex items-center justify-center text-2xl md:text-3xl font-serif text-primary-dark flex-shrink-0">
            {user.displayName.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              {isEditing ? (
                <div className="flex gap-2 items-center justify-center md:justify-start">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="border rounded px-2 py-1 text-sm bg-white text-gray-900 focus:outline-none focus:border-primary"
                    placeholder={user.displayName}
                  />
                  <button onClick={handleUpdateName} className="text-green-600"><Icons.CheckCircle className="w-5 h-5" /></button>
                  <button onClick={() => setIsEditing(false)} className="text-red-400"><Icons.X className="w-5 h-5" /></button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold">{user.displayName}</h1>
                  <button onClick={() => { setNewName(user.displayName); setIsEditing(true); }} className="text-textMuted hover:text-primary">
                    <Icons.Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-textMuted mb-3 text-sm">{user.email}</p>
            <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-textMuted uppercase tracking-wide">
              <Icons.User className="w-3 h-3" />
              Member since {new Date(user.joinDate).getFullYear()}
            </div>
          </div>
          <button
            onClick={() => {
              showAlert(
                'Sign Out',
                'Are you sure you want to sign out?',
                'warning',
                {
                  confirmText: 'Sign Out',
                  onConfirm: () => {
                    // Wrap in setTimeout to ensure alert closes before component unmounts
                    setTimeout(() => logout(), 0);
                  },
                  cancelText: 'Cancel'
                }
              );
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors self-start"
          >
            <Icons.LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-4 gap-6">
          {/* Scrollable Tabs for Mobile */}
          <div className="bg-white rounded-xl shadow-sm p-2 md:p-4 flex md:flex-col overflow-x-auto gap-2 md:gap-1 scrollbar-hide sticky top-20 z-20 md:static md:h-fit">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Icons.Package} label="Overview" />
            <TabButton active={activeTab === 'addresses'} onClick={() => setActiveTab('addresses')} icon={Icons.MapPin} label="Addresses" />
            <TabButton active={activeTab === 'spending'} onClick={() => setActiveTab('spending')} icon={Icons.Wallet} label="Spending" />
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Icons.Shield} label="Security" />
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'overview' ? (
              <>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
                  <h3 className="font-serif text-lg md:text-xl font-bold mb-4">Your Orders</h3>
                  {ordersLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-100 rounded-lg overflow-hidden transition-all hover:shadow-md bg-white">
                          <div
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-md shrink-0 flex items-center justify-center text-gray-400">
                                {expandedOrderId === order.id ? <Icons.ChevronDown /> : <Icons.Package />}
                              </div>
                              <div className="flex-1 sm:hidden">
                                <h4 className="font-bold text-sm">Order #{order.id}</h4>
                                <span className="font-bold text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex-1 hidden sm:block">
                              <h4 className="font-bold">Order #{order.id}</h4>
                              <p className="text-sm text-textMuted">Placed on {new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex justify-between items-center w-full sm:w-auto gap-3">
                              <span className={`px-2 py-1 text-[10px] md:text-xs font-bold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <span className="font-bold text-sm hidden sm:block" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</span>

                              {/* Cancel Button for User */}
                              {order.status === 'processing' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showAlert(
                                      'Cancel Order',
                                      'Are you sure you want to cancel this order?',
                                      'warning',
                                      {
                                        confirmText: 'Yes, Cancel Order',
                                        onConfirm: async () => {
                                          try {
                                            await store.updateOrderStatus(order.id, 'cancelled');
                                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
                                            showAlert('Success', 'Order cancelled successfully.', 'success');
                                          } catch (err) {
                                            console.error(err);
                                            showAlert('Error', 'Failed to cancel order.', 'error');
                                          }
                                        },
                                        cancelText: 'Keep Order'
                                      }
                                    );
                                  }}
                                  className="px-3 py-1 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedOrderId === order.id && (
                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                              <h5 className="font-bold text-sm mb-3 text-gray-700">Order Items</h5>
                              <div className="space-y-3">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-white w-6 h-6 flex items-center justify-center rounded border text-xs font-bold">{item.quantity}x</span>
                                      <span className="text-gray-800">{item.name}</span>
                                    </div>
                                    <span className="font-medium" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{(item.price * item.quantity).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                                <span className="text-gray-500">Delivery Type</span>
                                <span className="font-bold text-gray-900">{order.deliveryType || 'Standard Delivery'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <Icons.ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No orders yet. Start shopping!</p>
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'spending' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary">
                    <p className="text-sm text-textMuted mb-1">Total Spent</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-sm text-textMuted mb-1">Total Orders</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-sm text-textMuted mb-1">Average Order</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toLocaleString() : 0}</p>
                  </div>
                </div>

                {/* Recent Spending */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-serif text-xl font-bold mb-4">Spending History</h3>
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-xs text-textMuted">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          <p className="font-bold text-lg" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <Icons.Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No spending data yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'addresses' ? (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-serif text-xl font-bold mb-6">Saved Addresses</h3>
                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative hover:border-primary transition-colors">
                        <button
                          onClick={() => handleDeleteAddress(index)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-3">
                          <Icons.MapPin className="w-5 h-5 text-primary mt-1" />
                          <div>
                            <p className="font-bold text-gray-900">{addr.firstName} {addr.lastName}</p>
                            <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.zipCode}</p>
                            <p className="text-sm text-gray-600 mt-1">{addr.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Icons.MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No saved addresses found.</p>
                    <p className="text-sm">Addresses used during checkout will be saved here.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'security' ? (
              <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg">
                <h3 className="font-serif text-xl font-bold mb-6">Security Settings</h3>
                <ChangePasswordForm />
              </div>
            ) : null}
          </div>
        </div>

        {/* Custom Alert */}
        <CustomAlert
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          confirmText={alertState.confirmText}
          onConfirm={alertState.onConfirm}
          cancelText={alertState.cancelText}
        />
      </div>
    </div >
  );
};