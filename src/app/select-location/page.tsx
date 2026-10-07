'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Navigation,
  MapPin,
  ExternalLink,
  QrCode,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
  Camera,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
  Phone,
  RefreshCw,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Machine } from '@/lib/types';

// Haversine distance calculator in KM
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export default function SelectLocationPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'shops' | 'kiosks'>('all');
  
  // User GPS state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Selected Machine Details Modal State
  const [viewingPhotoMachine, setViewingPhotoMachine] = useState<Machine | null>(null);
  
  // QR Scanner Simulator Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [manualQrInput, setManualQrInput] = useState('');

  // Fetch Live Machines from Supabase
  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/machines');
      const data = await res.json();
      if (data.success) {
        setMachines(data.machines || []);
      }
    } catch (e) {
      console.error('Failed to fetch machines:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  // Use Current Location
  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      setLocationStatus('Fetching GPS coordinates...');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocating(false);
          setLocationStatus(`📍 Located! Sorted by distance.`);
          setTimeout(() => setLocationStatus(null), 4000);
        },
        err => {
          setLocating(false);
          // Fallback default coordinates (Chennai / RIT Campus)
          setUserCoords({ lat: 13.0827, lng: 80.2707 });
          setLocationStatus('⚠️ GPS access denied. Using Chennai reference coordinates.');
          setTimeout(() => setLocationStatus(null), 5000);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus('⚠️ Geolocation not supported by your browser.');
    }
  };

  // Filter and sort machines by distance and search query
  const filteredMachines = useMemo(() => {
    return machines
      .map(m => {
        let distanceKm: number | null = null;
        const mLat = m.latitude ?? 13.0827;
        const mLng = m.longitude ?? 80.2707;

        if (userCoords) {
          distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, mLat, mLng);
        }

        return {
          ...m,
          calculatedDistance: distanceKm,
        };
      })
      .filter(m => {
        const matchesQuery =
          m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.machineCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.fullAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.locationDescription || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCat =
          categoryFilter === 'all' ||
          (categoryFilter === 'shops' && m.deploymentType === 'xerox_shop') ||
          (categoryFilter === 'kiosks' && m.deploymentType === 'kiosk_atm');

        return matchesQuery && matchesCat;
      })
      .sort((a, b) => {
        if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
          return a.calculatedDistance - b.calculatedDistance;
        }
        return 0;
      });
  }, [machines, searchQuery, categoryFilter, userCoords]);

  const shopsCount = machines.filter(m => m.deploymentType === 'xerox_shop').length;
  const kiosksCount = machines.filter(m => m.deploymentType === 'kiosk_atm').length;

  const handleSelectKiosk = (machineCode: string) => {
    sessionStorage.setItem('printpoint_selected_machine', machineCode);
    router.push(`/upload?machine=${machineCode}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-500 selection:text-white pb-24">
      {/* TOP HEADER */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="https://wa.me/918667466390?text=Hi%20PrintPoint%20Support,%20I%20need%20help%20finding%20a%20kiosk"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#00a61c]" />
            <span>Help</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search store location, campus block, landmark..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:border-[#00a61c] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* USE CURRENT LOCATION BUTTON */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#e9f9ee] hover:bg-[#d9f5e1] border border-[#00a61c]/30 text-[#008f18] text-xs sm:text-sm font-extrabold flex items-center justify-start gap-2.5 transition-all shadow-2xs cursor-pointer active:scale-99"
        >
          <Navigation className={`w-4 h-4 shrink-0 ${locating ? 'animate-spin text-[#00a61c]' : 'text-[#00a61c]'}`} />
          <span>{locating ? 'Detecting your GPS location...' : 'Use Current Location'}</span>
        </button>

        {/* Location Status Notice */}
        {locationStatus && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-[#00a61c] shrink-0" />
            <span>{locationStatus}</span>
          </div>
        )}

        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          {[
            { id: 'all', label: `All (${machines.length})` },
            { id: 'shops', label: `Shops (${shopsCount})` },
            { id: 'kiosks', label: `Kiosks (${kiosksCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LOADING SPINNER */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00a61c] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Searching active network terminals...</p>
          </div>
        )}

        {/* EMPTY STATE MASCOT */}
        {!loading && filteredMachines.length === 0 && (
          <div className="py-12 px-4 text-center space-y-4 animate-in fade-in">
            {/* Mascot Center Illustration */}
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl shadow-inner">
              🤖📍
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-base font-black text-slate-900">
                {searchQuery ? 'No matching print station found' : 'Choose a kiosk to start the printing service'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery
                  ? `No kiosk matched "${searchQuery}". Try searching with city, campus name, or reset filter.`
                  : 'Search for a location or use your current location to find the nearest kiosk.'}
              </p>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* STORE / KIOSK CARDS FEED */}
        {!loading && filteredMachines.length > 0 && (
          <div className="space-y-4">
            {filteredMachines.map(machine => {
              const isOpen = machine.status === 'online';
              const distanceFormatted =
                machine.calculatedDistance !== null ? `${machine.calculatedDistance} km` : null;

              return (
                <div
                  key={machine.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all space-y-4 group"
                >
                  {/* Top Store Header */}
                  <div className="flex items-start gap-4">
                    {/* Store / Kiosk Photo */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {machine.photoUrl || machine.secondaryLogoUrl ? (
                        <img
                          src={machine.photoUrl || machine.secondaryLogoUrl}
                          alt={machine.displayName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-50 text-[#00a61c] flex items-center justify-center font-black text-xl">
                          {machine.deploymentType === 'xerox_shop' ? '🏪' : '🖨️'}
                        </div>
                      )}
                    </div>

                    {/* Store Title & Address */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 truncate">{machine.displayName}</h3>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                          {machine.machineCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            isOpen
                              ? 'bg-[#e9f9ee] text-[#008f18] border border-[#00a61c]/30'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          ● {isOpen ? 'Open' : 'Maintenance'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <p className="text-slate-600 text-xs truncate max-w-md">
                          {machine.fullAddress || machine.locationDescription || 'Self-Service Station'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Distance Bar */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    {/* Primary "Print Now ->" CTA Button */}
                    <button
                      onClick={() => handleSelectKiosk(machine.machineCode)}
                      className="flex-1 py-3 px-5 rounded-2xl bg-[#e9f9ee] hover:bg-[#00a61c] text-[#008f18] hover:text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 group-hover:bg-[#00a61c] group-hover:text-white"
                    >
                      <span>Print Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* View Photos & Details Button */}
                    <button
                      onClick={() => setViewingPhotoMachine(machine)}
                      title="View Store Photo & Details"
                      className="w-11 h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer shrink-0"
                    >
                      <Camera className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Google Maps Navigation Button & Distance Badge */}
                    <div className="relative shrink-0">
                      {distanceFormatted && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e9f9ee] text-[#008f18] text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap">
                          {distanceFormatted}
                        </div>
                      )}
                      <a
                        href={
                          machine.googleMapsUrl ||
                          `https://www.google.com/maps/dir/?api=1&destination=${machine.latitude || 13.0827},${machine.longitude || 80.2707}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        title="Navigate on Google Maps"
                        className="w-11 h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-[#00a61c]" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING GREEN QR SCANNER BUTTON (Matching screenshot) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowQrModal(true)}
          title="Scan Kiosk QR Code"
          className="w-14 h-14 rounded-full bg-[#00a61c] hover:bg-[#008f18] text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 cursor-pointer border-2 border-white"
        >
          <QrCode className="w-7 h-7" />
        </button>
      </div>

      {/* ========================================================== */}
      {/* MODAL: STORE DETAILS & PHOTO VIEWER */}
      {/* ========================================================== */}
      {viewingPhotoMachine && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">{viewingPhotoMachine.displayName}</h3>
              <button
                onClick={() => setViewingPhotoMachine(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Photo */}
            <div className="w-full h-48 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {viewingPhotoMachine.photoUrl || viewingPhotoMachine.secondaryLogoUrl ? (
                <img
                  src={viewingPhotoMachine.photoUrl || viewingPhotoMachine.secondaryLogoUrl}
                  alt={viewingPhotoMachine.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-2 text-slate-400">
                  <Printer className="w-12 h-12 mx-auto text-[#00a61c]" />
                  <p className="text-xs font-bold">Physical Laser Kiosk Station</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#00a61c] shrink-0 mt-0.5" />
                <span><b>Address:</b> {viewingPhotoMachine.fullAddress || viewingPhotoMachine.locationDescription}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00a61c] shrink-0" />
                <span><b>Hours:</b> {viewingPhotoMachine.openingHours || 'Open 24/7 (Always Available)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00a61c] shrink-0" />
                <span><b>Manager Alert:</b> +91 {viewingPhotoMachine.managerPhone || '8667466390'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleSelectKiosk(viewingPhotoMachine.machineCode);
                setViewingPhotoMachine(null);
              }}
              className="w-full py-3.5 rounded-xl bg-[#00a61c] hover:bg-[#008f18] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Select & Print Here</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: QR CODE SCANNER SIMULATOR */}
      {/* ========================================================== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <QrCode className="w-4 h-4 text-[#00a61c]" />
                <span>Scan Kiosk Terminal QR</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Camera Viewfinder Box */}
            <div className="relative w-48 h-48 mx-auto rounded-3xl bg-slate-950 border-2 border-[#00a61c] flex items-center justify-center overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-b from-[#00a61c]/20 via-transparent to-[#00a61c]/20 animate-pulse" />
              <div className="w-36 h-36 border border-dashed border-emerald-400 rounded-2xl flex items-center justify-center text-white/60 text-xs font-mono">
                Point at Kiosk QR
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Point your camera at the QR code displayed on the physical Kiosk screen to auto-connect.
            </p>

            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-600 font-mono">Or Enter Machine Code Manually:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. RIT-ATM-01"
                  value={manualQrInput}
                  onChange={e => setManualQrInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#00a61c]"
                />
                <button
                  onClick={() => {
                    if (manualQrInput.trim()) {
                      handleSelectKiosk(manualQrInput.trim());
                      setShowQrModal(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00a61c] text-white font-bold text-xs cursor-pointer"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
