"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "../components/Link.jsx";
import { indoreDirectory } from "../data/mockData.js";

function cleanCity(value) {
  const city = String(value || "Indore").trim().replace(/\s+/g, " ");
  return city.slice(0, 80) || "Indore";
}

export default function CityPage({ cityName = null }) {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedFromUrl = urlParams.get("name");
  const requestedService = String(urlParams.get("service") || "").trim();
  const requestedLocality = String(urlParams.get("locality") || "").trim();
  const requestedRadius = String(urlParams.get("radius") || "").trim();
  const requestedAvailability = String(urlParams.get("availability") || "").trim();
  const requestedHomeVisit = String(urlParams.get("homeVisit") || "").trim();
  const city = cleanCity(cityName || requestedFromUrl || "Indore");
  const hasSourcedDirectory = city.toLowerCase() === "indore";
  const sourceDirectory = hasSourcedDirectory ? indoreDirectory : [];

  const serviceCategory = requestedService === "Shelter" || requestedService === "NGO or rescuer" ? "NGO & Shelter" : "All";
  const serviceQueryMap = {
    "Veterinary care": "veterinary",
    "24/7 emergency vet": "veterinary",
    "Animal transport": "transport",
    "Training or behaviour support": "training behaviour",
  };
  const [category, setCategory] = useState(serviceCategory);
  const [query, setQuery] = useState(serviceQueryMap[requestedService] || "");
  const [petSummary, setPetSummary] = useState({ total: 0, real: 0, demo: 0, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ city, page: "1", pageSize: "6" });
    fetch(`/api/catalog?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load city records.");
        return response.json();
      })
      .then((data) => {
        setPetSummary({
          total: Number(data.total || 0),
          real: Number(data.realTotal || 0),
          demo: Number(data.demoTotal || 0),
          loading: false,
        });
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setPetSummary({ total: 0, real: 0, demo: 0, loading: false });
        }
      });
    return () => controller.abort();
  }, [city]);

  const categories = ["All", ...new Set(sourceDirectory.map((record) => record.category))];
  const records = useMemo(
    () => sourceDirectory.filter((record) =>
      (category === "All" || record.category === category) &&
      `${record.name} ${record.services.join(" ")} ${record.locality}`.toLowerCase().includes(query.toLowerCase())
    ),
    [sourceDirectory, category, query]
  );

  const cityParam = encodeURIComponent(city);
  const rescuerTarget = `/dashboard?tab=${encodeURIComponent("Rescue & help")}&purpose=rescuer&city=${cityParam}`;
  const rescuerSignup = `/signup?purpose=rescuer&city=${cityParam}&return_to=${encodeURIComponent(rescuerTarget)}`;
  const fosterTarget = `/dashboard?tab=${encodeURIComponent("Foster")}&purpose=foster&city=${cityParam}`;
  const fosterSignup = `/signup?purpose=foster&city=${cityParam}&return_to=${encodeURIComponent(fosterTarget)}`;

  return <main className="city-page">
    <header className="city-header">
      <Link className="brand" href="/"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></Link>
      <Link href="/dashboard">My dashboard</Link>
    </header>

    <section className="city-hero">
      <span>EXPLORE YOUR CITY</span>
      <h1>Pet adoption and animal help in {city}</h1>
      <p>Discover adoptable pets and move to the right local support journey. Sourced organization listings are shown only where Adoptvilla currently has records it can attribute to a source.</p>
    </section>

    <section className="city-emergency">
      <b>Animal emergency?</b>
      <p>Contact an appropriate veterinarian or organization directly. Confirm availability before travelling. Adoptvilla does not dispatch or guarantee a rescue response.</p>
    </section>

    <section className="city-overview" aria-label={`${city} animal-support overview`}>
      <div className="city-stat-grid">
        <article><b>{petSummary.loading ? "…" : (petSummary.real || petSummary.demo || 0)}</b><span>Adoptable pet records</span></article>
        <article><b>{sourceDirectory.length}</b><span>Sourced local resources</span></article>
        <article><b>{city}</b><span>Selected city</span></article>
      </div>
      <div className="city-ecosystem-links">
        <a href={`/?city=${cityParam}#pets`}><span>♡</span><b>Adoptable Pets</b></a>
        <a href={`/?city=${cityParam}#cities`}><span>⌂</span><b>Rehome</b></a>
        <a href={fosterSignup}><span>♡</span><b>Foster</b></a>
        <a href={`/dashboard?tab=${encodeURIComponent("Rescue & help")}&city=${cityParam}`}><span>＋</span><b>Rescue Cases</b></a>
        <a href={`/dashboard?tab=${encodeURIComponent("Lost & found")}&city=${cityParam}`}><span>⌖</span><b>Lost & Found</b></a>
        <a href={rescuerSignup}><span>✦</span><b>Rescuers</b></a>
        <a href="#local-resources"><span>▦</span><b>NGOs & Shelters</b></a>
        <a href="#local-resources"><span>✚</span><b>Vets & Pet Services</b></a>
      </div>
    </section>

    <section className="city-directory" id="local-resources">
      <div className="city-directory-heading">
        <span className="kicker">LOCAL ANIMAL SUPPORT</span>
        <h2>Sourced resources in {city}</h2>
        <p>Listings are shown only when a source is available. A listing is not an endorsement, and service availability should always be confirmed directly.</p>
        {requestedService && <div className="city-request-summary" role="status"><b>Looking for: {requestedService}</b><span>{[requestedLocality, requestedRadius, requestedAvailability, requestedHomeVisit && requestedHomeVisit !== "No preference" ? `Home visit: ${requestedHomeVisit}` : ""].filter(Boolean).join(" · ") || city}</span><a href={`/city?name=${cityParam}`}>Clear requested service</a></div>}
      </div>

      {sourceDirectory.length > 0 ? <>
        <div className="city-filters">
          <label className="city-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={requestedService ? `Refine ${requestedService.toLowerCase()} results…` : "Search rescue, shelter, wildlife…"} aria-label={`Search ${city} directory`}/></label>
          <div className="city-filter-pills">{categories.map((item) => <button className={category === item ? "active" : ""} aria-pressed={category === item} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        </div>
        <div className="directory-cards">{records.map((record) => <article key={record.id}>
          <div><span>{record.category}</span><em>{record.verificationStatus.replaceAll("_", " ")}</em></div>
          <h2>{record.name}</h2>
          <p>{record.locality}</p>
          <ul>{record.services.map((service) => <li key={service}>{service}</li>)}</ul>
          <small>{record.note}</small>
          <div className="directory-card-actions"><a href={record.website} target="_blank" rel="noreferrer">Visit organization →</a><a href={record.sourceUrl} target="_blank" rel="noreferrer">Source: {record.sourceLabel}</a></div>
        </article>)}</div>
        {!records.length && <div className="record-empty">No sourced records match these filters.</div>}
      </> : <div className="city-directory-empty">
        <b>No sourced local service directory is published for {city} yet.</b>
        <p>You can still browse available pets for {city}, create a lost/found or rescue report, register as a foster, or return to the city search. Adoptvilla will not invent local organizations where sourced records are unavailable.</p>
        <div><a className="primary" href={`/?city=${cityParam}#pets`}>Browse pets in {city} →</a><a href="/#cities">Choose another city</a></div>
      </div>}
    </section>

    <section className="directory-correction">
      <h2>Is something wrong or is this your organization?</h2>
      <p>Sign in to submit a correction or profile claim. Submissions are reviewed before public information changes.</p>
      <a className="primary" href={`/login?return_to=${encodeURIComponent(`/dashboard?tab=Directory corrections&city=${city}`)}`}>Sign in to suggest a correction →</a>
    </section>
  </main>;
}
