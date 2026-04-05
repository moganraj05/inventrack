/**
 * Export Service
 * Handles CSV export for various data types
 */

const downloadCSV = (data, filename) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const keys = Object.keys(data[0]);
  const header = keys.map(key => `"${key}"`).join(',');
  
  const rows = data.map(obj =>
    keys.map(key => {
      const value = obj[key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [header, ...rows].join('\n');
};

export const exportProducts = (products) => {
  const data = products.map(p => ({
    'Product Name': p.name,
    'SKU': p.sku,
    'Category': p.category?.name || 'N/A',
    'Price (₹)': p.price,
    'Cost Price (₹)': p.costPrice || '—',
    'Unit': p.unit,
    'Status': p.isActive ? 'Active' : 'Inactive',
    'Created': new Date(p.createdAt).toLocaleDateString('en-IN'),
    'Description': p.description || ''
  }));
  downloadCSV(data, 'products');
};

export const exportInventory = (stocks) => {
  const data = stocks.map(s => ({
    'Product Name': s.productName,
    'SKU': s.sku,
    'Quantity': s.quantity,
    'Available': s.available || s.quantity,
    'Reserved': s.reserved || 0,
    'Low Stock Threshold': s.lowStockThreshold,
    'Status': s.isLowStock ? 'Low Stock' : 'OK',
    'Location': s.location || 'Main Warehouse',
    'Last Updated': new Date(s.lastUpdated).toLocaleDateString('en-IN')
  }));
  downloadCSV(data, 'inventory');
};

export const exportTransactions = (transactions) => {
  const data = transactions.map(t => ({
    'Date': new Date(t.createdAt).toLocaleDateString('en-IN'),
    'Product': t.productName,
    'SKU': t.sku,
    'Type': t.type,
    'Quantity': t.quantity,
    'Before': t.quantityBefore,
    'After': t.quantityAfter,
    'Reason': t.reason || '—',
    'Performed By': t.performedByName || t.performedBy || '—',
    'Notes': t.notes || ''
  }));
  downloadCSV(data, 'transactions');
};

export const exportSuppliers = (suppliers) => {
  const data = suppliers.map(s => ({
    'Supplier Name': s.name,
    'Email': s.email,
    'Phone': s.phone || '—',
    'Contact Person': s.contactPerson || '—',
    'City': s.address?.city || '—',
    'State': s.address?.state || '—',
    'Country': s.address?.country || 'India',
    'Website': s.website || '—',
    'Category': s.category || '—',
    'Payment Terms': s.paymentTerms || 'Net 30',
    'Rating': s.rating || '—',
    'Status': s.isActive ? 'Active' : 'Inactive'
  }));
  downloadCSV(data, 'suppliers');
};
