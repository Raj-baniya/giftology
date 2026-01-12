# 🎁 GiftGalaxy - Premium Gift E-commerce Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite)](https://vitejs.dev/)

> A modern, feature-rich e-commerce platform for personalized gifts and special occasions.

## ✨ Features

### 🛍️ **Shopping Experience**
- **Infinite Scroll Menu**: Smooth, infinite horizontal product browsing
- **Product Categories**: 20+ curated categories (Birthdays, Anniversaries, Weddings, Festivals, etc.)
- **Advanced Search**: Real-time product search with filtering
- **Product Details**: Beautiful stacked image gallery with zoom functionality
- **Gift Guide**: Interactive quiz to help customers find the perfect gift

### 🎨 **UI/UX**
- **Click Spark Animation**: Delightful particle effects on every click
- **Custom Alerts**: Beautiful, animated modal alerts (replacing browser alerts)
- **Animated Backgrounds**: Dynamic gradient blobs and particle effects
- **Light Rays Effect**: Premium background animations on product pages
- **Circular Product Images**: Modern, aesthetic product card design
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop

### 🔐 **Authentication**
- **Email/Password Login**: Traditional authentication
- **OTP Login**: Passwordless authentication via email
- **Guest Checkout**: Order without creating an account
- **User Profiles**: Manage orders, addresses, and account settings

### 🛒 **Shopping Cart & Checkout**
- **Persistent Cart**: Cart saved across sessions
- **Fast Delivery Option**: Priority shipping available
- **Multiple Payment Methods**: UPI, Card, Net Banking support
- **Order Tracking**: Real-time order status updates
- **Address Management**: Save and manage multiple delivery addresses

### 👨‍💼 **Admin Dashboard**
- **Product Management**: Add, edit, delete products with image upload
- **Inventory Control**: Track stock levels and trending items
- **Order Management**: View, update, and process orders
- **User Management**: Track customer orders and spending
- **Sales Analytics**: Track revenue, costs, and profit margins
- **Real-time Updates**: Automatic refresh for new orders

### 📧 **Email Notifications**
- Welcome emails for new users
- Order confirmation emails
- OTP verification emails
- Admin notifications for new orders

## 🚀 Tech Stack

### **Frontend**
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Advanced animations
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library

### **Backend & Database**
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication

### **Services**
- **EmailJS** - Email delivery service
- **Firebase Hosting** - Production deployment

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Clone the Repository
```bash
git clone https://github.com/Raj-baniya/giftology.git
cd giftology
```

### Install Dependencies
```bash
npm install
```

### Environment Setup
Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# EmailJS Configuration
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_ORDER_TEMPLATE_ID=your_order_template_id
VITE_EMAILJS_WELCOME_TEMPLATE_ID=your_welcome_template_id
VITE_EMAILJS_OTP_TEMPLATE_ID=your_otp_template_id
VITE_EMAILJS_MOBILE_TEMPLATE_ID=your_mobile_template_id
```

### Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🗄️ Database Setup

### Supabase Tables

The application uses the following tables:

1. **`products`** - Product catalog
2. **`orders`** - Customer orders
3. **`user_profiles`** - User information
4. **`categories`** - Product categories
5. **`contact_messages`** - Contact form submissions

### Key Features
- **Row Level Security (RLS)**: Secure data access
- **Real-time Subscriptions**: Live order updates
- **Foreign Key Constraints**: Data integrity
- **Triggers**: Automated profile creation

## 🎨 Customization

### Brand Colors
Edit the primary color in `tailwind.config.js`:
```javascript
colors: {
  primary: '#E94E77', // Your brand color
}
```

### Email Templates
Configure your email templates in EmailJS dashboard:
- Order confirmation template
- Welcome email template
- OTP verification template

## 📱 Deployment

### Firebase Hosting

1. **Install Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Initialize Firebase** (if not already done):
```bash
firebase init
```

4. **Build the Project**:
```bash
npm run build
```

5. **Deploy**:
```bash
firebase deploy
```

Your site will be live at `https://your-project.web.app`

## 🔒 Admin Access

Admin users are defined by email in the code:
```typescript
const ADMIN_EMAILS = ['admin@example.com'];
```

To add admin access, update the `ADMIN_EMAILS` array in `pages/Admin.tsx`.

## 📁 Project Structure

```
giftology/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── AnimatedBackgrounds.tsx
│   ├── CartDrawer.tsx
│   ├── ClickSpark.tsx
│   ├── CustomAlert.tsx
│   ├── MobileNumberModal.tsx
│   ├── Navbar.tsx
│   └── ProductInfiniteMenu.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── hooks/             # Custom React hooks
├── pages/             # Page components
│   ├── Account.tsx
│   ├── Admin.tsx
│   ├── Checkout.tsx
│   ├── GiftGuide.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── ProductDetail.tsx
│   ├── Search.tsx
│   └── Shop.tsx
├── services/          # API and service layer
│   ├── emailService.ts
│   ├── store.ts
│   └── supabaseClient.ts
├── styles/            # Global styles
├── types.ts           # TypeScript types
├── App.tsx            # Main app component
└── index.tsx          # Entry point
```

## 🔧 Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production

# Preview
npm run preview      # Preview production build

# Deploy
firebase deploy      # Deploy to Firebase
```

## 🎯 Key Components

### **ProductInfiniteMenu**
Infinite horizontal scrolling menu with mouse/touch support.

### **ClickSpark**
Global click animation with particle effects.

### **CustomAlert**
Beautiful, animated alert system replacing browser alerts.

### **AnimatedBackgrounds**
- Gradient blobs for Checkout
- Particle background for Gift Guide
- Delivery car animation for order success

### **LightRays**
Premium background effect for product detail pages.

## 📊 Features Roadmap

- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Multiple image variants per product
- [ ] Social media integration
- [ ] Gift wrapping options
- [ ] Promotional codes and discounts
- [ ] Analytics dashboard
- [ ] Bulk order support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Raj Baniya**
- GitHub: [@Raj-baniya](https://github.com/Raj-baniya)
- Email: rajbaniya81083@gmail.com

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Amazing backend platform
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev/) - Beautiful icons
- [EmailJS](https://www.emailjs.com/) - Email service

## 📞 Support

For support, email rajbaniya81083@gmail.com or create an issue in the repository.

---

Made with ❤️ for making gift-giving special
