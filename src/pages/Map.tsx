/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RECYCLING_LOCATIONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Navigation, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { RecyclingLocation } from '../types';

// Fix for Leaflet marker icons in React
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<RecyclingLocation | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const astanaCenter: [number, number] = [51.128, 71.430];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => console.log('User denied location access')
      );
    }
  }, []);

  const filteredLocations = filter === 'all' 
    ? RECYCLING_LOCATIONS 
    : RECYCLING_LOCATIONS.filter(l => l.acceptedMaterials.includes(filter));

  return (
    <div className="h-full flex flex-col relative bg-accent">
      {/* Header with Search/Filter Placeholder */}
      <div className="absolute top-20 left-6 right-6 z-[1000] space-y-4">
        <div className="bento-card px-5 py-4 flex items-center gap-3 backdrop-blur-md bg-white/80">
          <Search size={18} className="text-primary" />
          <input 
            type="text" 
            placeholder="Search Astana points..." 
            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-primary-dark placeholder:text-primary-dark/20"
          />
          <button className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Filter size={16} />
          </button>
        </div>
        
        {/* Chips for Filtering */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
           {['all', 'plastic', 'glass', 'paper', 'metal', 'electronics'].map((cat) => (
             <button
               key={cat}
               onClick={() => setFilter(cat)}
               className={cn(
                 "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                 filter === cat ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/90 text-primary-dark/40 border border-primary-light"
               )}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      <MapContainer 
        center={astanaCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredLocations.map((loc) => (
          <Marker 
            key={loc.id} 
            position={loc.coordinates}
            eventHandlers={{
              click: () => setSelectedLocation(loc),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 font-sans">
                <h3 className="font-black text-sm tracking-tight text-primary-dark">{loc.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{loc.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
           <Marker position={userLocation}>
             <Popup>You are here</Popup>
           </Marker>
        )}

        <RecenterButton coords={userLocation || astanaCenter} />
      </MapContainer>

      {/* Info Card Drawer */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-24 left-6 right-6 z-[1000] bento-card p-8 space-y-6 shadow-2xl shadow-primary/20"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-primary-dark tracking-tighter italic">{selectedLocation.name}</h2>
                <div className="flex items-center space-x-1.5 text-primary-dark/30 font-bold text-[10px] uppercase tracking-widest">
                  <MapPin size={10} />
                  <span>{selectedLocation.address}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLocation(null)}
                className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-primary-dark/20 hover:text-primary-dark transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                 <p className="label-caps">Accepted</p>
                 <div className="flex flex-wrap gap-1.5">
                   {selectedLocation.acceptedMaterials.map(m => (
                     <span key={m} className="px-2.5 py-1 bg-primary text-white text-[8px] font-black rounded-lg uppercase tracking-widest">
                       {m}
                     </span>
                   ))}
                 </div>
               </div>
               <div className="space-y-2 text-right">
                 <p className="label-caps">Hours</p>
                 <p className="text-xs font-black text-primary-dark italic tracking-tight">{selectedLocation.hours}</p>
               </div>
            </div>

            <div className="flex space-x-4 pt-2">
              <button className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 flex items-center justify-center space-x-2 active:scale-95 transition-all">
                <Navigation size={20} />
                <span className="text-sm">Start Navigation</span>
              </button>
              <button className="w-16 bento-card flex items-center justify-center text-primary border-primary-light">
                <Info size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecenterButton({ coords }: { coords: [number, number] }) {
  const map = useMap();
  return (
    <button 
      onClick={() => map.setView(coords, 14)}
      className="absolute bottom-24 right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-primary"
    >
      <Navigation size={20} />
    </button>
  );
}
