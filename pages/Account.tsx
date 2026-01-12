import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/ui/Icons';
import { motion } from 'framer-motion';
import { store } from '../services/store';
import { supabase } from '../services/supabaseClient';
import { Order } from '../types';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center md:justify-start gap-4 px-6 py-4 rounded-full transition-all flex-shrink-0 whitespace-nowrap text-xs md:text-sm font-black uppercase tracking-[0.2em] ${active
      ? 'bg-white text-[#E60000] shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white relative z-10'
      : 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
      } ${window.innerWidth < 768 ? 'w-auto' : 'w-full text-left'}`}
  >
    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'text-[#E60000]' : 'text-gray-400 group-hover:text-white'}`} />
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
        <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">New Password</label>
        <div className="relative">
          <Icons.Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-700 font-bold"
            placeholder="••••••••"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Confirm Password</label>
        <div className="relative">
          <Icons.Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-700 font-bold"
            placeholder="••••••••"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#E60000] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#ff0000] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(230,0,0,0.2)]"
      >
        {loading ? 'Changing...' : 'Update Password'}
      </button>
    </form>
  );
};

// Rewards Tab Component
const RewardsTab = ({ showAlert }: any) => {
  const { user, profile } = useAuth();
  const [points, setPoints] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: userCoupons } = await supabase
          .from('user_coupons')
          .select('*, coupon:coupons(*)')
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false });
        setCoupons(userCoupons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setPoints(profile.reward_points || 0);
    }
  }, [profile]);

  const handleRedeem = async () => {
    if (!couponCode || couponCode.length !== 6) {
      showAlert('Invalid Code', 'Please enter a valid 6-digit coupon code.', 'error');
      return;
    }

    setRedeeming(true);
    try {
      // 1. Check if coupon exists
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        throw new Error('Invalid or expired coupon code.');
      }

      // 2. Add to user wallet
      const { error: redeemError } = await supabase
        .from('user_coupons')
        .insert([{
          user_id: user.id,
          coupon_code: coupon.code,
          valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 days
        }]);

      if (redeemError) {
        if (redeemError.code === '23505') throw new Error('You have already redeemed this coupon.');
        throw redeemError;
      }

      showAlert('Success!', `Coupon for ${coupon.discount_percent}% OFF added to your wallet!`, 'success');
      setCouponCode('');
      // Refresh list
      const { data: updatedCoupons } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });
      setCoupons(updatedCoupons || []);

    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to redeem coupon.', 'error');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full text-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-600 p-6 rounded-2xl shadow-2xl text-black border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-black/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
            <Icons.Star className="w-8 h-8 fill-black" />
          </div>
          <div>
            <p className="font-black text-[10px] uppercase tracking-[0.2em] mb-1 opacity-70">Reward Points</p>
            <h2 className="text-4xl font-black">{points} <span className="text-sm uppercase tracking-widest opacity-70">Points</span></h2>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 bg-black/10 px-2 py-0.5 rounded-full inline-block">Cash Value: &#8377;{points / 10}</p>
          </div>
        </div>
      </div>

      {/* Redeem Coupon */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
        <h3 className="font-black text-xs text-white mb-4 uppercase tracking-[0.2em]">Redeem Coupon</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="ENTER 6-DIGIT CODE"
            className="flex-1 bg-white/5 border-2 border-white/10 rounded-xl px-4 py-4 font-mono uppercase text-white focus:border-[#E60000] focus:outline-none transition-all placeholder:text-gray-700 font-black tracking-widest"
            maxLength={6}
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="w-full sm:w-auto bg-[#E60000] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#ff0000] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(230,0,0,0.2)]"
          >
            {redeeming ? 'Checking...' : 'Redeem Now'}
          </button>
        </div>
      </div>

      {/* My Coupons */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
        <h3 className="font-black text-xs text-white mb-4 uppercase tracking-[0.2em]">My Wallet</h3>
        {coupons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
            <Icons.Tag className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Wallet is currently empty</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {coupons.map((uc) => (
              <div key={uc.id} className={`relative p-5 rounded-2xl border-2 transition-all group ${uc.status === 'active' ? 'border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10' : 'border-white/5 bg-white/5 grayscale opacity-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${uc.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                      {uc.status === 'active' ? 'ACTIVE' : 'EXPIRED'}
                    </span>
                    <h4 className="text-3xl font-black text-white mb-1">{uc.coupon.discount_percent}% OFF</h4>
                    <p className="font-mono text-xs text-gray-400 tracking-widest uppercase">CODE: {uc.coupon_code}</p>
                  </div>
                  <Icons.Tag className={`w-10 h-10 ${uc.status === 'active' ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-gray-700'}`} />
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 flex justify-between items-center">
                  <span>EXP: {new Date(uc.valid_until).toLocaleDateString()}</span>
                  {uc.status === 'active' && <span className="text-green-500">READY TO USE</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Account = () => {
  const { user, profile, updateProfile, loading, logout } = useAuth();
  const { alertState, showAlert, closeAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

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

      // Realtime Subscription for Profile Changes (Points/Addresses)
      const profileSubscription = supabase
        .channel('public:profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            console.log('Profile updated realtime:', payload);
            fetchData(); // Refresh data on any profile change
          }
        )
        .subscribe();

      // Realtime Subscription for Orders
      const ordersSubscription = supabase
        .channel('public:orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          (payload) => {
            console.log('Order updated realtime:', payload);
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileSubscription);
        supabase.removeChannel(ordersSubscription);
      };
    }
  }, [user, loading]);

  // --- Guest Prompt (If not logged in) ---
  if (!loading && !user) {
    return (
      <div className="bg-transparent flex items-start justify-center p-4 pt-4 md:pt-12 pb-4">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 max-w-md w-full text-center space-y-3 border border-white/10 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#E60000]/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#E60000]/20 transition-all duration-700"></div>

          <div className="w-16 h-16 bg-[#E60000]/10 border border-[#E60000]/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(230,0,0,0.1)]">
            <Icons.User className="w-8 h-8 text-[#E60000]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-0.5 uppercase tracking-widest">Member Access</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] italic mb-2">
              Login to access your rewards and orders
            </p>
            <div className="w-full bg-[#E60000]/5 border border-[#E60000]/20 rounded-[2rem] p-6 md:p-8 text-white shadow-[0_0_40px_rgba(230,0,0,0.1)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#E60000]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-[#E60000] font-black uppercase tracking-[0.2em] text-xs md:text-sm animate-pulse">
                  🚀 Signup Bonus
                </div>
                <div className="text-center font-bold text-gray-400 text-[10px] md:text-xs uppercase tracking-widest leading-relaxed">
                  Join the ranks today<br />and receive
                </div>
                <div className="text-[#E60000] text-2xl md:text-4xl font-black uppercase tracking-tighter drop-shadow-[0_0_25px_rgba(230,0,0,0.4)] my-0">
                  500 Points
                </div>
                <div className="text-center font-black text-white text-[10px] md:text-xs uppercase tracking-[0.3em]">
                  Instantly!
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-0">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-[#E60000] text-white py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#ff0000] transition-all shadow-[0_0_30px_rgba(230,0,0,0.3)] hover:shadow-[0_0_40px_rgba(230,0,0,0.5)] active:scale-95"
            >
              Login Now
            </button>
            <button
              onClick={() => window.location.href = '/login?mode=signup'}
              className="w-full bg-white/5 text-white border border-white/10 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all active:scale-95"
            >
              Signup Now
            </button>
          </div>
        </div>
      </div>
    );
  }



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

  const handleEditAddress = (index: number, addr: any) => {
    setEditingAddressIndex(index);
    setEditFormData({ ...addr });
  };

  const handleSaveEditedAddress = async () => {
    if (editingAddressIndex === null || !user) return;

    try {
      const updated = await store.updateUserAddress(user.id, editingAddressIndex, editFormData);
      setAddresses(updated);
      setEditingAddressIndex(null);
      setEditFormData({});
      showAlert('Success', 'Address updated successfully.', 'success');
    } catch (error) {
      console.error('Failed to update address', error);
      showAlert('Error', 'Failed to update address.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingAddressIndex(null);
    setEditFormData({});
  };

  const handleSaveNewAddress = async () => {
    if (!user) return;

    // Basic Validation
    if (!editFormData.address || !editFormData.city || !editFormData.zipCode) {
      showAlert('Missing Information', 'Please fill in at least Address, City, and Zip Code.', 'error');
      return;
    }

    try {
      const updated = await store.saveUserAddress(user.id, editFormData);
      setAddresses(updated);
      setIsAddingAddress(false);
      setEditFormData({});
      showAlert('Success', 'New address added successfully.', 'success');
    } catch (error) {
      console.error('Failed to add address', error);
      showAlert('Error', 'Failed to add address.', 'error');
    }
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
    <div className="min-h-screen bg-transparent relative">
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-2 pb-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-white/50 backdrop-blur-md rounded-full border-2 border-primary/20 flex items-center justify-center text-lg md:text-2xl font-black text-primary shadow-sm">
              {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg md:text-3xl font-black text-white mb-0 uppercase tracking-wider">{user.user_metadata?.first_name || 'My'} Account</h1>
              <p className="text-gray-400 text-[10px] md:text-sm font-medium">{user.email}</p>
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

        {/* Header Card */}
        <div className="bg-[#030014]/60 backdrop-blur-2xl rounded-[1.5rem] border border-white/10 p-4 md:p-6 mb-4 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-1000"></div>

          <div className="w-14 h-14 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center text-lg md:text-3xl font-black text-white flex-shrink-0 border-2 border-white/10 shadow-lg relative z-10">
            {(profile?.full_name || user?.displayName || 'U').charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left w-full relative z-10">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-1">
              {isEditing ? (
                <div className="flex gap-2 items-center justify-center md:justify-start">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-white focus:ring-2 focus:ring-primary outline-none font-bold placeholder:text-gray-500 text-sm"
                    placeholder={profile?.full_name || user?.displayName}
                  />
                  <button onClick={handleUpdateName} className="text-green-500 hover:text-green-400 transition-colors"><Icons.CheckCircle className="w-5 h-5" /></button>
                  <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400 transition-colors"><Icons.X className="w-5 h-5" /></button>
                </div>
              ) : (
                <>
                  <h1 className="text-lg md:text-2xl font-black text-white uppercase tracking-wider">{profile?.full_name || user?.displayName || 'User'}</h1>
                  <button onClick={() => { setNewName(profile?.full_name || user?.displayName); setIsEditing(true); }} className="text-gray-400 hover:text-primary transition-colors">
                    <Icons.Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-2 bg-white/5 py-0.5 px-2 rounded-full inline-block border border-white/5">{user.email}</p>
            <div className="flex justify-center md:justify-start items-center gap-2 text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">
              <Icons.User className="w-3 h-3 text-primary" />
              Member Since {new Date(user.joinDate || Date.now()).getFullYear()}
            </div>
          </div>
          <button
            onClick={() => {
              showAlert(
                'Sign Out',
                'Are you sure you want to log out?',
                'warning',
                {
                  confirmText: 'Sign Out',
                  onConfirm: () => {
                    setTimeout(() => logout(), 0);
                  },
                  cancelText: 'Cancel'
                }
              );
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all self-start relative z-10"
          >
            <Icons.LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-4 gap-4">
          {/* Scrollable Tabs for Mobile */}
          <div className="bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 p-2 md:p-3 flex md:flex-col overflow-x-auto gap-2 md:gap-2 scrollbar-hide z-20 md:static md:h-fit shadow-2xl">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Icons.Package} label="Overview" />
            <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} icon={Icons.Star} label="My Rewards" />
            <TabButton active={activeTab === 'addresses'} onClick={() => setActiveTab('addresses')} icon={Icons.MapPin} label="Addresses" />
            <TabButton active={activeTab === 'spending'} onClick={() => setActiveTab('spending')} icon={Icons.Wallet} label="Spending" />
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Icons.Shield} label="Security" />

            {/* Sign Out Button - Mobile Only */}
            <button
              onClick={() => {
                showAlert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  'warning',
                  {
                    confirmText: 'Sign Out',
                    onConfirm: () => {
                      setTimeout(() => logout(), 0);
                    },
                    cancelText: 'Cancel'
                  }
                );
              }}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all flex-shrink-0 whitespace-nowrap text-sm bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-200"
            >
              <Icons.LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'overview' ? (
              <>
                <div className="bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-charcoal/5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                  <h3 className="font-black text-xs text-textMain mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                    Recent Orders
                  </h3>
                  {ordersLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E60000]"></div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-white/5 rounded-xl overflow-hidden transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-white/5 group">
                          <div
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer hover:bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-lg shrink-0 flex items-center justify-center text-gray-500 overflow-hidden border border-white/10 group-hover:border-[#E60000]/30 transition-colors">
                                {order.items?.[0]?.imageUrl ? (
                                  <img
                                    src={order.items[0].imageUrl}
                                    alt="Product"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                                  />
                                ) : (
                                  <Icons.Package />
                                )}
                              </div>
                              <div className="flex-1 sm:hidden">
                                <h4 className="font-black text-sm text-white">Order #{order.readableId || order.id.slice(0, 8)}</h4>
                                <span className="font-black text-sm text-green-500" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex-1 hidden sm:block">
                              <h4 className="font-black text-textMain uppercase tracking-wider">Order #{order.readableId || order.id.slice(0, 8)}</h4>
                              <p className="text-sm text-textMuted font-medium">Placed on {new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex justify-between items-center w-full sm:w-auto gap-3">
                              <span className={`px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-tighter rounded-full ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}>
                                {order.status}
                              </span>
                              <span className="font-black text-sm text-green-500 hidden sm:block" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</span>

                              {/* Cancel Button for User */}
                              {order.status === 'processing' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showAlert(
                                      'Cancel Order',
                                      'Are you sure you want to cancel this order? Points used will be refunded.',
                                      'warning',
                                      {
                                        confirmText: 'Yes, Cancel Order',
                                        onConfirm: async () => {
                                          try {
                                            // 1. Refund Points if any were used
                                            if (order.pointsRedeemed && order.pointsRedeemed > 0) {
                                              const { data: profile } = await supabase
                                                .from('profiles')
                                                .select('reward_points')
                                                .eq('id', user.id)
                                                .single();

                                              const currentPoints = profile?.reward_points || 0;
                                              const newPoints = currentPoints + order.pointsRedeemed;

                                              await supabase
                                                .from('profiles')
                                                .update({ reward_points: newPoints })
                                                .eq('id', user.id);

                                              console.log(`Refunded ${order.pointsRedeemed} points.`);
                                            }

                                            // 2. Update Order Status in DB
                                            const { error: updateError } = await supabase
                                              .from('orders')
                                              .update({ status: 'cancelled' })
                                              .eq('id', order.id);

                                            if (updateError) throw updateError;

                                            // 3. Update Local State
                                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));

                                            showAlert('Success', order.pointsRedeemed && order.pointsRedeemed > 0
                                              ? `Order cancelled. ${order.pointsRedeemed} points have been refunded to your account.`
                                              : 'Order cancelled successfully.', 'success');
                                          } catch (err) {
                                            console.error('Failed to cancel order:', err);
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

                              {/* Expand Chevron */}
                              <div className="text-gray-400 ml-1">
                                <Icons.ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedOrderId === order.id && (
                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                              <h5 className="font-bold text-sm mb-3 text-gray-700">Order Items</h5>
                              <div className="space-y-3">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-100">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 shrink-0 border border-gray-200 rounded overflow-hidden">
                                      <img
                                        src={item.imageUrl || '/placeholder.png'}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 text-sm mb-1">{item.name}</p>
                                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Qty: {item.quantity}</span>
                                        {item.selectedSize && (
                                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Size: {item.selectedSize}</span>
                                        )}
                                        {item.selectedColor && (
                                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{item.selectedColor}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Price */}
                                    <span className="font-bold text-gray-900 text-sm shrink-0" style={{ fontFamily: 'Arial, sans-serif' }}>
                                      &#8377;{(item.price * item.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Order Details */}
                              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Payment Method</span>
                                  <span className="font-bold text-gray-900">
                                    {order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Delivery Type</span>
                                  <span className="font-bold text-gray-900">{order.deliveryType || 'Standard Delivery'}</span>
                                </div>

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
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl border-l-4 border-[#E60000]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-sans">Total Spent</p>
                    <p className="text-2xl font-black text-white" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl border-l-4 border-blue-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-sans">Total Orders</p>
                    <p className="text-2xl font-black text-white">{orders.length}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl border-l-4 border-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-sans">Average Order</p>
                    <p className="text-2xl font-black text-white" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toLocaleString() : 0}</p>
                  </div>
                </div>

                {/* Recent Spending */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                  <h3 className="font-black text-xs text-white mb-6 uppercase tracking-[0.2em]">Spending History</h3>
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                          <div>
                            <p className="font-black text-sm text-white uppercase tracking-widest group-hover:text-[#E60000]">Order #{order.readableId || order.id.slice(0, 8)}</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          <p className="font-black text-lg text-green-500" style={{ fontFamily: 'Arial, sans-serif' }}>&#8377;{order.total.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                      <Icons.Wallet className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No transaction data found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'addresses' ? (
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-xs text-white uppercase tracking-[0.2em]">Saved Addresses</h3>
                  {!isAddingAddress && (
                    <button
                      onClick={() => { setIsAddingAddress(true); setEditFormData({}); }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#E60000] text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-[#ff0000] transition-all shadow-[0_0_15px_rgba(230,0,0,0.3)]"
                    >
                      <Icons.Plus className="w-4 h-4" />
                      Add New Address
                    </button>
                  )}
                </div>

                {isAddingAddress && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                    <h4 className="font-bold mb-3">Add New Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        value={editFormData.firstName || ''}
                        onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        placeholder="First Name"
                        className="border rounded p-2 text-sm w-full"
                      />
                      <input
                        value={editFormData.lastName || ''}
                        onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        placeholder="Last Name"
                        className="border rounded p-2 text-sm w-full"
                      />
                    </div>
                    <input
                      value={editFormData.address || ''}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      placeholder="Address"
                      className="border rounded p-2 text-sm w-full mb-3"
                    />
                    <input
                      value={editFormData.phone || ''}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="border rounded p-2 text-sm w-full mb-3"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <input
                        value={editFormData.city || ''}
                        onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                        placeholder="City"
                        className="border rounded p-2 text-sm w-full"
                      />
                      <input
                        value={editFormData.state || ''}
                        onChange={e => setEditFormData({ ...editFormData, state: e.target.value })}
                        placeholder="State"
                        className="border rounded p-2 text-sm w-full"
                      />
                      <input
                        value={editFormData.zipCode || ''}
                        onChange={e => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                        placeholder="Zip Code"
                        className="border rounded p-2 text-sm w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNewAddress}
                        className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-800"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingAddress(false);
                          setEditFormData({});
                        }}
                        className="border border-gray-300 px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 relative bg-white shadow-sm hover:shadow-md transition-shadow">
                      {editingAddressIndex === index ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={editFormData.firstName || ''}
                              onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                              placeholder="First Name"
                              className="border rounded p-2 text-sm w-full"
                            />
                            <input
                              value={editFormData.lastName || ''}
                              onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                              placeholder="Last Name"
                              className="border rounded p-2 text-sm w-full"
                            />
                          </div>
                          <input
                            value={editFormData.address || ''}
                            onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                            placeholder="Address"
                            className="border rounded p-2 text-sm w-full"
                          />
                          <input
                            value={editFormData.phone || ''}
                            onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                            placeholder="Phone Number"
                            className="border rounded p-2 text-sm w-full"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={editFormData.city || ''}
                              onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                              placeholder="City"
                              className="border rounded p-2 text-sm w-full"
                            />
                            <input
                              value={editFormData.state || ''}
                              onChange={e => setEditFormData({ ...editFormData, state: e.target.value })}
                              placeholder="State"
                              className="border rounded p-2 text-sm w-full"
                            />
                            <input
                              value={editFormData.zipCode || ''}
                              onChange={e => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                              placeholder="Zip Code"
                              className="border rounded p-2 text-sm w-full"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={handleSaveEditedAddress}
                              className="flex-1 bg-black text-white py-2 rounded text-sm font-bold hover:bg-gray-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 border border-gray-300 py-2 rounded text-sm font-bold hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <>
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              onClick={() => handleEditAddress(index, addr)}
                              className="text-gray-400 hover:text-blue-500 bg-gray-50 p-1.5 rounded-full"
                              title="Edit Address"
                            >
                              <Icons.Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(index)}
                              className="text-gray-400 hover:text-red-500 bg-gray-50 p-1.5 rounded-full"
                              title="Delete Address"
                            >
                              <Icons.Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="mt-1 bg-gray-100 p-2 rounded-full">
                              <Icons.MapPin className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{addr.firstName} {addr.lastName}</p>
                              <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                              <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.zipCode}</p>
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <Icons.Phone className="w-3 h-3" />
                                <span>{addr.phone}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {addresses.length === 0 && !isAddingAddress && (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="bg-white inline-flex p-4 rounded-full shadow-sm mb-3">
                      <Icons.MapPin className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium">No addresses saved yet</p>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Add your first address
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'rewards' ? (
              <RewardsTab showAlert={showAlert} />
            ) : activeTab === 'security' ? (
              <div className="bg-white/5 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] border border-white/10 shadow-2xl max-w-lg">
                <h3 className="font-black text-xs text-white mb-8 uppercase tracking-[0.2em]">Security Settings</h3>
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