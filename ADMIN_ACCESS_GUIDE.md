# 🔐 Admin Dashboard - Option B (Integrated)

## ✅ Status: READY TO USE

Your admin dashboard is **fully integrated** into the main Mokine frontend at **localhost:3000** with protected routes.

---

## 🚀 Quick Start

### 1. Start the Backend
```powershell
cd c:\Users\EMMANUEL\vrai-frontend-mokine\server
npm run dev
```
✅ Backend will run on **http://localhost:5000**

### 2. Start the Frontend
```powershell
cd c:\Users\EMMANUEL\vrai-frontend-mokine
npm start
```
✅ Frontend will run on **http://localhost:3000**

### 3. Login as Admin
Navigate to: **http://localhost:3000/login**

**Test Credentials:**
```
Email:    admin@mokine.com
Password: admin123
```

---

## 📊 Admin Dashboard Pages

Access these pages after login with admin role:

| Page | Route | Features |
|------|-------|----------|
| **Dashboard** | `/admin/dashboard` | Stats, charts, alerts, activity |
| **Users** | `/admin/users` | User list, block/unblock, delete users |
| **Veterinarians** | `/admin/veterinarians` | Vet management, earnings tracking |
| **Payments** | `/admin/payments` | Payment history, refunds |
| **Products** | `/admin/products` | Product inventory, CRUD operations |
| **Settings** | `/admin/settings` | Admin configuration |

---

## 🔗 API Integration

All admin pages use the backend API endpoints:

```
GET    /api/admin/dashboard          ✅ Stats & overview
GET    /api/admin/users              ✅ User list
GET    /api/admin/veterinarians      ✅ Vet list
GET    /api/admin/payments           ✅ Payment history
GET    /api/admin/products           ✅ Product list
GET    /api/admin/settings           ✅ Configuration

POST   /api/admin/users/toggle-block ✅ Block/unblock user
DELETE /api/admin/users/:id          ✅ Delete user
POST   /api/admin/products           ✅ Add product
PUT    /api/admin/products/:id       ✅ Update product
DELETE /api/admin/products/:id       ✅ Delete product
POST   /api/admin/payments/refund    ✅ Process refund
```

---

## 🔒 Authentication

- JWT token stored in **localStorage**
- Token automatically injected in all API requests
- Protected routes verify JWT + admin role
- Token expires in 7 days
- Logout clears token and redirects to login

---

## 📁 Project Structure

```
src/
├── admin/
│   ├── pages/
│   │   ├── AdminDashboard.jsx       (Charts, stats, alerts)
│   │   ├── AdminUsers.jsx           (User management)
│   │   ├── AdminVeterinarians.jsx   (Vet management)
│   │   ├── AdminPayments.jsx        (Payment tracking)
│   │   ├── AdminProducts.jsx        (Inventory)
│   │   └── AdminSettings.jsx        (Configuration)
│   ├── components/
│   │   ├── AdminLayout.jsx          (Header + Sidebar wrapper)
│   │   ├── AdminSidebar.jsx         (Navigation menu)
│   │   ├── DataTable.jsx            (Reusable table)
│   │   └── StatBox.jsx              (Statistics card)
│   ├── ProtectedRoute.jsx           (JWT verification)
│   └── index.js                     (Exports)
├── API.js                           (Axios instance + endpoints)
└── index.js                         (Route registration)
```

---

## 🎨 Technologies Used

| Component | Library |
|-----------|---------|
| **UI Framework** | React 19 |
| **Routing** | React Router 7 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **HTTP** | Axios (with JWT) |
| **Animations** | Framer Motion |

---

## ⚙️ Configuration

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### JWT Configuration
- **Header**: `Authorization: Bearer <token>`
- **Storage**: `localStorage.getItem('token')`
- **Expiration**: 7 days
- **Scope**: Admin routes only

---

## 🧪 Testing with Mock Data

The backend includes mock data for testing:

**Admin User:**
```
ID: "admin-001"
Email: admin@mokine.com
Password: admin123 (hashed)
Role: admin
```

**Mock Data Available:**
- 10 sample users
- 5 sample veterinarians
- 20 sample products
- 15 sample payments
- Dashboard stats (aggregated)

---

## 🐛 Troubleshooting

### ❌ "Admin pages not showing"
**Solution:** 
1. Make sure you're logged in as admin role
2. Check localStorage has 'token' key
3. Verify JWT token is not expired
4. Backend must be running on :5000

### ❌ "Cannot fetch admin data"
**Solution:**
1. Verify backend is running: `npm run dev` in /server
2. Check network tab in DevTools for API errors
3. Ensure JWT token in localStorage
4. Check CORS configuration if getting 500 errors

### ❌ "Blank pages after login"
**Solution:**
1. Check browser console for errors
2. Verify routes are protected with `<ProtectedRoute>`
3. Ensure AdminLayout component is rendering
4. Check that API_BASE_URL is correct

---

## 📚 Next Steps

1. ✅ **Option B Implementation Complete**
   - Admin dashboard integrated into main frontend
   - All 6 pages ready
   - All routes protected
   - API endpoints connected

2. 🎯 **Customization (Optional)**
   - Modify Tailwind styles in components
   - Add additional features to pages
   - Create custom Material Design themes
   - Add more admin roles/permissions

3. 🚀 **Deployment**
   - Build with: `npm run build`
   - Deploy React app to hosting
   - Deploy backend to server
   - Update `REACT_APP_API_URL` for production

---

## 📞 Support

- **API Docs**: See `/server/src/routes/admin/` for endpoint details
- **Component docs**: Check JSDoc comments in component files
- **Frontend docs**: Review `src/admin/` folder structure

---

**Status**: 🟢 **READY FOR USE**

**Access Admin Dashboard**: http://localhost:3000/admin/dashboard (after login)

---

*Last Updated: March 3, 2026*
*Option B: Integrated Admin Dashboard (Tailwind CSS + Lucide React Icons)*
