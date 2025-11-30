import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/Icons';
import { store } from '../services/store';
import { LocationPicker } from '../components/LocationPicker';
import { sendOrderConfirmationToUser, sendOrderNotificationToAdmin, OrderEmailParams } from '../services/emailService';
import { AnimatedGradientBackground, DeliveryCarAnimation } from '../components/AnimatedBackgrounds';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';

const steps = ['Shipping', 'Payment', 'Confirmation'];

export const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alertState, showAlert, closeAlert } = useCustomAlert();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [isFastDelivery, setIsFastDelivery] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [giftWrapping, setGiftWrapping] = useState<'none' | 'plastic' | 'paper' | 'box-plastic' | 'box-paper'>('none');
  const [boxWrappingType, setBoxWrappingType] = useState<'plastic' | 'paper'>('plastic');

  // Address Management
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [saveAddress, setSaveAddress] = useState(true);

  // Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryDate: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const finalTotal = cartTotal + (isFastDelivery ? 100 : 0);

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (user) {
      store.getUserAddresses(user.id)
        .then(setSavedAddresses)
        .catch(err => console.error('Failed to load addresses:', err));
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && currentStep !== 2) {
      navigate('/shop');
    }
  }, [cart, navigate, currentStep]);

  // Helper: Calculate minimum delivery date (Today + 2 days)
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
  };

  // Handler: Select saved address
  const handleAddressSelect = (addr: any) => {
    setFormData(prev => ({
      ...prev,
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || ''
    }));
  };

  // Handler: Shipping Form Submit
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.phone.length !== 10) {
      showAlert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'warning');
      document.getElementById('phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('phone')?.focus();
      return;
    }
    if (formData.zipCode.length !== 6) {
      showAlert('Invalid Zip Code', 'Zip Code must be 6 digits.', 'warning');
      document.getElementById('zipCode')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('zipCode')?.focus();
      return;
    }
    if (!formData.deliveryDate) {
      showAlert('Delivery Date Required', 'Please select a delivery date.', 'warning');
      document.getElementById('deliveryDate')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('deliveryDate')?.focus();
      return;
    }

    setCurrentStep(1);
  };

  // Handler: File Upload for UPI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showAlert('File Too Large', 'Please upload an image under 5MB.', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setScreenshot(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Place Order
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'upi' && !screenshot) {
      showAlert('Screenshot Required', 'Please upload the payment screenshot to confirm your UPI payment.', 'warning');
      return;
    }

    setProcessing(true);

    try {
      const isRealUser = user && !user.id.startsWith('otp_');
      const dbUserId = isRealUser ? user.id : null;

      // Prepare Order Details
      const orderDetails = {
        customerName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: formData.email,
        paymentMethod,
        deliveryDate: formData.deliveryDate,
        deliveryType: isFastDelivery ? 'Fast Delivery' : 'Standard Delivery',
        screenshot: screenshot || undefined,
        giftWrapping: giftWrapping,
        deliverySpeed: isFastDelivery ? 'fast' : 'standard',
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          state: formData.state,
          country: 'India',
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        guestInfo: !isRealUser ? {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        } : undefined
      };

      // 1. Create Order in Database
      console.log('Creating order...', { dbUserId, finalTotal, orderDetails });

      let createdOrder;
      try {
        createdOrder = await store.createOrder(dbUserId, cart, finalTotal, orderDetails);
      } catch (err: any) {
        // Retry as guest if foreign key constraint fails (user profile missing)
        if (err?.code === '23503' && dbUserId) {
          console.warn('User profile missing, retrying as guest order...');
          const guestOrderDetails = {
            ...orderDetails,
            guestInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone
            }
          };
          createdOrder = await store.createOrder(null, cart, finalTotal, guestOrderDetails);
        } else {
          throw err;
        }
      }

      // 2. Save Address (Optional)
      if (isRealUser && saveAddress) {
        try {
          await store.saveUserAddress(user.id, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          });
        } catch (addrError) {
          console.warn('Failed to save address:', addrError);
          // Don't block order completion for this
        }
      }

      // 3. Send Emails
      try {
        // Enhanced order items HTML with images and complete details
        const orderItemsHtml = cart.map(item => `
            <div style="border-bottom: 1px solid #e0e0e0; padding: 15px 0; display: flex; gap: 15px; align-items: start;">
                <!-- Product Image -->
                <div style="flex-shrink: 0;">
                    <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;" />
                </div>
                
                <!-- Product Details -->
                <div style="flex: 1;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px; color: #333;">${item.name}</p>
                    
                    ${item.selectedSize || item.selectedColor ? `
                      <div style="margin: 0 0 8px 0; display: flex; gap: 12px; flex-wrap: wrap;">
                        ${item.selectedSize ? `
                          <span style="background: #f5f5f5; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #666;">
                            <strong>Size:</strong> ${item.selectedSize}
                          </span>
                        ` : ''}
                        ${item.selectedColor ? `
                          <span style="background: #f5f5f5; padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #666;">
                            <strong>Color:</strong> ${item.selectedColor}
                          </span>
                        ` : ''}
                      </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 15px; align-items: center; margin-top: 8px;">
                        <span style="font-size: 13px; color: #666;">
                            <strong>Qty:</strong> ${item.quantity}
                        </span>
                        <span style="font-size: 15px; font-weight: bold; color: #2e7d32;">
                            &#8377;${(item.price * item.quantity).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        // Format gift wrapping for display
        const giftWrappingText = giftWrapping === 'none' ? 'No Wrapping' :
          giftWrapping === 'plastic' ? 'Designer Plastic Wrapping' :
            giftWrapping === 'paper' ? 'Designer Paper Wrapping' :
              giftWrapping === 'box-plastic' ? 'Box + Plastic Wrapping' :
                giftWrapping === 'box-paper' ? 'Box + Paper Wrapping' : 'No Wrapping';

        // Calculate expected delivery date (delivery date + 1 day for standard, same day for fast)
        const deliveryDateObj = new Date(formData.deliveryDate);
        const expectedDeliveryDate = new Date(deliveryDateObj);
        if (!isFastDelivery) {
          expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 1);
        }
        const expectedDeliveryStr = expectedDeliveryDate.toLocaleDateString('en-IN', {
          year: 'numeric', month: 'short', day: 'numeric'
        });

        // Format shipping address
        const shippingAddressFormatted = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`;

        // but here we await to show success/fail alert accurately)
        await Promise.allSettled([
          sendOrderConfirmationToUser({
            to_email: formData.email,
            to_name: `${formData.firstName} ${formData.lastName}`,
            order_id: createdOrder.readableId ? `#${createdOrder.readableId}` : createdOrder.id.slice(0, 8),
            order_total: `₹${finalTotal.toLocaleString()}`,
            order_items: orderItemsHtml,
            shipping_address: shippingAddressFormatted,
            delivery_date: new Date(formData.deliveryDate).toLocaleDateString(),
            gift_wrapping: giftWrappingText
          }),
          sendOrderNotificationToAdmin({
            order_id: createdOrder.readableId ? `#${createdOrder.readableId}` : createdOrder.id.slice(0, 8),
            customer_name: `${formData.firstName} ${formData.lastName}`,
            order_total: `₹${finalTotal.toLocaleString()}`,
            order_items: orderItemsHtml
          })
        ]);

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue to success screen even if email fails
      }

      // Success
      setProcessing(false);
      setCurrentStep(2);
      clearCart();

    } catch (error: any) {
      console.error('Order processing failed:', error);

      // User-friendly error message
      let errorMessage = 'Something went wrong. Please try again.';
      if (error.code === '42501') {
        errorMessage = 'Permission denied. Please try refreshing the page or contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showAlert('Order Failed', errorMessage, 'error');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 relative">
      <AnimatedGradientBackground />
      <div className="max-w-4xl mx-auto relative z-10">



        {/* Stepper */}
        <div className="flex justify-center mb-10 px-2">
          <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 md:px-6 py-3 rounded-xl shadow-md justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-1 md:gap-2 ${index <= currentStep ? 'text-primary' : 'text-gray-600'}`}>
                  <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm border-2 shrink-0 ${index <= currentStep ? 'border-primary bg-primary text-white' : 'border-gray-400 bg-white text-gray-700'}`}>
                    {index + 1}
                  </div>
                  <span className="text-[9px] md:text-sm font-semibold whitespace-nowrap">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 md:w-12 h-0.5 mx-1 md:mx-4 shrink-0 ${index < currentStep ? 'bg-primary' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode='wait'>

              {/* STEP 1: SHIPPING */}
              {currentStep === 0 && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="font-serif text-xl font-bold mb-6">Shipping Details</h2>

                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Saved Addresses</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleAddressSelect(savedAddresses[parseInt(e.target.value)]);
                        }}
                        className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a saved address...</option>
                        {savedAddresses.map((addr, idx) => (
                          <option key={idx} value={idx}>
                            {addr.firstName} {addr.lastName} - {addr.address}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <form id="checkout-shipping-form" className="space-y-4" onSubmit={handleShippingSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <input required id="firstName" type="text" placeholder="First Name *" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />
                      <input required id="lastName" type="text" placeholder="Last Name *" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />
                    </div>

                    <input required id="email" type="email" placeholder="Email Address *" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />

                    <div className="flex-1 flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                      <span className="bg-gray-50 px-3 py-3 text-gray-500 border-r flex items-center font-medium">+91</span>
                      <input
                        required
                        id="phone"
                        type="tel"
                        placeholder="Mobile Number *"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="flex-1 p-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Select Location</label>

                      {/* Auto-detect button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setFormData({
                                  ...formData,
                                  latitude: position.coords.latitude,
                                  longitude: position.coords.longitude
                                });
                                showAlert('Location Captured', 'Your location has been auto-detected successfully!', 'success');
                              },
                              (error) => {
                                showAlert('Location Error', 'Unable to get your location. Please enable location access or select manually on the map.', 'warning');
                              }
                            );
                          } else {
                            showAlert('Not Supported', 'Geolocation is not supported by your browser. Please select on the map.', 'warning');
                          }
                        }}
                        className={`w-full p-3 rounded-lg border-2 font-medium transition-all mb-3 ${formData.latitude && formData.longitude
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-primary'
                          }`}
                      >
                        {formData.latitude && formData.longitude ? (
                          <span className="flex items-center justify-center gap-2">
                            <Icons.CheckCircle className="w-5 h-5" />
                            Location Captured
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Icons.MapPin className="w-5 h-5" />
                            Auto-Detect My Location
                          </span>
                        )}
                      </button>

                      {/* Map for manual selection */}
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          setFormData({
                            ...formData,
                            latitude: lat,
                            longitude: lng
                          });
                        }}
                      />

                      {formData.latitude && formData.longitude && (
                        <p className="text-xs text-green-600 font-medium mt-2 bg-green-50 p-2 rounded border border-green-200">
                          ✓ Location selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>

                    <input required id="address" type="text" placeholder="Flat / House No / Building / Street *" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />

                    <div className="grid grid-cols-2 gap-4">
                      <input required id="city" type="text" placeholder="City *" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />
                      <input required id="state" type="text" placeholder="State *" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />
                    </div>

                    <input required id="zipCode" type="text" placeholder="Zip Code (6 digits) *" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none" />

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Date</label>
                      <input
                        required
                        id="deliveryDate"
                        type="date"
                        min={getMinDate()}
                        value={formData.deliveryDate}
                        onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-bold text-sm mb-3">Delivery Speed</p>
                      <div className="space-y-3">
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${!isFastDelivery ? 'bg-white border-primary ring-1 ring-primary' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="deliverySpeed" checked={!isFastDelivery} onChange={() => setIsFastDelivery(false)} className="accent-primary w-4 h-4" />
                            <div>
                              <span className="font-bold text-sm block">Standard Delivery</span>
                              <span className="text-xs text-gray-500">Delivered in 3-5 days</span>
                            </div>
                          </div>
                          <span className="text-green-600 font-bold text-sm">Free</span>
                        </label>

                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${isFastDelivery ? 'bg-white border-primary ring-1 ring-primary' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="deliverySpeed" checked={isFastDelivery} onChange={() => setIsFastDelivery(true)} className="accent-primary w-4 h-4" />
                            <div>
                              <span className="font-bold text-sm block flex items-center gap-1">Fast Delivery <Icons.Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /></span>
                              <span className="text-xs text-gray-500">Delivered within 24-48 hours</span>
                            </div>
                          </div>
                          <span className="font-bold text-sm">+&#8377;100</span>
                        </label>
                      </div>
                    </div>

                    {/* Gift Wrapping Section */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-bold text-sm mb-3">Gift Wrapping</p>
                      <div className="space-y-3">
                        {/* No Wrapping */}
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${giftWrapping === 'none' ? 'bg-white border-primary ring-1 ring-primary' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="giftWrapping" checked={giftWrapping === 'none'} onChange={() => setGiftWrapping('none')} className="accent-primary w-4 h-4" />
                            <div>
                              <span className="font-bold text-sm block">No Wrapping</span>
                              <span className="text-xs text-gray-500">Standard packaging</span>
                            </div>
                          </div>
                        </label>

                        {/* Designer Plastic Wrapping */}
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${giftWrapping === 'plastic' ? 'bg-white border-primary ring-1 ring-primary' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="giftWrapping" checked={giftWrapping === 'plastic'} onChange={() => setGiftWrapping('plastic')} className="accent-primary w-4 h-4" />
                            <div>
                              <span className="font-bold text-sm block flex items-center gap-1">Designer Plastic Wrapping <Icons.Gift className="w-3 h-3 text-primary" /></span>
                              <span className="text-xs text-gray-500">Transparent designer wrap</span>
                            </div>
                          </div>
                          <span className="text-green-600 font-bold text-sm">Free</span>
                        </label>

                        {/* Designer Paper Wrapping */}
                        <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${giftWrapping === 'paper' ? 'bg-white border-primary ring-1 ring-primary' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="giftWrapping" checked={giftWrapping === 'paper'} onChange={() => setGiftWrapping('paper')} className="accent-primary w-4 h-4" />
                            <div>
                              <span className="font-bold text-sm block flex items-center gap-1">Designer Paper Wrapping <Icons.Gift className="w-3 h-3 text-primary" /></span>
                              <span className="text-xs text-gray-500">Premium gift paper</span>
                            </div>
                          </div>
                          <span className="text-green-600 font-bold text-sm">Free</span>
                        </label>

                        {/* Box + Wrapping - Future Scope
                        <div className={`border rounded-lg transition-all ${giftWrapping === 'box-plastic' || giftWrapping === 'box-paper' ? 'bg-white border-primary ring-1 ring-primary' : 'bg-white border-gray-200'}`}>
                          <label className="flex items-center justify-between p-3 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="giftWrapping"
                                checked={giftWrapping === 'box-plastic' || giftWrapping === 'box-paper'}
                                onChange={() => setGiftWrapping(boxWrappingType === 'plastic' ? 'box-plastic' : 'box-paper')}
                                className="accent-primary w-4 h-4"
                              />
                              <div>
                                <span className="font-bold text-sm block flex items-center gap-1">Box + Wrapping <Icons.Package className="w-3 h-3 text-primary" /></span>
                                <span className="text-xs text-gray-500">Premium box with wrapping</span>
                              </div>
                            </div>
                            <span className="text-green-600 font-bold text-sm">Free</span>
                          </label>

                          {(giftWrapping === 'box-plastic' || giftWrapping === 'box-paper') && (
                            <div className="px-3 pb-3 pt-0 border-t border-gray-100 mt-2">
                              <p className="text-xs text-gray-600 mb-2 mt-2">Choose wrapping type:</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBoxWrappingType('plastic');
                                    setGiftWrapping('box-plastic');
                                  }}
                                  className={`flex-1 py-2 px-3 text-xs font-medium rounded border transition-all ${boxWrappingType === 'plastic' ? 'bg-primary border-primary text-black' : 'bg-white border-gray-300 text-gray-700 hover:border-primary'}`}
                                >
                                  Plastic
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBoxWrappingType('paper');
                                    setGiftWrapping('box-paper');
                                  }}
                                  className={`flex-1 py-2 px-3 text-xs font-medium rounded border transition-all ${boxWrappingType === 'paper' ? 'bg-primary border-primary text-black' : 'bg-white border-gray-300 text-gray-700 hover:border-primary'}`}
                                >
                                  Paper
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        */}
                      </div>
                    </div>

                    {user && (
                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 accent-primary" />
                        <span className="text-sm text-gray-700">Save this address for future orders</span>
                      </label>
                    )}

                    {/* Desktop button - hidden on mobile */}
                    <button type="submit" className="hidden lg:block w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors mt-4">Continue to Payment</button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: PAYMENT */}
              {currentStep === 1 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="font-serif text-xl font-bold mb-6">Payment Method</h2>
                  <form id="checkout-payment-form" onSubmit={handlePayment}>

                    {/* UPI Option */}
                    <div className={`mb-4 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <label className="flex items-center gap-3 cursor-pointer w-full">
                        <input type="radio" name="payment" className="w-5 h-5 text-primary accent-primary" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                        <span className="font-medium flex items-center gap-2"><Icons.Smartphone className="w-5 h-5" /> UPI / QR Code</span>
                      </label>

                      {paymentMethod === 'upi' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pl-8 flex flex-col items-center">
                          <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm flex flex-col items-center w-full">
                            <p className="text-sm font-bold text-gray-700 mb-3">Scan to Pay</p>
                            <img src="/upi-qr.png" alt="UPI QR Code" className="w-48 h-auto object-contain mb-4 border-2 border-gray-200 rounded-lg" />
                            <div className="w-full border-t pt-4">
                              <label className="block text-sm font-bold text-gray-700 mb-2">Upload Payment Screenshot</label>
                              <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                              {screenshot && (
                                <div className="mt-2">
                                  <p className="text-xs text-green-600 font-bold mb-1">Screenshot Uploaded:</p>
                                  <img src={screenshot} alt="Payment Screenshot" className="h-20 rounded border" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* COD Option */}
                    <div className={`mb-6 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <label className="flex items-center gap-3 cursor-pointer w-full">
                        <input type="radio" name="payment" className="w-5 h-5 text-primary accent-primary" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                        <span className="font-medium flex items-center gap-2"><Icons.Banknote className="w-5 h-5" /> Cash on Delivery</span>
                      </label>
                      {paymentMethod === 'cod' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2 pl-8">
                          <p className="text-sm text-gray-600">Pay securely with cash upon delivery.</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Desktop button - hidden on mobile */}
                    <button type="submit" disabled={processing} className="hidden lg:block w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                      {processing ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> :
                        (paymentMethod === 'cod' ?
                          <span>Place Order - &#8377;{finalTotal.toLocaleString()}</span> :
                          <span>Confirm Payment - &#8377;{finalTotal.toLocaleString()}</span>)
                      }
                    </button>
                    <button type="button" onClick={() => setCurrentStep(0)} className="w-full mt-2 text-textMuted hover:underline">Back to Shipping</button>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: CONFIRMATION */}
              {currentStep === 2 && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-10 rounded-xl shadow-sm text-center flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
                  >
                    <Icons.CheckCircle className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <h2 className="font-serif text-3xl font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-textMuted mb-4">Thank you for your purchase.</p>

                  {/* Delivery Car Animation */}
                  <div className="w-full max-w-md mb-6">
                    <DeliveryCarAnimation />
                  </div>

                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm mb-8">
                    <p className="font-bold">Confirmation Email Sent</p>
                    <p>We've sent the order details to {formData.email}</p>
                  </div>
                  <button onClick={() => navigate('/account')} className="bg-primary text-black px-8 py-3 rounded-full font-bold hover:bg-primary-dark transition-colors">
                    View Order in Account
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          {currentStep < 2 && (
            <div className="bg-gray-50 p-6 rounded-xl h-fit">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute top-0 right-0 bg-gray-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-bl-lg">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">{item.name}</h4>
                      <p className="text-gray-500 text-xs mt-1">{item.category}</p>
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="flex gap-2 mt-1">
                          {item.selectedColor && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 text-sm">&#8377;{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                {/* Calculate totals with market prices */}
                {(() => {
                  const marketPriceTotal = cart.reduce((sum, item) => {
                    const marketPrice = item.marketPrice || item.price;
                    return sum + (marketPrice * item.quantity);
                  }, 0);
                  const totalSavings = marketPriceTotal - cartTotal;
                  const hasDiscount = totalSavings > 0;

                  return (
                    <>
                      {/* Market Price Total (if there's a discount) */}
                      {hasDiscount && (
                        <div className="flex justify-between text-gray-500">
                          <span>MRP Total</span>
                          <span className="line-through">&#8377;{marketPriceTotal.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Subtotal (Current Price) */}
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-medium">&#8377;{cartTotal.toLocaleString()}</span>
                      </div>

                      {/* Shipping */}
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping ({isFastDelivery ? 'Fast' : 'Standard'})</span>
                        <span className={`font-medium ${isFastDelivery ? 'text-gray-900' : 'text-green-600'}`}>
                          {isFastDelivery ? <span>&#8377;100</span> : 'Free'}
                        </span>
                      </div>

                      {/* Gift Wrapping */}
                      <div className="flex justify-between text-gray-600">
                        <span>Gift Wrapping</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>

                      {/* You Saved Badge */}
                      {hasDiscount && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-green-700 font-bold text-sm flex items-center gap-1">
                              <Icons.CheckCircle className="w-4 h-4" />
                              You Saved
                            </span>
                            <span className="text-green-700 font-bold text-lg">&#8377;{totalSavings.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-xl">&#8377;{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Submit Buttons - Below Order Summary */}
        {currentStep < 2 && (
          <div className="lg:hidden mt-6">
            {currentStep === 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Trigger form submission
                  const form = document.getElementById('checkout-shipping-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                Continue to Payment
              </button>
            )}
            {currentStep === 1 && (
              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Trigger form submission
                    const form = document.getElementById('checkout-payment-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  disabled={processing}
                  className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  {processing ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> :
                    (paymentMethod === 'cod' ?
                      <span>Place Order - &#8377;{finalTotal.toLocaleString()}</span> :
                      <span>Confirm Payment - &#8377;{finalTotal.toLocaleString()}</span>)
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="w-full text-textMuted hover:underline text-sm"
                >
                  Back to Shipping
                </button>
              </div>
            )}
          </div>
        )}
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
  );
};