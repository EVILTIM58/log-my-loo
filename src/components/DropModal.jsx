import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Camera, Loader2, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function DropModal({ open, onOpenChange, onSuccess }) {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      if (!location) {
        getLocation();
      }
    } else {
      // Reset everything when modal closes
      setLocation(null);
      setLocationName('');
      setNotes('');
      setPhoto(null);
      setPhotoPreview(null);
      setError(null);
      setManualMode(false);
      setIsGettingLocation(false);
    }
  }, [open]);

  const getLocation = () => {
    setIsGettingLocation(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      setManualMode(true);
      return;
    }

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      setIsGettingLocation(false);
      setError('Location request timed out. You can enter coordinates manually.');
      setManualMode(true);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsGettingLocation(false);
      },
      (err) => {
        clearTimeout(timeout);
        setError('Unable to get your location. You can enter coordinates manually or retry.');
        setIsGettingLocation(false);
        setManualMode(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!location) return;
    
    setIsSubmitting(true);
    
    let photoUrl = null;
    if (photo) {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: photo });
      photoUrl = uploadResult.file_url;
    }

    const user = await base44.auth.me();
    
    await base44.entities.PoopDrop.create({
      latitude: location.latitude,
      longitude: location.longitude,
      location_name: locationName || 'Unnamed Location',
      notes: notes,
      photo_url: photoUrl,
      user_name: user?.full_name || 'Anonymous Pooper',
      average_rating: 0,
      review_count: 0
    });

    setIsSubmitting(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-amber-500/20 text-white"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">💩</span>
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Drop Zone
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {/* Location Status */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${location ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                  {isGettingLocation ? (
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                  ) : (
                    <Target className={`h-5 w-5 ${location ? 'text-green-400' : 'text-amber-400'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300">GPS Location</p>
                  {location ? (
                    <p className="text-xs text-slate-500">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  ) : isGettingLocation ? (
                    <p className="text-xs text-slate-500">Waiting for permission...</p>
                  ) : (
                    <p className="text-xs text-slate-500">Not acquired</p>
                  )}
                </div>
              </div>
              {!location && !isGettingLocation && (
                <Button size="sm" variant="ghost" onClick={getLocation} className="text-amber-400 hover:text-amber-300">
                  Retry GPS
                </Button>
              )}
            </div>
            {error && (
              <div className="mt-3">
                <p className="text-red-400 text-sm">{error}</p>
                {!manualMode && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setManualMode(true)}
                    className="mt-2 text-xs"
                  >
                    Enter Coordinates Manually
                  </Button>
                )}
              </div>
            )}
            
            {/* Manual Coordinate Entry */}
            {manualMode && !location && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value);
                      if (!isNaN(lat)) {
                        setLocation(prev => ({ ...prev, latitude: lat, longitude: prev?.longitude || 0 }));
                      }
                    }}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lng)) {
                        setLocation(prev => ({ ...prev, longitude: lng, latitude: prev?.latitude || 0 }));
                      }
                    }}
                    className="bg-slate-900/50 border-slate-700 text-white text-sm h-8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location Name */}
          <div className="space-y-2">
            <Label className="text-slate-300">Location Name</Label>
            <Input
              placeholder="e.g., The Coffee Shop on 5th"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              placeholder="How was the experience? Clean? Private? Worth a return visit?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50 min-h-[80px]"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-slate-300">Photo Evidence (Optional)</Label>
            <div className="relative">
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 cursor-pointer transition-colors bg-slate-800/30">
                  <Camera className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-500">Click to upload</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={!location || isSubmitting}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Dropping...
                </>
              ) : (
                <>
                  💣 Bombs Away!
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}