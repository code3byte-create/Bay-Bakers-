import React from 'react';
import { Button } from './Button';
import { X, CheckCircle, Clock, Truck, Package } from 'lucide-react';

export const OrderTrackingModal = ({ order, onClose }) => {
  const getStatusIcon = (status) => {
    if (status.includes('received')) return <CheckCircle size={20} className="text-success" />;
    if (status.includes('approved')) return <CheckCircle size={20} className="text-success" />;
    if (status.includes('Preparing') || status.includes('Baking')) return <Package size={20} className="text-primary" />;
    if (status.includes('delivery')) return <Truck size={20} className="text-primary" />;
    if (status.includes('Delivered')) return <CheckCircle size={20} className="text-success" />;
    return <Clock size={20} className="text-muted-foreground" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl rounded-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl">Order Tracking</h2>
            <p className="text-muted-foreground">Order ID: {order.id}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Date:</span>
                <span>{order.deadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment:</span>
                <span>{order.paymentMethod}</span>
              </div>
              {order.deliveryPerson && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Person:</span>
                  <span>{order.deliveryPerson}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4">Delivery Address</h3>
            <p className="text-sm">{order.deliveryAddress}</p>
            <div className="mt-4">
              <h3 className="mb-2">Order Total</h3>
              <p className="text-2xl text-primary font-semibold">${order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4>{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${item.product.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="text-primary font-semibold">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4">Tracking History</h3>
          <div className="space-y-4">
            {order.trackingNotes?.map((note, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getStatusIcon(note)}
                  </div>
                  {idx < (order.trackingNotes?.length || 0) - 1 && (
                    <div className="w-0.5 h-12 bg-border mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">{note}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(new Date(order.createdAt).getTime() + idx * 3600000).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
