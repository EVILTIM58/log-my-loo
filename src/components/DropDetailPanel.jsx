import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, MessageCircle, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function DropDetailPanel({ drop, open, onOpenChange, onUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (drop && open) {
      loadReviews();
    }
  }, [drop, open]);

  const loadReviews = async () => {
    if (!drop) return;
    setIsLoadingReviews(true);
    const data = await base44.entities.Review.filter({ drop_id: drop.id }, '-created_date');
    setReviews(data);
    setIsLoadingReviews(false);
  };

  const handleSubmitReview = async () => {
    if (newRating === 0) return;
    
    setIsSubmitting(true);
    const user = await base44.auth.me();
    
    await base44.entities.Review.create({
      drop_id: drop.id,
      rating: newRating,
      comment: newComment,
      reviewer_name: user?.full_name || 'Anonymous Reviewer'
    });

    // Update average rating
    const allReviews = [...reviews, { rating: newRating }];
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await base44.entities.PoopDrop.update(drop.id, {
      average_rating: avgRating,
      review_count: allReviews.length
    });

    setNewRating(0);
    setNewComment('');
    setIsSubmitting(false);
    loadReviews();
    onUpdate?.();
  };

  if (!drop) return null;

  const displayRating = hoverRating || newRating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-slate-900 to-slate-800 border-l-amber-500/20 text-white overflow-y-auto z-[9999]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📍</span>
            {drop.location_name || 'Mystery Location'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Photo */}
          {drop.photo_url && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
            >
              <img src={drop.photo_url} alt="Drop photo" className="w-full h-48 object-cover" />
            </motion.div>
          )}

          {/* Info */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <Avatar className="h-8 w-8 bg-amber-500/20">
                <AvatarFallback className="text-amber-400 text-xs">
                  {drop.user_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{drop.user_name || 'Anonymous'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="h-4 w-4" />
              {format(new Date(drop.created_date), 'MMM d, yyyy h:mm a')}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin className="h-4 w-4" />
              {drop.latitude.toFixed(6)}, {drop.longitude.toFixed(6)}
            </div>

            {drop.average_rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= drop.average_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
                <span className="text-slate-400 text-sm">({drop.review_count} reviews)</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {drop.notes && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-300 mb-2">Notes</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{drop.notes}</p>
            </div>
          )}

          {/* Add Review */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-slate-300 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Leave a Review
            </h3>

            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600 hover:text-amber-400/50'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50"
            />

            <Button
              onClick={handleSubmitReview}
              disabled={newRating === 0 || isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
            </Button>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-300">Reviews ({reviews.length})</h3>
            
            {isLoadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No reviews yet. Be the first!</p>
            ) : (
              <AnimatePresence>
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 bg-amber-500/20">
                          <AvatarFallback className="text-amber-400 text-xs">
                            {review.reviewer_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-300">{review.reviewer_name}</span>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-slate-400 text-sm">{review.comment}</p>
                    )}
                    <p className="text-slate-600 text-xs">
                      {format(new Date(review.created_date), 'MMM d, yyyy')}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}