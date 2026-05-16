import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button } from './Button';
import { Input, Textarea } from './Input';
import { X, Star } from 'lucide-react';

export const FeedbackModal = ({ onClose }) => {
  const { submitFeedback, currentUser } = useStore();
  const toast = useToast();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.warning('Please select a rating');
      return;
    }
    submitFeedback(name, email, rating, message);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md rounded-lg shadow-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
            <Star size={32} className="text-white fill-white" />
          </div>
          <h3 className="text-2xl mb-2">Thank You!</h3>
          <p className="text-muted-foreground">Your feedback has been submitted successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl">Share Your Feedback</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <label className="block mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'text-warning fill-warning' : 'text-border'}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Your Message"
            placeholder="Tell us about your experience..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
          />

          <Button type="submit" className="w-full" size="lg">
            Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  );
};
