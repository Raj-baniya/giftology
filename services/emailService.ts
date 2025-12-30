import emailjs from '@emailjs/browser';

// EmailJS Configuration for Order Confirmations (Account 1)
const SERVICE_ID = 'service_ue7z1qz';
const TEMPLATE_ID_USER = 'template_eooq0yo';
const TEMPLATE_ID_ADMIN = 'template_9wwxekk';
const PUBLIC_KEY = 'mGC5aKS4OMTxdYz5W';

// EmailJS Configuration for Mobile/OTP (Account 2)
const MOBILE_SERVICE_ID = 'service_k09aipq';
const TEMPLATE_ID_OTP = 'template_hria60l';
const MOBILE_PUBLIC_KEY = 'SGkjyZ1R5BvytZwyM';
// Welcome Template ID (Specific to Account 2)
const WELCOME_TEMPLATE_ID = 'template_hdafjgo';

// EmailJS doesn't require explicit initialization in v4+
// Public key is passed directly to send() method
// But we'll ensure it's available for compatibility
console.log('EmailJS Order Service initialized:', PUBLIC_KEY ? '✓' : '✗');
console.log('EmailJS Mobile Service initialized:', MOBILE_PUBLIC_KEY ? '✓' : '✗');
console.log('EmailJS Config Version: 2025-11-24 v10 (Complete Rewrite)');

export interface OrderEmailParams {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderTotal: string;
  paymentMethod: string;
  deliveryDetails: string;
  orderItems?: string;
  view_order_url?: string;
  // Additional fields for complete order information
  delivery_date?: string;
  expected_delivery?: string;
  delivery_speed?: string;
  gift_wrapping?: string;
  shipping_address?: string;
  invoice_html?: string;
}

/**
 * Send order confirmation email to user
 */
export const sendOrderConfirmationToUser = async (params: OrderEmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Attempting to send order confirmation to user:', params.customerEmail);

    const userEmailParams = {
      // Standard fields
      to_name: params.customerName ? params.customerName.split(' ')[0] : 'Customer',
      to_email: params.customerEmail,

      // Fallback fields to ensure compatibility
      customer_name: params.customerName,
      user_name: params.customerName,
      name: params.customerName,

      email: params.customerEmail.trim(),
      user_email: params.customerEmail.trim(),
      recipient_email: params.customerEmail.trim(),
      customer_email: params.customerEmail.trim(),
      send_to: params.customerEmail.trim(),
      target_email: params.customerEmail.trim(),
      reply_to: 'giftology.in14@gmail.com',

      // Add MISSING fields that caused "Half Filled" email
      customer_phone: params.customerPhone,
      payment_method: params.paymentMethod,
      delivery_details: params.deliveryDetails,

      order_total: params.orderTotal,
      delivery_date: params.delivery_date || params.deliveryDetails.split('|')[0]?.trim() || 'TBD',
      expected_delivery: params.expected_delivery || '',
      delivery_speed: params.delivery_speed || 'Standard Delivery',
      gift_wrapping: params.gift_wrapping || 'No Wrapping',
      shipping_address: params.shipping_address || '',
      order_items: params.orderItems || '',
      invoice_html: params.invoice_html || '',
      message: `Thank you for your order! We will deliver it as per the scheduled date.`,
      view_order_url: 'https://giftology-in.web.app/account' // Production link to Account page
    };

    console.log('📧 User email params:', userEmailParams);
    console.log('📧 Using Service ID:', SERVICE_ID);
    console.log('📧 Using Template ID:', TEMPLATE_ID_USER);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID_USER, userEmailParams, PUBLIC_KEY);

    if (response.status === 200) {
      console.log('✅ User confirmation email sent successfully!');
      return { success: true };
    } else {
      throw new Error(`EmailJS returned status: ${response.status}`);
    }

  } catch (error: any) {
    console.error('❌ Failed to send user confirmation email:', error);
    console.error('❌ Error details:', {
      status: error?.status,
      text: error?.text,
      message: error?.message,
      name: error?.name
    });
    return {
      success: false,
      error: error?.text || error?.message || 'Unknown error occurred'
    };
  }
};

