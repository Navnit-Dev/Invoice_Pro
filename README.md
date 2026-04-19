# Invoice Generator SaaS

A full-stack Invoice Generator and Billing Management SaaS application built with Next.js, Material-UI, and MongoDB.

## Features

### Authentication & User System
- Secure JWT-based authentication using NextAuth
- User registration with store setup
- Multi-tenant architecture (each user manages their own data)

### Store Management
- Company profile setup (name, address, GST, contact details)
- Customizable invoice numbering with prefix
- Logo support

### Inventory Management
- Add/Edit/Delete products
- SKU-based product tracking
- Stock quantity management with low stock alerts
- Auto stock update after invoice generation
- Search and filter products

### Invoice Generation
- Multi-step invoice creation wizard
- Customer details management
- Product selection with quantity
- GST calculation (0%, 5%, 12%, 18%, 28% or custom)
- Shipping charges support
- Payment status tracking (Paid, Pending, Partial)

### PDF Export
- Professional PDF invoice generation using jsPDF
- Barcode generation on each invoice
- Print-ready format

### Barcode Scanning
- Scan invoices using camera or manual input
- Quick invoice lookup by barcode/invoice number

### Invoice History
- Search by invoice number or customer name
- Filter by payment status and date range
- CSV and Excel export functionality
- Pagination support

### Dashboard Analytics
- Monthly and total revenue
- Payment status breakdown
- Low stock alerts
- Recent invoices list
- Sales trends chart

### UI/UX
- Mobile-first responsive design
- Dark/Light theme toggle
- Smooth animations with Framer Motion
- Material-UI components
- PWA support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, JavaScript
- **UI Library**: Material-UI (MUI) v5
- **Animations**: GSAP, Framer Motion
- **Icons**: MUI Icons, Lucide React
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: NextAuth.js with JWT
- **PDF Generation**: jsPDF with autotable
- **Barcode**: react-barcode
- **Forms**: React Hook Form with Yup validation
- **Export**: json2csv, xlsx

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd billing_software
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/billing_software
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-change-in-production
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running locally or use MongoDB Atlas connection string.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Folder Structure

```
billing_software/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── dashboard/    # Dashboard stats
│   │   ├── export/       # CSV/Excel export
│   │   ├── invoices/     # Invoice CRUD
│   │   ├── products/     # Product CRUD
│   │   └── store/        # Store settings
│   ├── dashboard/        # Dashboard page
│   ├── inventory/        # Inventory management
│   ├── invoices/         # Invoice pages
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── settings/         # Store settings
│   └── page.js           # Home redirect
├── components/           # Reusable components
│   ├── BarcodeScanner.jsx
│   └── Layout/
│       └── MainLayout.jsx
├── lib/                  # Utilities
│   ├── auth.js
│   └── mongodb.js
├── models/               # Mongoose models
│   ├── Invoice.js
│   ├── Product.js
│   ├── Store.js
│   └── User.js
├── public/              # Static files
│   └── manifest.json    # PWA manifest
├── middleware.js        # Auth middleware
├── next.config.mjs      # Next.js config with PWA
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with store
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Store
- `GET /api/store` - Get store details
- `PUT /api/store` - Update store settings

### Products
- `GET /api/products` - List products (with search/filter)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Invoices
- `GET /api/invoices` - List invoices (with pagination, search, filters)
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/scan?barcode=XXX` - Scan invoice by barcode

### Export
- `GET /api/export/csv` - Export invoices to CSV
- `GET /api/export/excel` - Export invoices to Excel

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Usage Guide

### First Time Setup
1. Register a new account (this creates your store)
2. Go to Settings to customize your store details
3. Add products to your inventory
4. Create your first invoice

### Creating an Invoice
1. Navigate to "Create Invoice"
2. Enter customer details
3. Add products from your inventory
4. Set GST rate and shipping charges
5. Review and generate the invoice
6. Download PDF or share

### Managing Inventory
1. Go to "Inventory" page
2. Click "Add Product" to add new items
3. Edit or delete existing products
4. Watch for low stock alerts on the dashboard

### Exporting Data
1. Go to "Invoice History"
2. Apply filters if needed
3. Click "Export CSV" or "Export Excel"
4. Download the file

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Production Deployment

1. Set up production environment variables
2. Update `NEXTAUTH_URL` to your domain
3. Use a strong random string for `NEXTAUTH_SECRET`
4. Deploy to Vercel or your preferred platform:
   ```bash
   npm run build
   npm start
   ```

## License

MIT License - feel free to use for personal or commercial projects.
