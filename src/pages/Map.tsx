/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RECYCLING_LOCATIONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Navigation, Search, Filter, X, Sparkles, Route, Trash2 } from 'lucide-react';
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

const UserLocationIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const RecyclingPointIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-6 h-6 rounded-full bg-primary border-4 border-white shadow-xl flex items-center justify-center text-white"><div class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

L.Marker.prototype.options.icon = DefaultIcon;

const calculateDistance = (p1: [number, number], p2: [number, number]) => {
  const R = 6371; // km
  const dLat = (p2[0] - p1[0]) * Math.PI/180;
  const dLon = (p2[1] - p1[1]) * Math.PI/180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1[0] * Math.PI/180) * Math.cos(p2[0] * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<RecyclingLocation | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<[number, number][]>([]);
  const [totalDistance, setTotalDistance] = useState(0);

  const astanaCenter: [number, number] = [51.128, 71.430];

  const materialCategories = [
    { id: 'plastic', label: 'Plastic' },
    { id: 'glass', label: 'Glass' },
    { id: 'paper', label: 'Paper' },
    { id: 'metal', label: 'Metal' },
    { id: 'electronics', label: 'Electronics' },
  ];

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev => 
      prev.includes(material) 
        ? prev.filter(m => m !== material) 
        : [...prev, material]
    );
    // Reset route when filters change
    setIsRouting(false);
    setOptimizedRoute([]);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => console.log('User denied location access')
      );
    }
  }, []);

  const filteredLocations = useMemo(() => {
    return RECYCLING_LOCATIONS.filter(l => {
      const matchesMaterials = selectedMaterials.length === 0 || 
                               selectedMaterials.every(m => l.acceptedMaterials.includes(m));
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            l.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMaterials && matchesSearch;
    });
  }, [selectedMaterials, searchQuery]);

  const calculateOptimalRoute = () => {
    if (filteredLocations.length === 0) return;

    let points = [...filteredLocations];
    let startPoint: [number, number] = userLocation || astanaCenter;
    let route: [number, number][] = [startPoint];
    let currentPoint = startPoint;
    let distance = 0;

    // Simple Nearest Neighbor approach for efficiency
    while (points.length > 0) {
      let nearestIdx = 0;
      let minDistance = calculateDistance(currentPoint, points[0].coordinates);

      for (let i = 1; i < points.length; i++) {
        const d = calculateDistance(currentPoint, points[i].coordinates);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      distance += minDistance;
      currentPoint = points[nearestIdx].coordinates;
      route.push(currentPoint);
      points.splice(nearestIdx, 1);
    }

    setOptimizedRoute(route);
    setTotalDistance(distance);
    setIsRouting(true);
  };

  const materialTips: Record<string, string[]> = {
    plastic: ['Rinse and dry all containers', 'Remove plastic caps and lids', 'Check for recycling symbols (1-7)'],
    glass: ['Rinse thoroughly before recycling', 'Do not break glass intentionally', 'Remove any metal or plastic caps'],
    paper: ['Keep paper dry and clean', 'Remove any plastic windows or tape', 'Do not recycle grease-stained paper'],
    metal: ['Rinse food residue from cans', 'Crush cans to save space', 'Labels are usually OK to leave on'],
    electronics: ['Remove batteries where possible', 'Back up and wipe personal data', 'Include all cables and accessories'],
    cardboard: ['Flatten boxes completely', 'Remove all packing tape and staples', 'Avoid oil-soaked or wet cardboard'],
  };

  return (
    <div className="h-full flex flex-col relative bg-accent">
      {/* Header with Search/Filter Placeholder */}
      <div className="absolute top-20 left-6 right-6 z-[1000] space-y-4">
        <div className="bento-card px-5 py-4 flex items-center gap-3 backdrop-blur-md bg-white/80">
          <Search size={18} className="text-primary" />
          <input 
            type="text" 
            placeholder="Search Astana points..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-primary-dark placeholder:text-primary-dark/20"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-primary-dark/40"
            >
              <X size={14} />
            </button>
          )}
          <div className="w-[1px] h-4 bg-primary-light/30 mx-1" />
          <button className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Filter size={16} />
          </button>
        </div>
        
        {/* Chips for Filtering */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
           <button
             onClick={() => {
               setSelectedMaterials([]);
               setIsRouting(false);
             }}
             className={cn(
               "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
               selectedMaterials.length === 0 ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/90 text-primary-dark/40 border border-primary-light"
             )}
           >
             All
           </button>
           {materialCategories.map((cat) => (
             <button
               key={cat.id}
               onClick={() => toggleMaterial(cat.id)}
               className={cn(
                 "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2",
                 selectedMaterials.includes(cat.id) ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white/90 text-primary-dark/40 border border-primary-light"
               )}
             >
               {selectedMaterials.includes(cat.id) && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
               {cat.label}
             </button>
           ))}
        </div>
      </div>

      {/* Legend & Routing Info */}
      <div className="absolute top-56 right-6 z-[1000] pointer-events-none space-y-3">
        {isRouting && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bento-card p-3 bg-primary text-white border-0 shadow-xl pointer-events-auto max-w-[140px]"
          >
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Optimal Route</p>
            <div className="flex items-center gap-2">
              <Route size={14} />
              <span className="text-[10px] font-black italic tracking-tighter">{totalDistance.toFixed(1)} km total</span>
            </div>
            <button 
              onClick={() => {
                setIsRouting(false);
                setOptimizedRoute([]);
              }}
              className="mt-2 w-full py-1 text-[8px] font-black uppercase tracking-widest bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 size={10} /> Clear
            </button>
          </motion.div>
        )}

        <div className="bento-card p-3 space-y-2 bg-white/70 backdrop-blur-md border shadow-lg pointer-events-auto max-w-[120px]">
          <p className="text-[8px] font-black uppercase tracking-widest text-primary-dark/60 mb-1">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary shadow-sm" />
            <span className="text-[10px] font-bold text-primary-dark">Recycling Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm animate-pulse" />
            <span className="text-[10px] font-bold text-primary-dark">Your Location</span>
          </div>
          <div className="pt-1 border-t border-primary-light/30 mt-1">
            <p className="text-[7px] text-primary-dark/40 italic leading-tight">Pins show locations matching your material filters</p>
          </div>
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
            icon={RecyclingPointIcon}
            eventHandlers={{
              click: () => setSelectedLocation(loc),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 font-sans">
                <h3 className="font-black text-sm tracking-tight text-primary-dark">{loc.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{loc.address}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {loc.acceptedMaterials.map(m => (
                    <span key={m} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[7px] font-black rounded-md uppercase tracking-widest">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
           <Marker position={userLocation} icon={UserLocationIcon}>
             <Popup>You are here</Popup>
           </Marker>
        )}

        {isRouting && optimizedRoute.length > 1 && (
          <Polyline 
            positions={optimizedRoute} 
            color="#16a34a" 
            weight={4} 
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        <RecenterButton coords={userLocation || astanaCenter} />
      </MapContainer>

      {/* Action Buttons Overlay */}
      <div className="absolute bottom-24 left-6 flex flex-col gap-3 z-[1000]">
        {!isRouting && filteredLocations.length > 1 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={calculateOptimalRoute}
            className="h-12 px-6 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            <Route size={18} />
            <span>Plan Route</span>
          </motion.button>
        )}
      </div>

      {/* Info Card Drawer */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-24 left-6 right-6 z-[1001] bento-card p-8 space-y-6 shadow-2xl shadow-primary/20"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <h2 className="text-2xl font-black text-primary-dark tracking-tighter italic">{selectedLocation.name}</h2>
                <div className="flex items-center space-x-1.5 text-primary-dark/30 font-bold text-[10px] uppercase tracking-widest">
                  <MapPin size={10} />
                  <span>{selectedLocation.address}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedLocation.acceptedMaterials.map(m => (
                    <span key={m} className="px-2.5 py-1 bg-primary text-white text-[8px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                      {m}
                    </span>
                  ))}
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
                 <p className="label-caps">Status</p>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black text-primary-dark italic tracking-tight">Open Now</span>
                 </div>
               </div>
               <div className="space-y-2 text-right">
                 <p className="label-caps">Hours</p>
                 <p className="text-xs font-black text-primary-dark italic tracking-tight">{selectedLocation.hours}</p>
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkles size={14} className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-dark/60">Recycling Tips</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedLocation.acceptedMaterials.map(material => (
                  materialTips[material] && (
                    <div key={material} className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-[9px] font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {material}
                      </p>
                      <ul className="space-y-1.5">
                        {materialTips[material].map((tip, idx) => (
                          <li key={idx} className="text-[10px] text-primary-dark/70 font-medium leading-relaxed flex items-start gap-2">
                            <span className="mt-1 w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="flex space-x-4 pt-2">
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.coordinates[0]},${selectedLocation.coordinates[1]}`, '_blank')}
                className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Navigation size={20} />
                <span className="text-sm">Get Directions</span>
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
