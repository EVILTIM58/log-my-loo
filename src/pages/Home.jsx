import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Globe, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalMap from '@/components/GlobalMap';
import DropModal from '@/components/DropModal';
import DropDetailPanel from '@/components/DropDetailPanel';

export default function Home() {
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ['poopDrops'],
    queryFn: () => base44.entities.PoopDrop.list('-created_date', 500),
  });

  useEffect(() => {
    // Get user location on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {} // Silently fail if denied
      );
    }
  }, []);

  const handleMarkerClick = (drop) => {
    setSelectedDrop(drop);
    setIsDetailOpen(true);
  };

  const handleDropSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['poopDrops'] });
  };

  const stats = {
    total: drops.length,
    countries: new Set(drops.map(d => `${Math.round(d.latitude/10)},${Math.round(d.longitude/10)}`)).size,
    topRated: drops.filter(d => d.average_rating >= 4).length
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-amber-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span 
                className="text-3xl sm:text-4xl"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                💩
              </motion.span>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  The Places I've Pooped
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">A global movement, one drop at a time</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 mr-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">{stats.total} drops worldwide</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">{stats.topRated} highly rated</span>
              </div>
            </div>

            {/* Bombs Away Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsDropModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-6 text-sm sm:text-lg rounded-xl shadow-lg shadow-amber-500/25"
              >
                <span className="mr-2">💣</span>
                <span className="hidden sm:inline">Bombs Away!</span>
                <span className="sm:hidden">Drop!</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Map Container */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.span 
                className="text-6xl block mb-4"
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                💩
              </motion.span>
              <p className="text-slate-400">Loading the global poop map...</p>
            </motion.div>
          </div>
        ) : (
          <GlobalMap 
            drops={drops} 
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation}
          />
        )}

        {/* Mobile Stats Banner */}
        <div className="absolute bottom-4 left-4 right-4 md:hidden z-10">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-3 flex justify-around border border-amber-500/20"
          >
            <div className="text-center">
              <p className="text-xl font-bold text-amber-400">{stats.total}</p>
              <p className="text-xs text-slate-400">Drops</p>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-xl font-bold text-green-400">{stats.topRated}</p>
              <p className="text-xs text-slate-400">Top Rated</p>
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-lg rounded-xl p-3 border border-slate-700 hidden sm:block z-10"
        >
          <p className="text-xs text-slate-400 mb-2 font-medium">Map Legend</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">💩</span>
            <span className="text-sm text-slate-300">Drop Location</span>
          </div>
        </motion.div>
      </div>

      {/* Drop Modal */}
      <DropModal 
        open={isDropModalOpen} 
        onOpenChange={setIsDropModalOpen}
        onSuccess={handleDropSuccess}
      />

      {/* Detail Panel */}
      <DropDetailPanel
        drop={selectedDrop}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdate={handleDropSuccess}
      />
    </div>
  );
}