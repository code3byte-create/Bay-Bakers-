import React, { useState } from 'react';
import { X, Image } from 'lucide-react';
import { Button } from './Button';
import { Input, Select } from './Input';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { apiUploadImage } from '../services/api';

export const ProductFormModal = ({ product, onSave, onClose }) => {
  const { categories } = useStore();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || '',
    categoryId: product?.categoryId || '',
    price: product?.price?.toString() || '',
    image: product?.image || '',
    description: product?.description || '',
    stock: product?.stock?.toString() || '',
    expiryDate: product?.expiryDate || ''
  });
  const [imgError, setImgError] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim() || !form.categoryId || !form.price || !form.stock || !form.description.trim()) {
      toast.warning('Please fill in Name, Category, Price, Stock, and Description.');
      return;
    }
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock);
    if (isNaN(price) || price <= 0) {
      toast.warning('Price must be a positive number.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.warning('Stock must be 0 or more.');
      return;
    }
    onSave({
      name: form.name.trim(),
      categoryId: form.categoryId,
      price,
      image: form.image.trim() || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      description: form.description.trim(),
      stock,
      expiryDate: form.expiryDate || undefined
    });
  };

  const showPreview = form.image.trim() && !imgError;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Input
            label="Product Name *"
            placeholder="e.g. Chocolate Éclair"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />

          <Select
            label="Category *"
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (PKR) *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
            <Input
              label="Stock Units *"
              type="number"
              min="0"
              placeholder="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-input-background resize-none text-sm"
              rows={3}
              placeholder="Brief product description..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product Image</label>
            <div className="flex gap-2">
              <Input
                placeholder="Image URL or Upload -->"
                value={form.image}
                onChange={(e) => {
                  set('image', e.target.value);
                  setImgError(false);
                }}
                className="flex-1"
              />
              <div className="relative">
                <input
                  type="file"
                  id="img-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploading(true);
                      const url = await apiUploadImage(file);
                      console.log('Uploaded URL:', url); // For debugging
                      set('image', url);
                      setImgError(false);
                      toast.success('Image uploaded');
                    } catch (err) {
                      toast.error(err.message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('img-upload').click()}
                  disabled={uploading}
                >
                  {uploading ? '...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>

          <div className="h-36 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
            {showPreview ? (
              <img
                src={form.image.trim()}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <Image size={32} />
                <span className="text-sm">Image preview</span>
              </div>
            )}
          </div>

          <Input
            label="Expiry Date"
            type="date"
            value={form.expiryDate}
            onChange={(e) => set('expiryDate', e.target.value)}
          />
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </div>
    </div>
  );
};
