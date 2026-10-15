"use client";
import { useEffect, useState } from "react";

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function Home() {
  const [routes, setRoutes] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState(null);
  const [newFare, setNewFare] = useState({});
  const [messages, setMessages] = useState({});
  const [calcOpen, setCalcOpen] = useState(null);
  const [calc, setCalc] = useState({});
  const [myPos, setMyPos] = useState(null);
  const [locMsg, setLocMsg] = useState("");

  async function loadRoutes() {
    const res = await fetch("/api/routes");
    const data = await res.json();
    setRoutes(data);
    setResults((old) => old && data.filter((r) => old.some((o) => o.id === r.id)));
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  function useMyLocation() {
    setLocMsg("");
    if (!navigator.geolocation) {
      setLocMsg("Your browser can't give location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocMsg("Location found. Showing taxis closest to you.");
      },
      () => setLocMsg("Could not get location. Allow it or type your area."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function sorted(list) {
    if (!myPos) return list;
    return [...list].sort((a, b) => {
      const da =
        a.latitude && a.longitude
          ? distanceMeters(myPos.lat, myPos.lon, a.latitude, a.longitude)
          : Infinity;
      const db =
        b.latitude && b.longitude
          ? distanceMeters(myPos.lat, myPos.lon, b.latitude, b.longitude)
          : Infinity;
      return da - db;
    });
  }

  function search() {
    const f = from.trim().toLowerCase();
    const t = to.trim().toLowerCase();
    const found = routes.filter(
      (r) =>
        (f === "" ||
          r.from_area.toLowerCase().includes(f) ||
          r.from_name.toLowerCase().includes(f)) &&
        (t === "" || r.to_area.toLowerCase().includes(t))
    );
    setResults(sorted(found));
  }

  async function send(id, action) {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route_id: id, action, fare: newFare[id] }),
    });
    const data = await res.json();
    setMessages({ ...messages, [id]: data.message });
    setNewFare({ ...newFare, [id]: "" });
    loadRoutes();
  }

  function updateCalc(id, field, value) {
    setCalc({ ...calc, [id]: { ...calc[id], [field]: value } });
  }

  function calcResult(id, fare) {
    const c = calc[id] || {};
    const people = Number(c.people) || 0;
    const cash = Number(c.cash) || 0;
    const total = people * Number(fare);
    const change = cash - total;
    return { people, cash, total, change };
  }

  return (
    <main className="min-h-screen bg-white text-black p-5 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Taxi Finder</h1>
      <p className="text-lg mb-4">Find your taxi, where to wait, and what to pay.</p>

      <a
        href="/map"
        className="block text-center bg-black text-white text-lg font-bold rounded-lg p-3 mb-4"
      >
        Pin my drop-off on a map
      </a>

      <div className="flex gap-2 mb-6">
        <a href="/signup" className="flex-1 text-center bg-gray-200 text-black text-lg font-bold rounded-lg p-3">
          Sign up
        </a>
        <a href="/login" className="flex-1 text-center bg-gray-200 text-black text-lg font-bold rounded-lg p-3">
          Log in
        </a>
      </div>

      <button
        onClick={useMyLocation}
        className="w-full bg-blue-700 text-white text-xl font-bold rounded-lg p-4 mb-3"
      >
        Use my location
      </button>
      {locMsg && <p className="text-lg mb-4 font-semibold">{locMsg}</p>}

      <label className="block text-xl font-semibold mb-1">Where are you?</label>
      <input
        className="w-full border-2 border-black rounded-lg p-4 text-xl mb-4"
        placeholder="e.g. Sunnyside"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />

      <label className="block text-xl font-semibold mb-1">Where are you going?</label>
      <input
        className="w-full border-2 border-black rounded-lg p-4 text-xl mb-4"
        placeholder="e.g. CBD"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <button
        onClick={search}
        className="w-full bg-green-700 text-white text-2xl font-bold rounded-lg p-4 mb-8"
      >
        Find Taxi
      </button>

      {results !== null && results.length === 0 && (
        <p className="text-xl">No taxis found. Try different words.</p>
      )}

      {results &&
        results.map((r) => {
          const { people, cash, total, change } = calcResult(r.id, r.fare);
          const away =
            myPos && r.latitude && r.longitude
              ? distanceMeters(myPos.lat, myPos.lon, r.latitude, r.longitude)
              : null;
          return (
            <div key={r.id} className="border-2 border-black rounded-lg p-4 mb-4">
              <p className="text-2xl font-bold">
                {r.from_name} to {r.to_area}
              </p>
              <p className="text-lg mt-1">
                {r.type === "rank" ? "Taxi rank" : "Roadside spot"} in {r.from_area}
                {away !== null && ` · ${away} m away`}
              </p>
              <p className="text-2xl font-bold mt-3">Pay about R{r.fare}</p>
              <p className="text-lg mt-1">
                {r.confirmations > 0
                  ? `Confirmed by ${r.confirmations} ${r.confirmations === 1 ? "person" : "people"}`
                  : "Not yet verified"}
                {r.last_verified && ` · Last verified ${String(r.last_verified).slice(0, 10)}`}
              </p>
              <p className="text-lg mt-3">
                <b>Hand sign:</b> {r.hand_sign}
              </p>
              <p className="text-lg">
                <b>Tip:</b> {r.tip}
              </p>
              {r.phrases && (
                <p className="text-lg mt-2">
                  <b>What to say:</b> {r.phrases}
                </p>
              )}

              <button
                onClick={() => setCalcOpen(calcOpen === r.id ? null : r.id)}
                className="w-full bg-yellow-400 text-black text-lg font-bold rounded-lg p-3 mt-3"
              >
                {calcOpen === r.id ? "Close calculator" : "I'm collecting the fare"}
              </button>

              {calcOpen === r.id && (
                <div className="border-2 border-black rounded-lg p-4 mt-3 bg-gray-50">
                  <p className="text-xl font-bold mb-2">Fare calculator</p>
                  <label className="block text-lg font-semibold mb-1">
                    How many people?
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full border-2 border-black rounded-lg p-3 text-xl mb-3"
                    placeholder="e.g. 5"
                    value={calc[r.id]?.people || ""}
                    onChange={(e) => updateCalc(r.id, "people", e.target.value)}
                  />
                  <label className="block text-lg font-semibold mb-1">
                    Cash received (R)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full border-2 border-black rounded-lg p-3 text-xl mb-3"
                    placeholder="e.g. 100"
                    value={calc[r.id]?.cash || ""}
                    onChange={(e) => updateCalc(r.id, "cash", e.target.value)}
                  />
                  {people > 0 && (
                    <div className="text-xl">
                      <p>
                        <b>Total fare:</b> R{total}
                      </p>
                      {change >= 0 ? (
                        <p className="font-bold text-green-800">
                          Give back: R{change}
                        </p>
                      ) : (
                        <p className="font-bold text-red-700">
                          Short by: R{Math.abs(change)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <a
                href={r.maps_link}
                target="_blank"
                className="block text-center bg-blue-700 text-white text-xl font-bold rounded-lg p-3 mt-4"
              >
                Open in Google Maps
              </a>

              <div className="border-t-2 border-black mt-4 pt-4">
                <button
                  onClick={() => send(r.id, "confirm")}
                  className="w-full bg-green-700 text-white text-xl font-bold rounded-lg p-3 mb-3"
                >
                  Yes, this fare is right
                </button>
                <p className="text-lg font-semibold mb-1">Paid something different?</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 border-2 border-black rounded-lg p-3 text-xl"
                    placeholder="Fare in R"
                    value={newFare[r.id] || ""}
                    onChange={(e) => setNewFare({ ...newFare, [r.id]: e.target.value })}
                  />
                  <button
                    onClick={() => send(r.id, "report")}
                    className="bg-black text-white text-xl font-bold rounded-lg px-4"
                  >
                    Report
                  </button>
                </div>
                {messages[r.id] && (
                  <p className="text-lg mt-3 font-semibold">{messages[r.id]}</p>
                )}
              </div>
            </div>
          );
        })}
    </main>
  );
}