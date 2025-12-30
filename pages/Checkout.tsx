import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { DeliveryCarAnimation } from '../components/AnimatedBackgrounds';
import { store } from '../services/store';
import { LocationPicker } from '../components/LocationPicker';
import { sendOrderConfirmationToUser, sendOrderNotificationToAdmin, OrderEmailParams } from '../services/emailService';
import { CustomAlert, useCustomAlert } from '../components/CustomAlert';
import { calculatePointsValue, REWARD_RULES } from '../utils/rewards';
import { supabase } from '../services/supabaseClient';

const steps = ['Shipping', 'Payment', 'Order Success'];

export const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alertState, showAlert, closeAlert } = useCustomAlert();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [upiOption, setUpiOption] = useState<'abhishek' | 'raj'>('abhishek');
  const [isFastDelivery, setIsFastDelivery] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [giftWrapping, setGiftWrapping] = useState<'none' | 'plastic' | 'paper' | 'box-plastic' | 'box-paper'>('none');
  const [boxWrappingType, setBoxWrappingType] = useState<'plastic' | 'paper'>('plastic');

  // Rewards & Coupons State
  const [useRewards, setUseRewards] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsValue, setPointsValue] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, percent: number } | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  // Address Management
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [saveAddress, setSaveAddress] = useState(true);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);

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
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Default to tomorrow
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Calculate Totals
  const shippingCost = isFastDelivery ? 100 : 0;

  // Calculate Discounts
  const pointsDiscount = useRewards ? Math.min(pointsValue, cartTotal) : 0;
  const couponDiscount = appliedCoupon ? Math.round(cartTotal * (appliedCoupon.percent / 100)) : 0;

  const totalDiscount = pointsDiscount + couponDiscount;
  const finalTotal = Math.max(0, cartTotal + shippingCost - totalDiscount);

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (user) {
      store.getUserAddresses(user.id)
        .then(setSavedAddresses)
        .catch(err => console.error('Failed to load addresses:', err));

      // Fetch User Points
      const fetchPoints = async () => {
        const { data, error } = await supabase.from('profiles').select('reward_points').eq('id', user.id).single();
        if (data) {
          setUserPoints(data.reward_points || 0);
          setPointsValue(calculatePointsValue(data.reward_points || 0));
        }
      };

      // Fetch User Coupons
      const fetchUserCoupons = async () => {
        const { data } = await supabase
          .from('user_coupons')
          .select('*, coupon:coupons(*)')
          .eq('user_id', user.id)
          .eq('status', 'active');
        setUserCoupons(data || []);
      };

      fetchPoints();
      fetchUserCoupons();
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && currentStep !== 2) {
      navigate('/shop');
    }
  }, [cart, navigate, currentStep]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);


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
      showAlert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.', 'warning');
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

    // Email Normalization
    let email = formData.email.trim();
    if (email && !email.includes('@')) {
      email += '@gmail.com';
      setFormData(prev => ({ ...prev, email }));
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
      showAlert('Payment Proof Required', 'Please upload the payment screenshot to confirm your UPI payment.', 'warning');
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
        pointsRedeemed: useRewards ? Math.floor(pointsDiscount * 10) : 0,
        couponCode: appliedCoupon?.code || undefined,
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
        // Enhanced order items HTML with images and table layout for best email support
        const orderItemsHtml = cart.map((item, index) => `
          <table style="width: 100%; border-bottom: ${index === cart.length - 1 ? 'none' : '1px solid #eee'}; padding: 20px; border-collapse: collapse;">
            <tr>
              <td style="width: 80px; vertical-align: top; padding-right: 15px;">
                <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px; border: 1px solid #f0f0f0;" />
              </td>
              <td style="vertical-align: top;">
                <p style="margin: 0 0 6px 0; font-weight: 800; font-size: 16px; color: #000;">${item.name}</p>
                ${item.selectedSize || item.selectedColor ? `
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                    ${item.selectedSize ? `<span style="background: #f8f8f8; padding: 3px 8px; border-radius: 4px; margin-right: 8px;">Size: ${item.selectedSize}</span>` : ''}
                    ${item.selectedColor ? `<span style="background: #f8f8f8; padding: 3px 8px; border-radius: 4px;">Color: ${item.selectedColor}</span>` : ''}
                  </p>
                ` : ''}
                <table style="width: 100%;">
                  <tr>
                    <td style="font-size: 14px; color: #999; font-weight: 600;">Qty: <span style="color: #000;">${item.quantity}</span></td>
                    <td style="text-align: right; font-size: 16px; font-weight: 900; color: #E60000;">₹${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `).join('');

        // Format gift wrapping for display
        const giftWrappingText = giftWrapping === 'none' ? 'No Gift Wrap' :
          giftWrapping === 'plastic' ? 'Designer Plastic Wrap' :
            giftWrapping === 'paper' ? 'Eco-friendly Paper Wrap' :
              giftWrapping === 'box-plastic' ? 'Premium Box + Plastic Wrap' :
                giftWrapping === 'box-paper' ? 'Premium Box + Eco Paper' : 'No Gift Wrap';

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

        // GENERATE PREMIUM INVOICE HTML
        const invoiceHtml = `
          <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
            <!-- Top Branding Line -->
            <div style="height: 6px; background: linear-gradient(90deg, #E60000 0%, #ff4d4d 100%);"></div>
            
            <div style="padding: 40px;">
              <!-- Header -->
              <table style="width: 100%; margin-bottom: 40px;">
                <tr>
                  <td>
                    <h1 style="color: #000; margin: 0; font-size: 32px; letter-spacing: 3px; font-weight: 900;">GIFTOLOGY</h1>
                    <p style="color: #E60000; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Premium Gifting Experience</p>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-block; background: #fff5f5; padding: 10px 20px; border-radius: 12px; border: 1px solid #ffebeb;">
                      <p style="margin: 0; font-size: 12px; color: #E60000; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Invoice Status</p>
                      <p style="margin: 0; font-size: 16px; color: #000; font-weight: 900;">Processing</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info Grid -->
              <table style="width: 100%; margin-bottom: 35px; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 20px;">
                    <h2 style="font-size: 14px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 12px; font-weight: 800;">Billed To</h2>
                    <p style="margin: 0; font-size: 15px; color: #000; line-height: 1.6;">
                      <strong style="font-size: 18px;">${formData.firstName} ${formData.lastName}</strong><br>
                      ${formData.phone}<br>
                      ${formData.email}
                    </p>
                  </td>
                  <td style="width: 50%; vertical-align: top; text-align: right;">
                    <h2 style="font-size: 14px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 12px; font-weight: 800;">Order Details</h2>
                    <p style="margin: 0; font-size: 15px; color: #000; line-height: 1.6;">
                      Order ID: <strong style="color: #E60000;">#${createdOrder?.readableId || createdOrder?.id || 'Pending'}</strong><br>
                      Date: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Shipping Section -->
              <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 35px; border-left: 4px solid #E60000;">
                <h2 style="font-size: 13px; text-transform: uppercase; color: #E60000; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 800;">Shipping Address</h2>
                <p style="margin: 0; font-size: 14px; color: #444; line-height: 1.5; font-weight: 500;">${shippingAddressFormatted}</p>
              </div>

              <!-- List Items -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-size: 18px; margin: 0 0 20px 0; color: #000; font-weight: 900; border-bottom: 2px solid #eee; padding-bottom: 10px;">Order Items</h2>
                <div style="border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
                  ${orderItemsHtml}
                </div>
              </div>

              <!-- Price Breakdown -->
              <div style="background: #000; padding: 30px; border-radius: 16px; color: #fff;">
                <h2 style="font-size: 16px; text-transform: uppercase; color: #E60000; letter-spacing: 1px; margin: 0 0 20px 0; font-weight: 800;">Payment Breakdown</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 10px 0; color: #bbb;">Subtotal</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #fff;">₹${cartTotal.toLocaleString()}</td>
                  </tr>
                  ${pointsDiscount > 0 ? `
                  <tr>
                    <td style="padding: 10px 0; color: #bbb;">Points Discount</td>
                    <td style="padding: 10px 0; text-align: right; color: #ff4d4d; font-weight: 700;">-₹${pointsDiscount.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                  ${couponDiscount > 0 ? `
                  <tr>
                    <td style="padding: 10px 0; color: #bbb;">Coupon Discount (${appliedCoupon?.code})</td>
                    <td style="padding: 10px 0; text-align: right; color: #4ade80; font-weight: 700;">-₹${couponDiscount.toLocaleString()}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0; color: #bbb;">Delivery Details (${isFastDelivery ? 'Fast' : 'Standard'})</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #fff;">₹${shippingCost.toLocaleString()}</td>
                  </tr>
                  ${giftWrapping !== 'none' ? `
                  <tr>
                    <td style="padding: 10px 0; color: #bbb;">Gift Wrapping</td>
                    <td style="padding: 10px 0; text-align: right; color: #fff; font-weight: 700;">Free</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 1px solid #333;">
                    <td style="padding: 25px 0 0 0; font-size: 20px; font-weight: 900; color: #fff;">Grand Total</td>
                    <td style="padding: 25px 0 0 0; text-align: right; font-size: 28px; font-weight: 900; color: #E60000;">₹${finalTotal.toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <!-- Footer Details -->
              <table style="width: 100%; margin-top: 40px; border-top: 1px solid #eee; padding-top: 30px;">
                <tr>
                  <td style="width: 50%;">
                    <h3 style="font-size: 13px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 800;">Payment Method</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 15px; color: #000; font-weight: 700;">${paymentMethod === 'upi' ? 'UPI / QR Code 📱' : 'Cash on Delivery 🚚'}</span>
                    </div>
                  </td>
                  <td style="width: 50%; text-align: right;">
                    <h3 style="font-size: 13px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 800;">Estimated Delivery</h3>
                    <p style="margin: 0; font-size: 15px; color: #000; font-weight: 700;">${expectedDeliveryStr}</p>
                  </td>
                </tr>
              </table>

              <!-- Brand Msg -->
              <div style="margin-top: 60px; text-align: center;">
                <div style="background: #fff5f5; display: inline-block; padding: 15px 30px; border-radius: 50px; margin-bottom: 25px;">
                  <p style="margin: 0; font-size: 14px; color: #E60000; font-weight: 800;">Thank you for trusting Giftology! ❤️</p>
                </div>
                <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.8;">
                  We are carefully prepping your gift to make it special.<br>
                  For any query, reply to this email or reach us at 
                  <a href="mailto:support@giftology.in" style="color: #000; text-decoration: none; font-weight: 800; border-bottom: 1px solid #000;">support@giftology.in</a>
                </p>
              </div>
            </div>
            
            <!-- Bottom Border -->
            <div style="height: 10px; background: #000;"></div>
          </div>
        `;

        // Fire emails in background
        Promise.allSettled([
          sendOrderConfirmationToUser({
            customerEmail: formData.email,
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerPhone: formData.phone,
            orderTotal: `₹${finalTotal.toLocaleString()}`,
            orderItems: orderItemsHtml,
            shipping_address: shippingAddressFormatted,
            deliveryDetails: `Type: ${isFastDelivery ? 'Fast' : 'Standard'}`,
            paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery',
            delivery_date: new Date(formData.deliveryDate).toLocaleDateString(),
            gift_wrapping: giftWrappingText,
            delivery_speed: isFastDelivery ? 'Fast Delivery' : 'Standard Delivery',
            expected_delivery: expectedDeliveryStr,
            invoice_html: invoiceHtml
          }),
          sendOrderNotificationToAdmin({
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            orderTotal: `₹${finalTotal.toLocaleString()}`,
            orderItems: orderItemsHtml,
            shipping_address: shippingAddressFormatted,
            deliveryDetails: `Type: ${isFastDelivery ? 'Fast' : 'Standard'}`,
            paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery',
            delivery_date: new Date(formData.deliveryDate).toLocaleDateString(),
            gift_wrapping: giftWrappingText,
            delivery_speed: isFastDelivery ? 'Fast Delivery' : 'Standard Delivery',
            expected_delivery: expectedDeliveryStr
          })
        ]).then((results) => {
          console.log('Email sending results:', results);
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              console.log(`Email ${index + 1} result:`, result.value);
            } else {
              console.error(`Email ${index + 1} failed:`, result.reason);
            }
          });
        });

      } catch (emailError) {
        console.error('Email sending/preparation failed:', emailError);
        // Continue to success screen even if email fails
      }

      // 4. DEDUCT REWARD POINTS (Critical Fix!)
      if (useRewards && isRealUser && pointsDiscount > 0) {
        try {
          const pointsToDeduct = Math.floor(pointsDiscount * 10); // Convert ₹ to points (10 points = ₹1)

          // Fetch current points
          const { data: profile } = await supabase
            .from('profiles')
            .select('reward_points')
            .eq('id', user.id)
            .single();

          const currentPoints = profile?.reward_points || 0;
          const newPoints = Math.max(0, currentPoints - pointsToDeduct); // Ensure no negative points

          // Update points in database
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ reward_points: newPoints })
            .eq('id', user.id);

          if (updateError) {
            console.error('Failed to deduct reward points:', updateError);
          } else {
            console.log(`Deducted ${pointsToDeduct} points. New balance: ${newPoints}`);
          }
        } catch (pointsError) {
          console.error('Error deducting points:', pointsError);
          // Don't block order completion for this
        }
      }

      // 5. AWAY EARNED REWARD POINTS removed from checkout (Now handled on delivery)
      let pointsEarned = Math.floor((finalTotal / 100) * 60);

      // 6. SAVE ADDRESS (Via Safe RPC)
      if (isRealUser && saveAddress) {
        const newAddress = {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        };

        try {
          const { error: addrError } = await supabase.rpc('append_user_address', {
            user_id: user.id,
            new_address: newAddress
          });

          if (addrError) {
            console.error('RPC append address failed:', addrError);
            // Fallback handled by store.saveUserAddress call earlier (at step 2)
          } else {
            console.log('Address saved via RPC.');
          }
        } catch (e) {
          console.error('Error saving address:', e);
        }
      }

      // 7. DEACTIVATE COUPON (One-time use)
      if (appliedCoupon) {
        try {
          // Deactivate Globally
          await supabase
            .from('coupons')
            .update({ is_active: false })
            .eq('code', appliedCoupon.code);

          // Mark as used in User Wallet (if user is real)
          if (isRealUser) {
            await supabase
              .from('user_coupons')
              .update({ status: 'used' })
              .eq('user_id', user.id)
              .eq('coupon_code', appliedCoupon.code);
          }

          console.log(`Coupon ${appliedCoupon.code} invalidated.`);
        } catch (e) {
          console.error('Error invalidating coupon:', e);
        }
      }

      // Success with points alert
      setProcessing(false);
      setCurrentStep(2);
      clearCart();

      // Show congratulations alert with earned points
      if (pointsEarned > 0) {
        setTimeout(() => {
          showAlert(
            '🎉 Order Confirmed!',
            `You will get <span style="color: #D4AF37; font-weight: bold; font-size: 1.2em;">${pointsEarned}</span> reward points once the order is delivered! Use them on your next purchase.`,
            'success',
            { confirmText: 'Awesome!' }
          );
        }, 500);
      }

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
    <div className="min-h-screen bg-transparent py-10 px-4 relative">
      <div className="max-w-5xl mx-auto relative z-10 px-1.5 md:px-6">



        {/* Stepper */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-3 ${index <= currentStep ? 'text-[#E60000]' : 'text-gray-600'}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${index <= currentStep ? 'border-[#E60000] bg-[#E60000] text-white shadow-[0_0_15px_rgba(230,0,0,0.5)]' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                    {index + 1}
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest hidden sm:block">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-6 md:w-16 h-px mx-3 ${index < currentStep ? 'bg-[#E60000]' : 'bg-white/10'}`} />
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
                  className="bg-white/5 backdrop-blur-xl p-6 md:p-12 rounded-[2rem] shadow-2xl border border-white/10"
                >
                  <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Icons.Truck className="text-[#E60000]" />
                    Shipping Details
                  </h2>

                  {savedAddresses.length > 0 && (
                    <div className="mb-8">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Saved Addresses</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleAddressSelect(savedAddresses[parseInt(e.target.value)]);
                        }}
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-[#E60000] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-black">Add new address...</option>
                        {savedAddresses.map((addr, idx) => (
                          <option key={idx} value={idx} className="bg-black text-white">
                            {addr.firstName} {addr.lastName} - {addr.address}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <form id="checkout-shipping-form" className="space-y-5" onSubmit={handleShippingSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">First Name <span className="text-red-500">*</span></label>
                        <input required id="firstName" type="text" placeholder="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Name <span className="text-red-500">*</span></label>
                        <input required id="lastName" type="text" placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address <span className="text-red-500">*</span></label>
                      <input required id="email" type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number <span className="text-red-500">*</span></label>
                      <div className="flex-1 flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#E60000] transition-all">
                        <span className="bg-white/10 px-4 py-4 text-gray-400 border-r border-white/10 flex items-center font-bold">+91</span>
                        <input
                          required
                          id="phone"
                          type="tel"
                          placeholder="MOBILE NUMBER"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="flex-1 p-3 bg-transparent text-white outline-none placeholder:text-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Location</label>
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
                                showAlert('Location Saved', 'Location captured successfully!', 'success');
                              },
                              (error) => {
                                showAlert('Location Error', 'Unable to capture coordinates automatically.', 'warning');
                              }
                            );
                          } else {
                            showAlert('Not Supported', 'Geolocation is not supported by your browser. Please select on the map.', 'warning');
                          }
                        }}
                        className={`w-full p-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all mb-4 ${formData.latitude && formData.longitude
                          ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#E60000] hover:text-[#E60000]'
                          }`}
                      >
                        {formData.latitude && formData.longitude ? (
                          <span className="flex items-center justify-center gap-3">
                            <Icons.CheckCircle className="w-5 h-5" />
                            Location Detected
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            <Icons.MapPin className="w-5 h-5" />
                            Auto-Detect My Location
                          </span>
                        )}
                      </button>
                    </div>   {/* Map for manual selection */}
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
                      <p className="text-xs text-green-500 font-black mt-2 bg-green-500/10 p-3 rounded-2xl border border-green-500/20">
                        ✓ Location Locked: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                      </p>
                    )}

                    {/* Rewards & Coupons Section (Only for Logged In Users) */}
                    {user && (
                      <div className="space-y-4 mb-6 pt-4 border-t border-gray-100">
                        {/* Points Redemption */}
                        {userPoints > 0 && (
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-amber-100 p-1.5 rounded-full">
                                  <Icons.Star className="w-4 h-4 text-amber-600 fill-current" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800">Use Reward Points</p>
                                  <p className="text-xs text-gray-600">You have {userPoints} points (Worth &#8377;{pointsValue})</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={useRewards}
                                  onChange={(e) => setUseRewards(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                              </label>
                            </div>
                            {useRewards && (
                              <p className="text-xs text-green-700 font-medium ml-8">
                                Applied: &#8377;{Math.min(pointsValue, finalTotal + totalDiscount)} discount
                                {/* Note: Added totalDiscount back to compare against base total, or just use logic in render */}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Coupons */}
                        <div className="bg-gradient-to-br from-white to-rose-50/50 p-4 rounded-xl border border-rose-100/60 shadow-sm">
                          <label className="block text-sm font-bold text-rose-950 mb-2 flex items-center gap-2">
                            <Icons.Tag className="w-4 h-4 text-rose-600" />
                            Have a Coupon?
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#E60000] uppercase font-medium tracking-wide placeholder:normal-case placeholder:font-normal"
                              maxLength={6}
                              disabled={!!appliedCoupon}
                            />
                            {appliedCoupon ? (
                              <button
                                onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                                className="px-4 py-2 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-200 transition-colors"
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (couponCode.length !== 6) return;
                                  setVerifyingCoupon(true);

                                  // 1. Check global status
                                  const { data, error } = await supabase.from('coupons').select('*').eq('code', couponCode).eq('is_active', true).single();

                                  if (data) {
                                    // 2. Check user-specific status if logged in
                                    if (user && !user.id.startsWith('otp_')) {
                                      const { data: userCoupon } = await supabase
                                        .from('user_coupons')
                                        .select('status')
                                        .eq('user_id', user.id)
                                        .eq('coupon_code', couponCode)
                                        .single();

                                      if (userCoupon && userCoupon.status === 'used') {
                                        showAlert('Coupon Used', 'You have already used this coupon.', 'error');
                                        setVerifyingCoupon(false);
                                        return;
                                      }
                                    }

                                    showAlert('Coupon Applied!', `${data.discount_percent}% Discount Applied`, 'success');
                                    setAppliedCoupon({ code: data.code, percent: data.discount_percent });
                                  } else {
                                    showAlert('Invalid Coupon', 'This code is invalid or expired.', 'error');
                                  }
                                  setVerifyingCoupon(false);
                                }}
                                disabled={verifyingCoupon || couponCode.length !== 6}
                                className="px-5 py-2 whitespace-nowrap bg-[#E60000] text-white text-xs font-black rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-100 hover:shadow-xl hover:shadow-red-200 transition-all duration-300 transform hover:-translate-y-0.5 uppercase tracking-wider shrink-0"
                              >
                                {verifyingCoupon ? '...' : 'Apply'}
                              </button>
                            )}
                          </div>
                          {appliedCoupon && (
                            <p className="text-xs text-green-600 font-bold mt-2">
                              ✅ {appliedCoupon.percent}% OFF Applied!
                            </p>
                          )}

                          {/* Quick Select Coupons Wallet */}
                          {user && userCoupons.length > 0 && !appliedCoupon && (
                            <div className="mt-4 pt-3 border-t border-rose-100/50">
                              <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2 flex items-center gap-1.5">
                                <Icons.Wallet className="w-3 h-3" />
                                Your Coupon Wallet
                              </p>
                              <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 scrollbar-none">
                                {userCoupons.map((uc) => (
                                  <button
                                    key={uc.id}
                                    onClick={() => {
                                      setAppliedCoupon({ code: uc.coupon.code, percent: uc.coupon.discount_percent });
                                      setCouponCode(uc.coupon.code);
                                      showAlert('Applied from Wallet!', `${uc.coupon.discount_percent}% Discount Applied`, 'success');
                                    }}
                                    className="flex-shrink-0 bg-white border border-rose-200 rounded-lg p-2.5 hover:border-[#E60000] hover:shadow-md transition-all group flex flex-col items-center min-w-[100px]"
                                  >
                                    <span className="text-sm font-black text-rose-600 group-hover:text-[#E60000]">
                                      {uc.coupon.discount_percent}% OFF
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">
                                      Use Code: {uc.coupon.code}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Address <span className="text-red-500">*</span></label>
                        <input required id="address" type="text" placeholder="HOUSE NO, STREET, AREA" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">City <span className="text-red-500">*</span></label>
                          <input required id="city" type="text" placeholder="CITY" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">State <span className="text-red-500">*</span></label>
                          <input required id="state" type="text" placeholder="STATE" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Zip Code <span className="text-red-500">*</span></label>
                        <input required id="zipCode" type="text" placeholder="ENTER 6 DIGIT ZIP CODE" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-white focus:ring-2 focus:ring-[#E60000] outline-none transition-all placeholder:text-gray-600 font-bold" />
                      </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Delivery Speed</p>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 border rounded-2xl bg-[#E60000]/5 border-[#E60000]/30 shadow-[0_0_15px_rgba(230,0,0,0.1)]">
                          <div className="flex items-center gap-4">
                            <input type="radio" name="deliverySpeed" checked={true} readOnly className="accent-[#E60000] w-4 h-4" />
                            <div>
                              <span className="font-black text-white text-xs uppercase tracking-widest block">Standard Delivery</span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Estimated: 3-5 Days</span>
                            </div>
                          </div>
                          <span className="text-green-500 font-black text-xs uppercase tracking-widest">FREE</span>
                        </label>
                      </div>
                    </div>

                    {/* Gift Wrapping Section */}
                    <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Free Gift Wrapping</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${giftWrapping === 'none' ? 'bg-[#E60000]/5 border-[#E60000]/30 shadow-[0_0_15px_rgba(230,0,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="giftWrapping" checked={giftWrapping === 'none'} onChange={() => setGiftWrapping('none')} className="accent-[#E60000] w-4 h-4" />
                            <div>
                              <span className="font-black text-white text-xs uppercase tracking-widest block">No Wrapping</span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter italic">Default packaging</span>
                            </div>
                          </div>
                        </label>

                        <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${giftWrapping === 'plastic' ? 'bg-[#E60000]/5 border-[#E60000]/30 shadow-[0_0_15px_rgba(230,0,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="giftWrapping" checked={giftWrapping === 'plastic'} onChange={() => setGiftWrapping('plastic')} className="accent-[#E60000] w-4 h-4" />
                            <div>
                              <span className="font-black text-white text-xs uppercase tracking-widest block flex items-center gap-2">Designer Plastic <Icons.Gift className="w-3 h-3 text-[#E60000]" /></span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Premium look</span>
                            </div>
                          </div>
                          <span className="text-green-500 font-black text-xs uppercase tracking-widest">FREE</span>
                        </label>

                        <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${giftWrapping === 'paper' ? 'bg-[#E60000]/5 border-[#E60000]/30 shadow-[0_0_15px_rgba(230,0,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="giftWrapping" checked={giftWrapping === 'paper'} onChange={() => setGiftWrapping('paper')} className="accent-[#E60000] w-4 h-4" />
                            <div>
                              <span className="font-black text-white text-xs uppercase tracking-widest block flex items-center gap-2">Eco Paper <Icons.Gift className="w-3 h-3 text-[#E60000]" /></span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Eco friendly</span>
                            </div>
                          </div>
                          <span className="text-green-500 font-black text-xs uppercase tracking-widest">FREE</span>
                        </label>
                      </div>
                    </div>

                    {user && (
                      <label className="flex items-center gap-3 mt-6 cursor-pointer group">
                        <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-5 h-5 accent-[#E60000] rounded-lg" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Save Address for Future Orders</span>
                      </label>
                    )}

                    {/* Desktop button - hidden on mobile */}
                    <button type="submit" className="hidden lg:block w-full bg-[#E60000] text-white py-3.5 rounded-xl font-black hover:bg-red-800 transition-all shadow-[0_10px_20px_rgba(230,0,0,0.2)] active:scale-[0.98] mt-4 uppercase tracking-widest text-sm">Continue to Payment</button>
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
                  className="w-full bg-white/5 backdrop-blur-xl p-4 md:p-12 rounded-[2rem] shadow-2xl border border-white/10"
                >
                  <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Icons.CreditCard className="text-[#E60000]" />
                    Payment Method
                  </h2>
                  <form id="checkout-payment-form" onSubmit={handlePayment}>

                    {/* UPI Option */}
                    <div className={`mb-4 transition-all ${paymentMethod === 'upi' ? 'bg-white/10 rounded-2xl border border-[#E60000]/30 shadow-[0_0_20px_rgba(230,0,0,0.1)]' : 'bg-white/5 opacity-60 rounded-2xl border border-white/5 hover:opacity-80'}`}>
                      <label className="flex items-center gap-3 p-5 cursor-pointer w-full">
                        <input type="radio" name="payment" className="w-5 h-5 text-[#E60000] accent-[#E60000]" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                        <div className="flex flex-col">
                          <span className="font-black text-white flex items-center gap-2 text-lg tracking-tight uppercase"><Icons.Smartphone className="w-5 h-5 text-[#E60000]" /> UPI Payment</span>
                          <span className="text-[10px] text-gray-500 font-black ml-7 uppercase tracking-widest">GPay, PhonePe, Paytm</span>
                        </div>
                      </label>

                      {paymentMethod === 'upi' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4 pt-1">
                          <div className="h-px bg-white/10 mb-6" />

                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">1. Select Destination</p>
                          <div className="flex flex-col md:flex-row gap-3 mb-8">
                            <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${upiOption === 'abhishek' ? 'border-[#E60000] bg-[#E60000]/10 shadow-[0_0_15px_rgba(230,0,0,0.2)]' : 'border-white/10 bg-white/5'}`}>
                              <input type="radio" name="upiOption" value="abhishek" checked={upiOption === 'abhishek'} onChange={() => setUpiOption('abhishek')} className="w-4 h-4 accent-[#E60000]" />
                              <span className="font-black text-white text-sm uppercase tracking-wider">Abhishek</span>
                            </label>
                            <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${upiOption === 'raj' ? 'border-[#E60000] bg-[#E60000]/10 shadow-[0_0_15px_rgba(230,0,0,0.2)]' : 'border-white/10 bg-white/5'}`}>
                              <input type="radio" name="upiOption" value="raj" checked={upiOption === 'raj'} onChange={() => setUpiOption('raj')} className="w-4 h-4 accent-[#E60000]" />
                              <span className="font-black text-white text-sm uppercase tracking-wider">Raj</span>
                            </label>
                          </div>

                          <p className="text-[10px] font-black text-gray-400 border-l-2 border-[#E60000] pl-2 uppercase tracking-widest mb-4">2. Scan QR Code</p>
                          <div className="flex flex-col items-center">
                            <div className="bg-white p-3 rounded-2xl mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] group">
                              <img
                                src={upiOption === 'abhishek' ? "/upi-qr.png" : "/raj-qr.jpg"}
                                alt="UPI QR Code"
                                className="w-56 h-56 object-contain group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="w-full space-y-4">
                              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 group">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="bg-[#E60000] p-2 rounded-lg">
                                    <Icons.Upload className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest">3. Upload Receipt</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Required for payment confirmation</p>
                                  </div>
                                </div>
                                <input type="file" id="screenshot-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                                <label htmlFor="screenshot-upload" className="block w-full text-center py-4 px-6 rounded-xl bg-white/10 text-white font-black cursor-pointer hover:bg-[#E60000] transition-all active:scale-[0.98] text-xs uppercase tracking-[0.2em] border border-white/10">
                                  {screenshot ? 'Change Receipt' : 'Upload Payment Proof'}
                                </label>
                              </div>

                              {screenshot && (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 flex items-center gap-4">
                                  <img src={screenshot} alt="Screenshot" className="h-16 w-16 object-cover rounded-xl shadow-lg border border-green-500/30" />
                                  <div>
                                    <p className="text-xs text-green-400 font-black uppercase tracking-widest">Receipt Attached</p>
                                    <p className="text-[10px] text-green-500/70 font-bold">Verifying payment.</p>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* COD Option */}
                    <div className={`mb-4 transition-all ${paymentMethod === 'cod' ? 'bg-white/10 rounded-2xl border border-[#E60000]/30 shadow-[0_0_20px_rgba(230,0,0,0.1)]' : 'bg-white/5 opacity-60 rounded-2xl border border-white/5 hover:opacity-80'}`}>
                      <label className="flex items-center gap-3 p-5 cursor-pointer w-full">
                        <input type="radio" name="payment" className="w-5 h-5 text-[#E60000] accent-[#E60000]" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                        <div className="flex flex-col">
                          <span className="font-black text-white flex items-center gap-2 text-lg tracking-tight uppercase"><Icons.Banknote className="w-5 h-5 text-[#E60000]" /> Cash on Delivery (COD)</span>
                          <span className="text-[10px] text-gray-500 font-black ml-7 uppercase tracking-widest">Pay at your doorstep</span>
                        </div>
                      </label>
                      {paymentMethod === 'cod' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-6 pb-6 pt-1">
                          <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20 flex items-start gap-4">
                            <div className="bg-green-500/20 p-2 rounded-full"><Icons.ShieldCheck className="w-5 h-5 text-green-400" /></div>
                            <div>
                              <p className="text-sm text-white font-black uppercase tracking-widest">Safe Delivery</p>
                              <p className="text-[10px] text-green-500/70 font-bold uppercase tracking-tight mt-1">Payment upon successful delivery.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Desktop button - hidden on mobile */}
                    <button type="submit" disabled={processing} className="hidden lg:flex w-full bg-green-600 text-white py-3.5 rounded-2xl font-black shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-[0.2em] text-sm hover:scale-[1.02] transition-all">
                      {processing ? <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full" /> :
                        (paymentMethod === 'cod' ?
                          <span>Place Order - &#8377;{finalTotal.toLocaleString()}</span> :
                          <span>Confirm Payment - &#8377;{finalTotal.toLocaleString()}</span>)
                      }
                    </button>
                    <button type="button" onClick={() => setCurrentStep(0)} className="w-full mt-4 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] hover:text-[#E60000] transition-colors">Back to Shipping</button>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: CONFIRMATION */}
              {currentStep === 2 && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-xl p-10 md:p-16 rounded-[2.5rem] shadow-2xl border border-white/10 text-center flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(34,197,94,0.2)]"
                  >
                    <Icons.CheckCircle className="w-16 h-16 text-green-500" />
                  </motion.div>
                  <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-[0.1em]">Order Placed!</h2>
                  <p className="text-gray-400 font-medium italic mb-8">Your order has been placed. You will receive a confirmation email soon.</p>

                  {/* Delivery Car Animation */}
                  <div className="w-full max-w-xl mb-12 opacity-80">
                    <DeliveryCarAnimation />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest mb-10">
                    <p className="mb-1">Order Confirmed</p>
                    <p>Details sent to: {formData.email}</p>
                  </div>
                  <button onClick={() => navigate('/account')} className="bg-white/5 text-white border border-white/10 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-[#E60000] hover:border-[#E60000] hover:shadow-[0_0_30px_rgba(230,0,0,0.4)] transition-all active:scale-95">
                    My Orders
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          {currentStep < 2 && (
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 h-fit shadow-2xl sticky top-28">
              <h3 className="font-black text-white text-lg mb-8 uppercase tracking-[0.2em]">Order Summary</h3>
              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 bg-white/5 rounded-xl border border-white/10 overflow-hidden shrink-0 group">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <span className="absolute top-0 right-0 bg-[#E60000] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-bl-xl shadow-lg">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white text-xs uppercase tracking-widest line-clamp-1">{item.name}</h4>
                      <p className="text-gray-500 text-[10px] font-bold mt-1 uppercase tracking-tighter italic">{item.category}</p>
                    </div>
                    <span className="font-black text-white text-sm">&#8377;{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-6 space-y-4">
                {(() => {
                  const marketPriceTotal = cart.reduce((sum, item) => {
                    const marketPrice = item.marketPrice || item.price;
                    return sum + (marketPrice * item.quantity);
                  }, 0);
                  const totalSavings = marketPriceTotal - cartTotal;
                  const hasDiscount = totalSavings > 0;

                  return (
                    <>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span>Subtotal</span>
                        <span>&#8377;{marketPriceTotal.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Delivery Charges</span>
                        <span className="text-green-500">FREE</span>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#E60000]">
                          <span>Coupon Discount ({appliedCoupon?.code})</span>
                          <span>- &#8377;{couponDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      {pointsDiscount > 0 && (
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#E60000]">
                          <span>Points Used</span>
                          <span>- &#8377;{pointsDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="h-px bg-white/5 my-6"></div>

                      <div className="flex justify-between items-center">
                        <span className="font-black text-white uppercase tracking-[0.25em] text-sm text-gray-400">Grand Total</span>
                        <span className="font-black text-white text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">&#8377;{finalTotal.toLocaleString()}</span>
                      </div>

                      {hasDiscount && (
                        <div className="bg-[#E60000]/10 border border-[#E60000]/20 rounded-2xl p-4 mt-8">
                          <div className="flex items-center justify-between">
                            <span className="text-[#E60000] font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                              Total Savings
                            </span>
                            <span className="text-[#E60000] font-black text-xl">&#8377;{totalSavings.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Submit Buttons */}
        {currentStep < 2 && (
          <div className="lg:hidden mt-8 mb-20 px-2">
            {currentStep === 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.getElementById('checkout-shipping-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="w-full bg-[#E60000] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(230,0,0,0.4)] active:scale-95 transition-all text-sm"
              >
                Continue to Payment
              </button>
            )}
            {currentStep === 1 && (
              <div className="space-y-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const form = document.getElementById('checkout-payment-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  disabled={processing}
                  className="w-full bg-[#E60000] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(230,0,0,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 text-sm"
                >
                  {processing ? <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full" /> :
                    (paymentMethod === 'cod' ?
                      <span>Place Order - &#8377;{finalTotal.toLocaleString()}</span> :
                      <span>Confirm Payment - &#8377;{finalTotal.toLocaleString()}</span>)
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="w-full text-gray-500 font-black uppercase tracking-widest text-[10px] hover:text-[#E60000]"
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
    </div >
  );
};