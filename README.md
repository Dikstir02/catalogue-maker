# Catalogue Builder

A standalone product catalogue management application built with React.

## Features

- **Product Management**: Add, edit, delete products with SKU, brand, name, category, images, and stock tracking
- **Advanced Filtering**: Search by name/SKU/category, multi-select brand/category filters, multi-SKU lookup
- **Sorting**: Sort by SKU, category, or stock
- **Batch Operations**: Edit, delete, update images, and update stocks in bulk
- **Import/Export**:
  - Bulk import from Excel with conflict detection
  - Export to Excel with embedded images
  - Export to PDF catalogue with product cards
- **Role-Based Access**: Admin, Manager, Exporter, and User roles
- **Admin Panel**: User management, catalogue config (brands/categories), change password, edit/export logs
- **Missing Items Detection**: Identify products missing images, brands, categories, or names

## Getting Started

```bash
npm install
npm run dev
```

### Default Login

- **Username**: `dexter`
- **Password**: `admin123`
- **Role**: admin

## Tech Stack

- React 18
- Vite 6
- Tailwind CSS 3 + shadcn/ui
- TanStack Query
- ExcelJS (Excel export)
- jsPDF (PDF export)
- Framer Motion (animations)
- LocalStorage (data persistence)