/**
 * Send new order notification email to admin
 */
export const sendOrderNotificationToAdmin = async (params: OrderEmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Attempting to send order notification to admin');

    const adminEmail = 'giftology.in14@gmail.com';

    const adminEmailParams = {
      to_email: adminEmail,

      // Fallback fields
      email: adminEmail,
      user_email: adminEmail,
      recipient_email: adminEmail,

      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
      order_total: params.orderTotal,
      payment_method: params.paymentMethod,
      delivery_details: params.deliveryDetails,
      delivery_date: params.delivery_date || '',
      expected_delivery: params.expected_delivery || '',
      delivery_speed: params.delivery_speed || 'Standard Delivery',
      gift_wrapping: params.gift_wrapping || 'No Wrapping',
      shipping_address: params.shipping_address || '',
      order_items: params.orderItems || '',
      message: 'New Order Received! Check Admin Panel for details.'
    };

    console.log('📧 Admin email params:', adminEmailParams);
    console.log('📧 Using Service ID:', SERVICE_ID);
    console.log('📧 Using Template ID:', TEMPLATE_ID_ADMIN);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID_ADMIN, adminEmailParams, PUBLIC_KEY);

    if (response.status === 200) {
      console.log('✅ Admin order notification email sent successfully!');
      return { success: true };
    } else {
      throw new Error(`EmailJS returned status: ${response.status}`);
    }

  } catch (error: any) {
    console.error('❌ Failed to send admin order notification email:', error);
    console.error('❌ Error details:', {
      status: error?.status,
      text: error?.text,
      message: error?.message,
      name: error?.name
    });
    return {
      success: false,
      error: error?.text || error?.message || 'Unknown error occurred'
    };
  }
};

/**
 * Send OTP to user via Email
 * Uses the Second EmailJS Service (Mobile Service) with specific OTP Template
 */
export const sendOtpToUser = async (name: string, email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Attempting to send OTP to user:', email);

    const otpEmailParams = {
      to_name: name,
      to_email: email,
      email: email,           // Fallback 1
      user_email: email,      // Fallback 2
      recipient_email: email, // Fallback 3
      otp: otp,
      message: `Your One-Time Password (OTP) for Giftology verification is: ${otp}. Do not share this with anyone.`
    };

    // Use MOBILE_SERVICE_ID and TEMPLATE_ID_OTP
    const response = await emailjs.send(MOBILE_SERVICE_ID, TEMPLATE_ID_OTP, otpEmailParams, MOBILE_PUBLIC_KEY);

    if (response.status === 200) {
      console.log('✅ OTP email sent successfully!');
      return { success: true };
    } else {
      throw new Error(`EmailJS returned status: ${response.status}`);
    }

  } catch (error: any) {
    console.error('❌ Failed to send OTP email:', error);
    return {
      success: false,
      error: error?.text || error?.message || 'Unknown error occurred'
    };
  }
};

/**
 * Send Welcome Email to new user
 * Uses the Second EmailJS Service (Mobile Service) with Welcome Template
 */
export const sendWelcomeEmail = async (name: string, email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Attempting to send Welcome Email to user:', email);

    const welcomeEmailParams = {
      user_name: name,
      to_name: name,          // Fallback

      // Target Email Candidates - One of these MUST match the template's "To Email" field
      to_email: email,
      user_email: email,      // Fallback
      recipient_email: email, // Fallback
      email: email,           // Common default
      customer_email: email,  // Used in other templates

      message: "Welcome to Giftology! We're excited to have you."
    };

    // Using the global constants which have been updated with the correct credentials
    const response = await emailjs.send(MOBILE_SERVICE_ID, WELCOME_TEMPLATE_ID, welcomeEmailParams, MOBILE_PUBLIC_KEY);

    if (response.status === 200) {
      console.log('✅ Welcome email sent successfully!');
      return { success: true };
    } else {
      throw new Error(`EmailJS returned status: ${response.status}`);
    }

  } catch (error: any) {
    console.error('❌ Failed to send Welcome email:', error);
    return {
      success: false,
      error: error?.text || error?.message || 'Unknown error occurred'
    };
  }
};
