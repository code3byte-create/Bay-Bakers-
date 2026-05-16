import React from 'react';
import { motion } from 'motion/react';

export const Receipt = ({ items, total, subtotal, discount, paymentMethod, customerName, customerPhone, onClose }) => {
  const receiptRef = React.useRef(null);

  const handlePrint = () => {
    const itemsHtml = items.map(it => `
      <tr>
        <td style="padding:4px 0;">${escapeHtml(it.product.name)}</td>
        <td style="padding:4px 0;text-align:center;">${it.quantity}</td>
        <td style="padding:4px 0;text-align:right;font-weight:600;">Rs.${(it.product.price * it.quantity).toFixed(2)}</td>
      </tr>`).join('');

    const html = `
<!DOCTYPE html>
<html><head><title>Bay Bakers Receipt</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 10mm; color: #000; background: #fff; }
  .wrap { width: 80mm; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; text-align: center; letter-spacing: -0.5px; }
  .sub { text-align: center; font-size: 9px; letter-spacing: 2px; color: #555; text-transform: uppercase; }
  .meta { text-align: center; font-size: 10px; margin: 10px 0; }
  .meta p { margin: 2px 0; }
  .hr { border-top: 1px dashed #999; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #ddd; padding: 4px 0; }
  th.c { text-align: center; } th.r { text-align: right; }
  td { border-bottom: 1px solid #f0f0f0; }
  .totals { font-size: 11px; margin: 10px 0; }
  .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .totals .grand { font-size: 14px; font-weight: 800; border-top: 1px dashed #999; padding-top: 6px; margin-top: 6px; }
  .pm { text-align: center; font-size: 10px; margin: 10px 0; }
  .pm span { background: #f1f1f1; padding: 3px 10px; border-radius: 999px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 14px; }
  .footer b { color: #000; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 4px; }
  @page { size: 80mm auto; margin: 0; }
</style>
</head><body>
  <div class="wrap">
    <h1>Bay Bakers</h1>
    <div class="sub">Premium Artisan Bakery</div>
    <div class="meta">
      <p>${new Date().toLocaleString()}</p>
      ${customerName ? `<p><b>Customer:</b> ${escapeHtml(customerName)}</p>` : ''}
      ${customerPhone ? `<p>${escapeHtml(customerPhone)}</p>` : ''}
    </div>
    <div class="hr"></div>
    <table>
      <thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>Rs.${(subtotal || total).toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="row" style="color:#0a7d2e;"><span>Discount</span><span>- Rs.${discount.toFixed(2)}</span></div>` : ''}
      <div class="row grand"><span>Total</span><span>Rs.${total.toFixed(2)}</span></div>
    </div>
    <div class="pm"><span>Paid via ${escapeHtml(paymentMethod || 'Cash')}</span></div>
    <div class="footer">
      <b>Thank You!</b>
      <div>Visit again for fresh delights</div>
      <div style="margin-top:4px;">www.baybakers.com</div>
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function(){ window.print(); window.onafterprint = function(){ window.close(); }; }, 100); };
  </script>
</body></html>`;

    const w = window.open('', '_blank', 'width=420,height=720');
    if (!w) { alert('Please allow popups to print the receipt.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Static Blurred Cake Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-xl transition-opacity duration-1000"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format)' 
          }}
        />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-card max-w-sm w-full rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-6 relative z-10 border border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div ref={receiptRef} className="print-area bg-white text-black p-4">
          <div className="text-center mb-6 pb-6 border-b border-dashed border-zinc-300">
            <h1 className="text-2xl font-black text-primary mb-1 uppercase tracking-tighter">Bay Bakers</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Premium Artisan Bakery</p>
            <div className="mt-4 space-y-1 text-[10px]">
               <p className="text-zinc-400">{new Date().toLocaleString()}</p>
               {customerName && <p className="font-bold">Customer: {customerName}</p>}
               {customerPhone && <p className="text-zinc-400">{customerPhone}</p>}
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400">
                  <th className="text-left py-2 font-bold uppercase">Item</th>
                  <th className="text-center py-2 font-bold uppercase">Qty</th>
                  <th className="text-right py-2 font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium">{item.product.name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2 font-bold">
                      Rs.{(item.product.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-6 space-y-1.5 py-3 border-t border-b border-dashed border-zinc-200">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-500">Subtotal:</span>
              <span className="font-bold">Rs.{(subtotal || total).toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-[11px] text-green-600">
                <span>Discount:</span>
                <span className="font-bold">- Rs.{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-black pt-1">
              <span>Total:</span>
              <span className="text-primary">Rs.{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-black uppercase">
              Paid via {paymentMethod}
            </div>
          </div>

          <div className="text-center text-[10px] text-zinc-400 leading-relaxed">
            <p className="font-bold text-zinc-800 uppercase tracking-widest mb-1">Thank you!</p>
            <p>Visit again for fresh delights</p>
            <p className="mt-2 font-medium">www.baybakers.com</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 h-12 text-sm font-bold border border-border rounded-xl hover:bg-muted transition-all active:scale-95"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 h-12 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            Print Receipt
          </button>
        </div>
      </motion.div>

    </div>
  );
};
