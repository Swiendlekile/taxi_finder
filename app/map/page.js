"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapPage() {
  const [myPos, setMyPos] = useState(null);
  const [drop, setDrop] = useState(null);
  const [msg, setMsg] = useState("Waiting for your location...");
  const [alert, setAlert] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setMsg("Your browser can't give location.");
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setMyPos(p);
        setMsg("Location on. Tap the map to pin your drop-off.");
      },
      () => setMsg("Could not get location. Allow it in Chrome."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  useEffect(() => {
    if (!myPos || !drop) return;
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(drop.lat - myPos.lat);
    const dLon = toRad(drop.lon - myPos.lon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(myPos.lat)) * Math.cos(toRad(drop.lat)) * Math.sin(dLon / 2) ** 2;
    const m = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    if (m <= 300) {
      setAlert(`You are ${m} m away. Say "Short left please" now.`);
    } else {
      setAlert(`${m} m to your drop-off.`);
    }
  }, [myPos, drop]);

  return (
    <main className="min-h-screen bg-white text-black p-5 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Pin your drop-off</h1>
      <p className="text-lg mb-3">{msg}</p>
      {alert && (
        <p className="text-xl font-bold bg-yellow-300 border-2 border-black rounded-lg p-3 mb-3">
          {alert}
        </p>
      )}
      <MapView myPos={myPos} drop={drop} setDrop={setDrop} />

      <a href="/" className="block text-center bg-black text-white text-xl font-bold rounded-lg p-3 mt-4">
        Back to search
      </a>
    </main>
  );
}