"use client";
import { useEffect, useState } from "react";
import { faqCategories } from "../data/faqData.js";
const savedStorageKey = "adoptvilla-saved-pets-v1";
const matchStorageKey = "adoptvilla-compatibility-profile-v1";
const defaultMatchProfile = { city: "Indore", routine: "Office / hybrid", alone: "4–6 hours", home: "Apartment", tenure: "Owned", agreement: "Yes", exercise: "30–60 minutes", experience: "First-time pet parent", discoverability: "Verified custodians may invite me" };
const homeFaqItems = [faqCategories[0].items[0], faqCategories[1].items[0], faqCategories[2].items[0], faqCategories[4].items[7], faqCategories[6].items[0], faqCategories[7].items[5]];
export default function Home({ isAuthenticated = false }) {
    const [catalogPets, setCatalogPets] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogTotal, setCatalogTotal] = useState({ all: 0, real: 0, demo: 0 });
    const [catalogPage, setCatalogPage] = useState(1);
    const [catalogHasMore, setCatalogHasMore] = useState(false);
    const [cities, setCities] = useState([]);
    const [promotions, setPromotions] = useState({ adopter: null, pet: null });
    const [networkMetrics, setNetworkMetrics] = useState({ petsListed: 0, adoptionDone: 0, fosterHomes: 0, partners: 0 });
    const [query, setQuery] = useState("");
    const [type, setType] = useState("All");
    const [city, setCity] = useState("All cities");
    const [cityQuery, setCityQuery] = useState(() => new URLSearchParams(window.location.search).get("city") || "");
    const [cityExplorerOpen, setCityExplorerOpen] = useState(false);
    const [saved, setSaved] = useState([]);
    const [accountSaves, setAccountSaves] = useState(false);
    const [journey, setJourney] = useState(null);
    const [step, setStep] = useState(0);
    const [toast, setToast] = useState("");
    const [menu, setMenu] = useState(false);
    const [listingSpecies, setListingSpecies] = useState("Dog");
    const [otherSpecies, setOtherSpecies] = useState("");
    const [matchProfile, setMatchProfile] = useState(defaultMatchProfile);
    const [rescueRequest, setRescueRequest] = useState({ danger: "", locality: "", callback: "", need: "" });
    const [offerRequest, setOfferRequest] = useState({ ways: [], availability: "Weekends", radius: "Within 5 km", limits: "", city: "Indore", locality: "", alerts: "Immediate needs only" });
    const [serviceRequest, setServiceRequest] = useState({
        need: "",
        city: "",
        locality: "",
        radius: "Within 5 km",
        availability: "Open now",
        homeVisit: "No preference",
        accessibility: "",
    });
    useEffect(() => {
        const localTimer = window.setTimeout(() => {
            var _a;
            try {
                const local = JSON.parse((_a = window.localStorage.getItem(savedStorageKey)) !== null && _a !== void 0 ? _a : "[]");
                if (Array.isArray(local))
                    setSaved(local.map(String));
            }
            catch (_b) {
                // Invalid device storage is safely ignored.
            }
        }, 0);
        fetch("/api/platform?resource=saved-pets")
            .then(async (response) => {
            if (!response.ok)
                return;
            const data = await response.json();
            setAccountSaves(true);
            setSaved((current) => {
                var _a;
                const merged = [...new Set([...current, ...((_a = data.petIds) !== null && _a !== void 0 ? _a : [])])];
                window.localStorage.setItem(savedStorageKey, JSON.stringify(merged));
                return merged;
            });
        })
            .catch(() => undefined);
        return () => window.clearTimeout(localTimer);
    }, []);
    useEffect(() => {
        let active = true;
        fetch("/api/platform?resource=public-metrics")
            .then(async (response) => {
                if (!response.ok) return;
                const data = await response.json();
                if (!active) return;
                setNetworkMetrics({
                    petsListed: Number(data.petsListed || 0),
                    adoptionDone: Number(data.adoptionDone || 0),
                    fosterHomes: Number(data.fosterHomes || 0),
                    partners: Number(data.partners || 0),
                });
            })
            .catch(() => undefined);
        return () => { active = false; };
    }, []);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            var _a;
            try {
                const stored = JSON.parse((_a = window.localStorage.getItem(matchStorageKey)) !== null && _a !== void 0 ? _a : "null");
                if (stored)
                    setMatchProfile(Object.assign(Object.assign({}, defaultMatchProfile), stored));
            }
            catch (_b) {
                // Invalid device storage is safely ignored.
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setCatalogLoading(true);
            try {
                const params = new URLSearchParams({ q: query, species: type, city, page: "1", pageSize: "12" });
                const response = await fetch(`/api/catalog?${params}`, { signal: controller.signal });
                if (!response.ok)
                    throw new Error();
                const data = await response.json();
                setCatalogPets(data.pets);
                setCatalogTotal({ all: data.total, real: data.realTotal, demo: data.demoTotal });
                setCatalogPage(data.page);
                setCatalogHasMore(data.hasMore);
                setCities(data.cities);
                setPromotions(data.promotions);
            }
            catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError"))
                    setCatalogPets([]);
            }
            finally {
                if (!controller.signal.aborted)
                    setCatalogLoading(false);
            }
        }, 220);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query, type, city]);
    useEffect(() => {
        const requested = cityQuery.trim();
        if (!requested || !cities.length || city !== "All cities") return;
        const match = cities.find((item) => item.name.toLowerCase() === requested.toLowerCase())
            || cities.find((item) => item.name.toLowerCase().includes(requested.toLowerCase()));
        if (match) {
            setCityQuery(match.name);
            setCity(match.name);
        }
    }, [cities, cityQuery, city]);

    const toggleSaved = async (petId) => {
        const wasSaved = saved.includes(petId);
        const next = wasSaved ? saved.filter((id) => id !== petId) : [...saved, petId];
        setSaved(next);
        window.localStorage.setItem(savedStorageKey, JSON.stringify(next));
        notify(wasSaved ? "Removed from saved pets." : accountSaves ? "Saved to your account." : "Saved on this device. Log in to keep it across devices.");
        if (!accountSaves)
            return;
        try {
            const response = await fetch("/api/platform", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "toggle-saved-pet", petId, saved: !wasSaved }),
            });
            if (!response.ok)
                throw new Error();
        }
        catch (_a) {
            setSaved(saved);
            window.localStorage.setItem(savedStorageKey, JSON.stringify(saved));
            notify("We could not update your account. Please try again.");
        }
    };
    const loadMore = async () => {
        const nextPage = catalogPage + 1;
        setCatalogLoading(true);
        try {
            const params = new URLSearchParams({ q: query, species: type, city, page: String(nextPage), pageSize: "12" });
            const response = await fetch(`/api/catalog?${params}`);
            if (!response.ok)
                throw new Error();
            const data = await response.json();
            setCatalogPets((current) => [...current, ...data.pets]);
            setCatalogPage(data.page);
            setCatalogHasMore(data.hasMore);
        }
        catch (_a) {
            notify("More pets could not be loaded. Please try again.");
        }
        finally {
            setCatalogLoading(false);
        }
    };
    const notify = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(""), 2600);
    };
    const start = (value, options = {}) => {
        if (value === "offer") {
            const currentCity = options.city || cityQuery.trim() || (city !== "All cities" ? city : "Indore");
            setOfferRequest({ ways: [], availability: "Weekends", radius: "Within 5 km", limits: "", city: currentCity, locality: "", alerts: "Immediate needs only" });
        }
        if (value === "services") {
            const currentCity = options.city || cityQuery.trim() || (city !== "All cities" ? city : "Indore");
            setServiceRequest((current) => ({
                ...current,
                need: options.need || "",
                city: currentCity,
                locality: "",
                radius: "Within 5 km",
                availability: "Open now",
                homeVisit: "No preference",
                accessibility: "",
            }));
        }
        setJourney(value);
        setStep(0);
    };
    const submitSearch = (event) => {
        var _a;
        event.preventDefault();
        (_a = document.querySelector("#pets")) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    };
    const submitCitySearch = (event) => {
        event.preventDefault();
        const requested = cityQuery.trim();
        if (!requested) {
            notify("Enter a city to explore local animal support.");
            return;
        }
        const match = cities.find((item) => item.name.toLowerCase() === requested.toLowerCase()) || cities.find((item) => item.name.toLowerCase().includes(requested.toLowerCase()));
        const resolvedCity = match?.name || requested.replace(/\s+/g, " ").trim();
        setCityQuery(resolvedCity);
        setCity(match?.name || resolvedCity);
        setCityExplorerOpen(true);
    };
    const showCityPets = () => {
        const requested = cityQuery.trim();
        const match = cities.find((item) => item.name.toLowerCase() === requested.toLowerCase()) || cities.find((item) => item.name.toLowerCase().includes(requested.toLowerCase()));
        if (match) setCity(match.name);
        document.querySelector("#pets")?.scrollIntoView({ behavior: "smooth" });
    };
    const selectedCityName = cityQuery.trim() || (city !== "All cities" ? city : "Indore");
    const rescuerReturnTarget = `/dashboard?tab=${encodeURIComponent("Rescue & help")}&purpose=rescuer&city=${encodeURIComponent(selectedCityName)}`;
    const rescuerSignupHref = `/signup?purpose=rescuer&city=${encodeURIComponent(selectedCityName)}&return_to=${encodeURIComponent(rescuerReturnTarget)}`;
    const fosterReturnTarget = `/dashboard?tab=${encodeURIComponent("Foster")}&purpose=foster&city=${encodeURIComponent(selectedCityName)}`;
    const fosterSignupHref = `/signup?purpose=foster&city=${encodeURIComponent(selectedCityName)}&return_to=${encodeURIComponent(fosterReturnTarget)}`;
    const rescuerEntryHref = isAuthenticated ? rescuerReturnTarget : rescuerSignupHref;
    const fosterEntryHref = isAuthenticated ? fosterReturnTarget : fosterSignupHref;
    const serviceDirectoryParams = new URLSearchParams({
        name: serviceRequest.city.trim() || selectedCityName,
        service: serviceRequest.need,
        radius: serviceRequest.radius,
        availability: serviceRequest.availability,
        homeVisit: serviceRequest.homeVisit,
    });
    if (serviceRequest.locality.trim()) serviceDirectoryParams.set("locality", serviceRequest.locality.trim());
    if (serviceRequest.accessibility.trim()) serviceDirectoryParams.set("accessibility", serviceRequest.accessibility.trim());
    const serviceDirectoryHref = `/city?${serviceDirectoryParams.toString()}`;
    const updateServiceRequest = (field, value) => {
        setServiceRequest((current) => ({ ...current, [field]: value }));
    };
    const updateOfferRequest = (field, value) => setOfferRequest((current) => ({ ...current, [field]: value }));
    const toggleOfferWay = (value) => setOfferRequest((current) => ({ ...current, ways: current.ways.includes(value) ? current.ways.filter((item) => item !== value) : [...current.ways, value] }));
    const offerDestinationHref = offerRequest.ways.length === 1 && offerRequest.ways.includes("Foster temporarily") ? fosterEntryHref : rescuerEntryHref;

    const updateMatchProfile = (field, value) => {
        setMatchProfile((current) => (Object.assign(Object.assign({}, current), { [field]: value })));
    };
    const compatibilityResults = catalogPets.map((pet) => {
        let score = 62;
        const strengths = [];
        const considerations = [];
        if (pet.city === matchProfile.city) {
            score += 10;
            strengths.push(`Located in ${pet.city}, making introductions easier`);
        }
        else
            considerations.push(`Currently in ${pet.city}; transport may need coordination`);
        if (matchProfile.home === "Apartment" && pet.tags.some((tag) => /apartment|indoor|small home/i.test(tag))) {
            score += 8;
            strengths.push("Profile indicates apartment suitability");
        }
        if (matchProfile.home === "Shared accommodation") {
            score -= 5;
            considerations.push("Shared-home consent and stability should be confirmed");
        }
        if (matchProfile.tenure === "Rented")
            considerations.push("Written landlord approval should be confirmed before adoption");
        if (matchProfile.agreement !== "Yes") {
            score -= 22;
            considerations.push("Every adult must agree before placement can proceed");
        }
        const highEnergy = /high|very high/i.test(pet.energy);
        const exerciseMinutes = matchProfile.exercise === "90+ minutes" ? 100 : matchProfile.exercise === "60–90 minutes" ? 75 : 45;
        if (highEnergy && exerciseMinutes >= 75) {
            score += 9;
            strengths.push("Your exercise commitment fits this pet’s energy");
        }
        else if (highEnergy) {
            score -= 12;
            considerations.push(`${pet.name} has ${pet.energy.toLowerCase()} energy and may need more daily activity`);
        }
        else if (exerciseMinutes <= 60) {
            score += 6;
            strengths.push("Energy needs appear compatible with your routine");
        }
        if (matchProfile.alone === "7+ hours") {
            score -= 12;
            considerations.push("Long periods alone require a specific care and enrichment plan");
        }
        else if (matchProfile.alone === "Under 2 hours" || matchProfile.alone === "2–4 hours") {
            score += 6;
            strengths.push("Your available companionship supports easier adjustment");
        }
        if (matchProfile.experience === "First-time pet parent" && pet.tags.some((tag) => /first.?time|trained|calm|gentle/i.test(tag))) {
            score += 7;
            strengths.push("Profile suggests a manageable first-time-parent fit");
        }
        if (/experienced/i.test(pet.consider) && matchProfile.experience === "First-time pet parent") {
            score -= 12;
            considerations.push(pet.consider);
        }
        return { pet, score: Math.max(30, Math.min(97, score)), strengths: strengths.slice(0, 3), considerations: considerations.slice(0, 3) };
    }).sort((a, b) => b.score - a.score);
    const finishCompatibilityProfile = () => {
        window.localStorage.setItem(matchStorageKey, JSON.stringify(matchProfile));
        setStep(3);
    };
    return (<main className="public-home">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ADOPTVILLA home">
          <img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/>
          <span className="brand-divider" aria-hidden="true"/>
          <span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span>
        </a>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Open navigation">Menu</button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
          <a href="#pets" onClick={() => setMenu(false)}>Adopt</a>
          <a href="#matching" onClick={() => setMenu(false)}>AI Match</a>
          <button onClick={() => start("list")}>Rehome</button>
          <a href="/dashboard?tab=Lost%20%26%20found" onClick={() => setMenu(false)}>Lost & Found</a>
          <a href="#help" onClick={() => setMenu(false)}>Rescue & Emergency</a>
          <a href="#cities" onClick={() => setMenu(false)}>Explore your city</a>
          <a href="/faq" onClick={() => setMenu(false)}>FAQs</a>
        </nav>
       <a
  className="login"
  href={
    isAuthenticated
      ? "/dashboard"
      : "/login?return_to=%2Fdashboard"
  }
>
  {isAuthenticated ? "Dashboard" : "Log in"}
</a>
      </header>


      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">INDIA’S ONLY INTELLIGENT AI POWERED PET ADOPTION &amp; SUPPORT NETWORK</div>
          <h1>Adopt love.<br /><em>Re-home. Foster. Support.</em></h1>
          <p className="lead">Helping pets find the right homes, helping families find the right companions, and making responsible pet care easier along the way.</p>
          <div className="hero-cta-row">
            <button className="hero-cta primary-cta" onClick={() => start("adopt")}>Find my match</button>
            <button className="hero-cta secondary-cta" onClick={() => start("list")}>Rehome responsibly</button>
            <a className="hero-cta outline-cta" href="#help">Need animal help</a>
          </div>
          <form className="search hero-search" onSubmit={submitSearch}>
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Describe the pet you are looking for" placeholder="Try “calm apartment dog in Indore”"/>
            <button>Search</button>
          </form>
          <div className="hero-trust-row" aria-label="AdoptVilla principles">
            <span><b>✓</b> Free to browse</span>
            <span><b>✓</b> Welfare-led matching</span>
            <span><b>✓</b> Privacy by design</span>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/pets/Home.jpeg" alt="Dogs" />
         
        </div>
      </section>

      <section className="home-services" aria-labelledby="home-services-title">
        <div className="home-section-heading centered">
          <span className="kicker">EVERYTHING YOU NEED TO HELP A PET FIND THE RIGHT HOME</span>
          <h2 id="home-services-title">Start with what brings you here</h2>
          <p>Whether you're looking to adopt, re-home your pet, foster an animal or find help for a pet in need, CRM for your Shelter or NGO, Adoptvilla helps you take the next responsible step.</p>
        </div>
        <div className="home-service-grid">
          <button className="home-service-card" onClick={() => start("adopt")}><span>♡</span><h3>Find Your Match</h3><p>Looking for a pet to join your family? Tell us about your lifestyle and discover pets that could be a good fit for your home.</p><em>Find Your Match →</em></button>
          <button className="home-service-card" onClick={() => start("list")}><span>⌂</span><h3>Rehome Responsibly</h3><p>Can't keep your pet? Help them find another loving home. Create a detailed profile and connect with people who may be the right family for your pet.</p><em>Start Rehoming →</em></button>
          <a className="home-service-card" href="/dashboard?tab=Lost%20%26%20found"><span>⌖</span><h3>Lost &amp; Found</h3><p>Lost a pet or found one without a family? Create or discover community reports and help reunite pets with the people who love them.</p><em>View Lost &amp; Found →</em></a>
          <button className="home-service-card" onClick={() => start("rescue")}><span>＋</span><h3>Rescue &amp; Emergency Help</h3><p>Found an animal that needs immediate help? Find relevant rescue organisations, shelters, vets and other support available in your area.</p><em>Find Help →</em></button>
          <button className="home-service-card" onClick={() => start("services")}><span>✚</span><h3>Find Pet Care &amp; Support</h3><p>Looking for trusted help for your pet? Discover vets, shelters, NGOs, trainers, groomers, boarding facilities and other animal services by city.</p><em>Explore Pet Services →</em></button>
          <a className="home-service-card" href="/shelter-crm"><span>▦</span><h3>Shelter &amp; NGO CRM</h3><p>Run your rescue work in one place. Manage animals, adoption enquiries, foster homes, volunteers, medical records and follow-ups from one simple platform.</p><em>Explore Shelter CRM →</em></a>
          <a className="home-service-card" href="/foster"><span>♡</span><h3>Become a Foster</h3><p>Give a pet a safe place while they wait for their forever home. Register as a foster and help provide temporary care, comfort and stability to a pet in need.</p><em>Become a Foster →</em></a>
          <a className="home-service-card" href="/rescuer"><span>✦</span><h3>Register as An Animal Rescuer</h3><p>You don't need to run an NGO to make a difference. Rescue, help and support animals in your community—and connect with people who can help.</p><em>Register as a Rescuer →</em></a>
        </div>
      </section>

      <section className="journey-map home-process" aria-labelledby="journey-map-title">
        <div><span className="kicker">ONE PLATFORM. EVERY STEP THAT MATTERS.</span><h2 id="journey-map-title">Know How it works.</h2><p>Adoptvilla helps you take the right next step — whether you're adopting, rehoming, fostering, rescuing or looking for help.</p></div>
        <ol>
          <li><span>1</span><b>Tell us what you need</b><small>Choose what brings you to Adoptvilla — find a pet, rehome, foster, rescue or get help.</small></li>
          <li><span>2</span><b>Discover your options</b><small>Explore pets, people and animal-support resources relevant to your situation.</small></li>
          <li><span>3</span><b>Find the right match</b><small>Compare profiles, understand each pet's needs and connect with the people involved.</small></li>
          <li><span>4</span><b>Connect responsibly</b><small>Communicate, ask questions and share information securely before making a decision.</small></li>
          <li><span>5</span><b>Take the next step</b><small>Adopt, rehome, foster, rescue or get the help needed — with the pet's welfare at the centre.</small></li>
        </ol>
      </section>

      <section className="promo" aria-label="Founding 100 offer">
        <div><span>FOUNDING OFFER</span><b>{promotions.adopter || promotions.pet ? "Eligible early members join free" : "Launch promotion is not currently active"}</b><small>Only confirmed activations and approved publications consume a slot</small></div>
        <div className="counter">{promotions.adopter ? <><b>{promotions.adopter.confirmed}</b><span>/ {promotions.adopter.limit}</span><small>Confirmed adopter activations · {promotions.adopter.remaining} remaining</small></> : <><b>—</b><small>Adopter campaign inactive</small></>}</div>
        <div className="counter">{promotions.pet ? <><b>{promotions.pet.confirmed}</b><span>/ {promotions.pet.limit}</span><small>Approved pets published · {promotions.pet.remaining} remaining</small></> : <><b>—</b><small>Pet campaign inactive</small></>}</div>
        <a className="promo-action" href="/login?return_to=%2Fdashboard%3Ftab%3DActivation%2520%2526%2520payment">Check eligibility →</a>
      </section>

      <section className="section" id="pets">
        <div className="section-heading">
          <div><span className="kicker">MEET YOUR MATCH</span><h2>Pets who may fit your life</h2><p>Every recommendation combines safety rules, lifestyle fit and honest care needs.</p></div>
          <a href="#matching">How matching works →</a>
        </div>
        <div className="filters" aria-label="Pet filters">
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Species"><option>All</option><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option></select>
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City"><option>All cities</option>{cities.map((item) => <option key={item.name}>{item.name}</option>)}</select>
          <button onClick={() => { setType("All"); setCity("All cities"); setQuery(""); }}>Clear filters</button>
          <span>{catalogTotal.real ? `${catalogTotal.real} available pet${catalogTotal.real === 1 ? "" : "s"}` : catalogTotal.demo ? `${catalogTotal.demo} clearly labelled demonstration record${catalogTotal.demo === 1 ? "" : "s"}` : "No published pets found"}</span>
        </div>
        {catalogTotal.demo > 0 && <div className="catalog-demo-note"><b>Testing records are clearly labelled.</b><span>They demonstrate matching and profile features; they are not accepting applications. Approved real listings appear here automatically.</span></div>}
        <div className="pet-grid">
          {catalogPets.map((pet) => (<article className="pet-card" key={pet.id}>
              <div className="pet-image">
                <img src={pet.image} alt={`${pet.name}, ${pet.age} ${pet.type.toLowerCase()}`}/>
                <span>{pet.demo ? "Demonstration record" : pet.photoPending ? "Published · photo pending" : "Published"}</span>
                <button aria-label={`${saved.includes(pet.id) ? "Remove" : "Save"} ${pet.name}`} onClick={() => toggleSaved(pet.id)}>{saved.includes(pet.id) ? "♥" : "♡"}</button>
              </div>
              <div className="pet-body">
                <div><h3>{pet.name}</h3><span>{pet.age} · {pet.sex}</span></div>
                <p>⌖ {pet.city} &nbsp; · &nbsp; {pet.energy} energy</p>
                <div className="tags">{pet.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <a href={`/pets/${encodeURIComponent(pet.id)}`}>View {pet.name}’s full profile <span>→</span></a>
              </div>
            </article>))}
        </div>
        {catalogLoading && !catalogPets.length && <div className="empty" role="status"><b>Loading published pet records…</b><p>We are checking current availability.</p></div>}
        {!catalogLoading && !catalogPets.length && <div className="empty"><b>No suitable pets found yet.</b><p>Broaden a filter or create a match alert—we will not pressure you into a poor fit.</p><button onClick={() => { setType("All"); setCity("All cities"); setQuery(""); }}>Show all pets</button></div>}
        {catalogHasMore && <div className="load-more"><button disabled={catalogLoading} onClick={loadMore}>{catalogLoading ? "Loading…" : "Show more pets"}</button></div>}
      </section>

      <section className="home-numbers" aria-labelledby="home-numbers-title">
        <div className="home-section-heading centered light-heading">
          <span className="kicker light">THE NUMBERS THAT MATTER</span>
          <h2 id="home-numbers-title">Every number represents a life, a connection or a second chance.</h2>
          <p>Adoptvilla is growing a network where responsible adoption goes beyond a listing — connecting pets, families, rescuers, foster homes, shelters and animal-care resources.</p>
        </div>
        <div className="home-number-grid">
          <article><b>{networkMetrics.petsListed || catalogTotal.real || catalogTotal.demo || 0}</b><span>Pets Listed</span><small>Current published platform records.</small></article>
          <article><b>{networkMetrics.adoptionDone}</b><span>Adoption Done</span><small>Recorded adoption journeys completed on the platform.</small></article>
          <article><b>{networkMetrics.fosterHomes}</b><span>Foster Homes</span><small>Registered foster profiles in the current platform network.</small></article>
          <article><b>{networkMetrics.partners || cities.reduce((total, item) => total + (item.resourceCount || 0), 0) || 0}</b><span>Rescue &amp; Welfare Partners</span><small>Organizations and sourced welfare partners in the current network.</small></article>
        </div>
      </section>

      <section className="matching" id="matching">
        <div>
          <span className="kicker">THE ADOPTVILLA DIFFERENCE</span>
          <h2>A two-way AI search engine to<br />Find the pet that's right for you — and the home that's right for them.</h2>
          <p>Adopters find compatible pets. Pet parents and rescuers, shelter find suitable adopters. Personal details stay private until both sides choose to connect.</p>
          <div className="principle"><b>Two-way matching</b><span>Your lifestyle profile and the pet's needs profile are compared in both directions.</span></div>
          <div className="principle"><b>Privacy by design</b><span>Personal details stay private until both sides choose to connect.</span></div>
          <button className="primary" onClick={() => start("adopt")}>Build my compatibility profile →</button>
        </div>
        <div className="match-flow">
          <div className="flow-card person"><span>YOUR PROFILE</span><b>Tell us about your lifestyle.</b><small>Home • Family • Experience • Routine • Preferences</small></div>
          <div className="flow-heart"><b>GOOD MATCH</b><small>100%</small></div>
          <div className="flow-card animal"><span>PET PROFILE</span><b>Understand what they need.</b><small>Personality • Health • Behaviour • Routine • Home requirements</small></div>
          <div className="flow-reasons"><b>Why this MATCH</b><span>Your lifestyle profile matches this pet's needs profile.</span></div>
        </div>
      </section>

      <section className="section cities" id="cities">
        <div className="section-heading"><div><span className="kicker">EXPLORE YOUR CITY</span><h2>Find animal support near you</h2><p>Discover adoptable pets, rescuers, shelters, NGOs, vets and other pet services in your city.</p></div></div>
        <form className="city-search-panel" onSubmit={submitCitySearch}>
          <label htmlFor="city-explorer">Where are you looking?</label>
          <div><span aria-hidden="true">⌕</span><input id="city-explorer" value={cityQuery} onChange={(event) => { setCityQuery(event.target.value); setCityExplorerOpen(false); }} placeholder="Enter your city" list="adoptvilla-city-options"/><button>Explore city</button></div>
          <small>e.g. Indore, Mumbai, Bengaluru...</small>
          <datalist id="adoptvilla-city-options">{cities.map((item) => <option value={item.name} key={item.name}/>)}</datalist>
        </form>
        {cityExplorerOpen && <div className="city-ecosystem">
          <div className="city-ecosystem-head"><b>{cityQuery.trim() || "Your city"}</b><span>Choose the support you need</span></div>
          <div className="city-ecosystem-grid">
            <button onClick={showCityPets}><span>♡</span><b>ADOPTABLE PETS</b></button>
            <button onClick={() => start("list")}><span>⌂</span><b>REHOME</b></button>
            <a href={fosterEntryHref}><span>♡</span><b>FOSTER</b></a>
            <a href={`/dashboard?tab=${encodeURIComponent("Rescue & help")}&city=${encodeURIComponent(selectedCityName)}`}><span>＋</span><b>RESCUE CASES</b></a>
            <a href={`/dashboard?tab=${encodeURIComponent("Lost & found")}&city=${encodeURIComponent(selectedCityName)}`}><span>⌖</span><b>LOST &amp; FOUND</b></a>
            <a href={rescuerEntryHref}><span>✦</span><b>RESCUERS</b></a>
            <button onClick={() => start("services", { need: "NGO or rescuer", city: selectedCityName })}><span>▦</span><b>NGOs &amp; SHELTERS</b></button>
            <button onClick={() => start("services", { need: "Veterinary care", city: selectedCityName })}><span>✚</span><b>VETS &amp; PET SERVICES</b></button>
          </div>
        </div>}
      </section>

      <section className="help" id="help">
        <div><span className="kicker light">NEED HELP WITH AN ANIMAL?</span><h2>Tell us what's happening. We'll help you find the next step.</h2><p>Whether you've lost a pet, found an animal in need, are struggling with your own pet, or need urgent veterinary help — start here.</p></div>
        <div className="help-actions">
          <a href="/dashboard?tab=Lost%20%26%20found"><span>⌕</span><b>I Lost My Pet</b><small>Tell the community about your missing pet and help bring them home. Report a Lost Pet →</small></a>
          <a href="/dashboard?tab=Lost%20%26%20found"><span>🐾</span><b>I Found a Pet</b><small>Found a lost, abandoned or injured animal? Tell us what you've found. Report a Found Pet →</small></a>
          <button onClick={() => start("services", { need: "Training or behaviour support" })}><span>⌂</span><b>I'm Struggling With My Pet</b><small>Having behaviour, care or other challenges with your pet? Explore support before considering rehoming. Find Support →</small></button>
          <button onClick={() => start("rescue")}><span>＋</span><b>I Need Urgent Help</b><small>Find nearby vets, rescuers, shelters and other animal-support resources. Find Help Near Me →</small></button>
        </div>
      </section>

      <section className="fee home-fee">
        <div><span className="kicker">WHY ₹99?</span><h2>A small step towards a serious commitment.</h2><p>The ₹99 platform fee helps keep Adoptvilla focused on genuine adopters and responsible pet listings. It supports the platform that helps pets and people connect safely and responsibly.</p></div>
        <div><b>₹99</b><span>Adopter Registration</span><small>Create your profile and apply to suitable pets.</small></div>
        <div><b>₹99</b><span>Adoption / Rehoming Listing</span><small>Create a pet profile and connect with potential adopters.</small></div>
        <p className="fee-disclaimer"><b>Please note:</b> The ₹99 fee is a platform participation fee. It is <strong>not a fee for the pet</strong> and does not guarantee a match, adoption, approval or acceptance of an application.</p>
      </section>

      <section className="home-faq" aria-labelledby="home-faq-title">
        <div className="home-section-heading centered">
          <span className="kicker">FREQUENTLY ASKED QUESTIONS</span>
          <h2 id="home-faq-title">Quick answers before you begin</h2>
          <p>Explore common questions about adoption, matching, fees, fostering, privacy, shelters, NGOs and responsible animal support.</p>
        </div>
        <div className="faq-list">
          {homeFaqItems.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </div>
        <div className="home-faq-more"><a href="/faq">Browse FAQ sections →</a></div>
      </section>

      <section className="home-final-cta">
        <span className="kicker light">READY FOR THE NEXT SAFE STEP?</span>
        <h2>Find the right home—not just any home.</h2>
        <p>Browse pets freely, build an explainable match profile or start a responsible rehoming journey.</p>
        <div>
          <button className="cta-gold" onClick={() => start("adopt")}>Find my match</button>
          <a className="cta-outline" href={fosterEntryHref}>Become a Foster</a>
          <button className="cta-outline" onClick={() => start("list")}>Rehome a pet</button>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-about">
            <div className="brand footer-brand"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider" aria-hidden="true"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></div>
            <p>A welfare-led network for adoption, responsible rehoming, local animal support and explainable compatibility.</p>
          </div>
          <div><b>Quick links</b><a href="#pets">Adopt</a><a href="#matching">AI Match</a><button onClick={() => start("list")}>Rehome</button><a href="#cities">Explore cities</a><a href="/faq">FAQs</a></div>
          <div><b>Animal support</b><a href="/dashboard?tab=Lost%20%26%20found">Lost &amp; Found</a><button onClick={() => start("rescue")}>Rescue &amp; Emergency</button><button onClick={() => start("offer")}>Offer your help</button><button onClick={() => start("services")}>Local care</button></div>
          <div><b>Your account</b><a href="/login?return_to=%2Fdashboard">Log in</a><a href="/signup">Create account</a><a href="/dashboard">Dashboard</a><a href="/indore">Indore directory</a></div>
        </div>
        <div className="footer-bottom"><span>
  © 2026{" "}
  <a href="https://kickstartxathleteunited.com/" target="_blank" rel="noopener noreferrer">
    AdoptVilla Powered By KickstartX .
  </a>
</span><span>Privacy by design · Welfare first · No commercial pet sales</span></div>
      </footer>

      {journey && <div className="modal-backdrop" role="presentation">
        <section className="modal journey-modal" role="dialog" aria-modal="true" aria-labelledby="journey-title">
          <button className="close" onClick={() => setJourney(null)} aria-label="Close">×</button>
          <div className="progress"><span style={{ width: `${Math.min(step + 1, 3) * 33.33}%` }}/></div>
          {journey === "adopt" && step < 3 && <JourneyAdopt step={step} profile={matchProfile} onChange={updateMatchProfile}/>}
          {journey === "adopt" && step === 3 && <CompatibilityResults results={compatibilityResults} saved={saved} onSave={toggleSaved}/>}
          {journey === "list" && <JourneyList step={step} cityName={selectedCityName} species={listingSpecies} otherSpecies={otherSpecies} onSpeciesChange={setListingSpecies} onOtherSpeciesChange={setOtherSpecies}/>}
          {journey === "rescue" && <JourneyRescue step={step} cityName={selectedCityName} request={rescueRequest} onChange={(field,value)=>setRescueRequest((current)=>({...current,[field]:value}))}/>}
          {journey === "offer" && <JourneyOffer step={step} request={offerRequest} onToggle={toggleOfferWay} onChange={updateOfferRequest}/>}
          {journey === "services" && <JourneyServices step={step} cityName={selectedCityName} request={serviceRequest} onChange={updateServiceRequest}/>}
          {!(journey === "adopt" && step === 3) && <div className="journey-actions">
            <button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < 2 ? <button className="primary" disabled={(journey === "list" && step === 1 && listingSpecies === "Other" && !otherSpecies.trim()) || (journey === "services" && step === 0 && !serviceRequest.need) || (journey === "services" && step === 1 && !serviceRequest.city.trim()) || (journey === "offer" && step === 0 && offerRequest.ways.length === 0) || (journey === "rescue" && step === 0 && !rescueRequest.danger)} onClick={() => setStep(step + 1)}>Continue →</button> : <button className="primary" onClick={() => {
                        if (journey === "rescue") {
                            if (!rescueRequest.need) {
                                notify("Choose the support that seems needed before routing this case.");
                                return;
                            }
                            const service = rescueRequest.need;
                            const params = new URLSearchParams({ name: selectedCityName, service });
                            if (rescueRequest.locality) params.set("locality", rescueRequest.locality);
                            window.location.href = `/city?${params.toString()}`;
                            return;
                        }
                        if (journey === "services") {
                            window.location.href = serviceDirectoryHref;
                            return;
                        }
                        if (journey === "adopt") {
                            finishCompatibilityProfile();
                            return;
                        }
                        if (journey === "list") {
                            window.location.href = "/login?return_to=%2Fdashboard%3Ftab%3DMy%2520animals";
                            return;
                        }
                        if (journey === "offer") {
                            window.location.href = offerDestinationHref;
                            return;
                        }
                    }}>{journey === "services" ? "Show sourced services →" : journey === "rescue" ? "Record and route this case →" : "Continue securely →"}</button>}
          </div>}
          {journey === "adopt" && step === 3 && <div className="journey-actions result-actions"><button onClick={() => setStep(0)}>Update answers</button><button className="primary" onClick={() => setJourney(null)}>Keep these matches →</button></div>}
          <small className="autosave">{journey === "adopt" && step === 3 ? "Your compatibility profile is saved on this device. Scores guide discovery; they do not replace welfare screening or approval." : "This short guide does not publish, charge or contact anyone. Continue securely to save a real private record."}</small>
        </section>
      </div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>);
}
function JourneyAdopt({ step, profile, onChange }) {
    return <div className="journey-content">
    <span className="kicker">ADOPTER PROFILE · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["Tell us about your life", "What does home look like?", "What kind of care can you offer?"][step]}</h2>
    <p>{["We match daily reality—not an idealised version of it.", "Private details are never shown in a public directory.", "Preferences guide the match; safety and suitability come first."][step]}</p>
    {step === 0 && <div className="form-grid"><label>City<input value={profile.city} onChange={(event) => onChange("city", event.target.value)}/></label><label>Normal weekday<select value={profile.routine} onChange={(event) => onChange("routine", event.target.value)}><option>Work from home</option><option>Office / hybrid</option><option>Variable schedule</option></select></label><label className="wide">Hours a pet would usually be alone<select value={profile.alone} onChange={(event) => onChange("alone", event.target.value)}><option>Under 2 hours</option><option>2–4 hours</option><option>4–6 hours</option><option>7+ hours</option></select></label></div>}
    {step === 1 && <div className="form-grid"><label>Home type<select value={profile.home} onChange={(event) => onChange("home", event.target.value)}><option>Apartment</option><option>Independent home</option><option>Shared accommodation</option></select></label><label>Tenure<select value={profile.tenure} onChange={(event) => onChange("tenure", event.target.value)}><option>Owned</option><option>Rented</option><option>Family-owned</option></select></label><label className="wide">Does every adult agree?<select value={profile.agreement} onChange={(event) => onChange("agreement", event.target.value)}><option>Yes</option><option>Not yet discussed</option><option>No</option></select></label></div>}
    {step === 2 && <div className="form-grid"><label>Daily exercise time<select value={profile.exercise} onChange={(event) => onChange("exercise", event.target.value)}><option>30–60 minutes</option><option>60–90 minutes</option><option>90+ minutes</option></select></label><label>Experience<select value={profile.experience} onChange={(event) => onChange("experience", event.target.value)}><option>First-time pet parent</option><option>Some experience</option><option>Experienced</option></select></label><label className="wide">Discoverability<select value={profile.discoverability} onChange={(event) => onChange("discoverability", event.target.value)}><option>Verified custodians may invite me</option><option>Verified NGOs/shelters only</option><option>I will search myself</option></select></label></div>}
  </div>;
}
function CompatibilityResults({ results, saved, onSave }) {
    return <div className="journey-content compatibility-results">
    <span className="kicker">YOUR COMPATIBILITY PROFILE · COMPLETE</span>
    <h2 id="journey-title">Your closest current matches</h2>
    <p>Each score reflects the information you entered and the pet profile currently available. Missing information lowers confidence.</p>
    {!results.length && <div className="empty"><b>No published pets are available to score yet.</b><p>Your profile is saved. New pets can be compared as they are approved.</p></div>}
    <div className="compatibility-list">{results.slice(0, 4).map(({ pet, score, strengths, considerations }, index) => <article key={pet.id}>
      <div className="compatibility-photo"><img src={pet.image} alt=""/><span>#{index + 1}</span></div>
      <div className="compatibility-copy"><div><h3>{pet.name}</h3><small>{pet.age} · {pet.city} · {pet.energy} energy</small></div><div className="guide-score"><b>{score}%</b><span>fit</span></div><div className="compatibility-bar"><i style={{ width: `${score}%` }}/></div><ul>{(strengths.length ? strengths : ["No hard incompatibility was found in your answers"]).map((item) => <li className="positive" key={item}>✓ {item}</li>)}{considerations.map((item) => <li key={item}>△ {item}</li>)}</ul><div className="compatibility-buttons"><a href={`/pets/${encodeURIComponent(pet.id)}`}>View full profile →</a><button onClick={() => onSave(pet.id)}>{saved.includes(pet.id) ? "♥ Saved" : "♡ Save pet"}</button></div></div>
    </article>)}</div>
  </div>;
}
function JourneyList({ step, cityName = "Indore", species, otherSpecies, onSpeciesChange, onOtherSpeciesChange }) {
    return <div className="journey-content">
    <span className="kicker">RESPONSIBLE REHOMING · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["Your relationship to the animal", "Tell us who they are", "Can we help them stay?"][step]}</h2>
    <p>{["Only an authorized custodian may publish a pet.", "Honest medical and behaviour details lead to safer homes.", "We offer support before you decide to rehome. You remain in control."][step]}</p>
    {step === 0 && <div className="form-grid"><label>I am the<select><option>Current pet parent</option><option>Independent rescuer</option><option>Foster parent</option><option>NGO / shelter coordinator</option></select></label><label>Current city<input defaultValue={cityName}/></label><label className="wide">Authority declaration<select><option>I am authorized to make placement decisions</option><option>I need help confirming authority</option></select></label></div>}
    {step === 1 && <div className="form-grid"><label>Pet name<input placeholder="e.g. Bruno"/></label><label>Species<select value={species} onChange={(event) => onSpeciesChange(event.target.value)}><option>Dog</option><option>Cat</option><option>Other</option></select></label>{species === "Other" && <label className="wide">Which animal?<input value={otherSpecies} onChange={(event) => onOtherSpeciesChange(event.target.value)} placeholder="For example: rabbit, guinea pig or bird" required autoFocus/><small className="field-help">Please identify the species so adopters understand exactly which animal needs a home.</small></label>}<label>Age<input placeholder="e.g. 3 years"/></label><label>Energy<select><option>Low</option><option>Moderate</option><option>High</option><option>Very high</option></select></label></div>}
    {step === 2 && (
  <div className="support-box">

    <button
      type="button"
      onClick={() => {
        window.location.href =
          `/city?name=${encodeURIComponent(cityName)}` +
          `&service=${encodeURIComponent("Training or behaviour support")}`;
      }}
    >
      Behaviour or training support
    </button>

    <button
      type="button"
      onClick={() => {
        window.location.href =
          `/dashboard?tab=${encodeURIComponent("Foster")}` +
          `&city=${encodeURIComponent(cityName)}`;
      }}
    >
      Temporary foster or boarding
    </button>

    <button
      type="button"
      onClick={() => {
        window.location.href =
          `/city?name=${encodeURIComponent(cityName)}` +
          `&service=${encodeURIComponent("Veterinary care")}`;
      }}
    >
      Medical or veterinary support
    </button>

    <button
      type="button"
      onClick={() => {
        window.location.href =
          `/dashboard?tab=${encodeURIComponent("My animals")}`;
      }}
    >
      Continue with responsible rehoming
    </button>

  </div>
)}
  </div>;
}
function JourneyRescue({ step, cityName = "Indore", request, onChange }) {
    const choices = step === 0
      ? ["Road accident / severe bleeding", "Injured but stable", "Abandoned young animals", "Animal cruelty concern"]
      : ["24/7 emergency vet", "Animal transport", "NGO or rescuer", "Shelter"];
    return <div className="journey-content">
    <span className="kicker">FIND ANIMAL HELP · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["Is anyone in immediate danger?", "Where is the animal?", "What support seems needed?"][step]}</h2>
    <p>{["Move only if it is safe. For human emergencies, contact local emergency services.", "An approximate location is enough for the first step.", "Choose the support you need and we’ll take you to the relevant help directory — not an unrelated login page."][step]}</p>
    {step === 0 && <div className="support-box service-choice-grid">{choices.map((choice)=><button type="button" key={choice} className={request.danger===choice?"selected":""} onClick={()=>onChange("danger",choice)}><span>{choice}</span>{request.danger===choice&&<em>Selected ✓</em>}</button>)}</div>}
    {step === 1 && <div className="form-grid"><label>City<input value={cityName} readOnly/></label><label>Locality<input value={request.locality} onChange={(e)=>onChange("locality",e.target.value)} placeholder="Approximate area"/></label><label className="wide">Safe callback number<input value={request.callback} onChange={(e)=>onChange("callback",e.target.value)} placeholder="+91" inputMode="tel"/></label></div>}
    {step === 2 && <div className="support-box service-choice-grid">{choices.map((choice)=><button type="button" key={choice} className={request.need===choice?"selected":""} onClick={()=>onChange("need",choice)}><span>{choice}</span>{request.need===choice&&<em>Selected ✓</em>}</button>)}</div>}
  </div>;
}
function JourneyOffer({ step, request, onToggle, onChange }) {
    const ways = ["Foster temporarily", "Volunteer with an organization", "Provide transport", "Offer professional help", "Sponsor care or supplies"];
    return <div className="journey-content">
    <span className="kicker">OFFER HELP · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["How would you like to help?", "What can you realistically offer?", "Where should we look?"][step]}</h2>
    <p>{["Choose one or more ways to help. Your choices stay highlighted and determine the right registration path.", "Boundaries help us suggest safe, achievable opportunities.", "Your exact home address and private details are never shown publicly."][step]}</p>
    {step === 0 && <div className="support-box service-choice-grid">{ways.map((way) => <button type="button" key={way} className={request.ways.includes(way) ? "selected" : ""} aria-pressed={request.ways.includes(way)} onClick={() => onToggle(way)}><span>{way}</span>{request.ways.includes(way) && <em>Selected ✓</em>}</button>)}</div>}
    {step === 1 && <div className="form-grid"><label>Usual availability<select value={request.availability} onChange={(event) => onChange("availability", event.target.value)}><option>Weekends</option><option>Weekday mornings</option><option>Weekday evenings</option><option>Flexible / on call</option></select></label><label>Travel radius<select value={request.radius} onChange={(event) => onChange("radius", event.target.value)}><option>Within 5 km</option><option>Within 15 km</option><option>Within 30 km</option><option>Depends on the situation</option></select></label><label className="wide">Important limits<input value={request.limits} onChange={(event) => onChange("limits", event.target.value)} placeholder="For example: no overnight fostering"/></label></div>}
    {step === 2 && <div className="form-grid"><label>City<input value={request.city} onChange={(event) => onChange("city", event.target.value)} required/></label><label>Approximate locality<input value={request.locality} onChange={(event) => onChange("locality", event.target.value)} placeholder="Area or PIN code"/></label><label className="wide">Opportunity alerts<select value={request.alerts} onChange={(event) => onChange("alerts", event.target.value)}><option>Immediate needs only</option><option>Daily digest</option><option>Weekly digest</option><option>Do not notify me</option></select></label><div className="wide selected-help-summary"><b>Selected help</b><p>{request.ways.join(" · ")}</p></div></div>}
  </div>;
}
function JourneyServices({ step, request, onChange }) {
    const serviceOptions = ["Veterinary care", "24/7 emergency vet", "Grooming", "Pet Shop & Supplies", "NGO or rescuer", "Shelter", "Animal transport", "Training or behaviour support", "Pet Boarding & Daycare", "Pet Sitters & Walkers", "Pet Cremation & Memorial Services", "Pet-Friendly Places"];
    return <div className="journey-content">
    <span className="kicker">LOCAL ANIMAL SERVICES · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["What are you looking for?", "Where do you need it?", "What matters right now?"][step]}</h2>
    <p>{["Choose the service you need. Your selected option will stay highlighted as you continue.", "An approximate area is enough. Private locations are never exposed.", "Verification and freshness are shown separately; listed does not mean endorsed."][step]}</p>
    {step === 0 && <div className="support-box service-choice-grid">{serviceOptions.map((option) => <button type="button" key={option} className={request.need === option ? "selected" : ""} aria-pressed={request.need === option} onClick={() => onChange("need", option)}><span>{option}</span>{request.need === option && <em>Selected ✓</em>}</button>)}</div>}
    {step === 1 && <div className="form-grid"><label>City<input value={request.city} onChange={(event) => onChange("city", event.target.value)} placeholder="Enter city" required/></label><label>Locality or PIN code<input value={request.locality} onChange={(event) => onChange("locality", event.target.value)} placeholder="Approximate area"/></label><label className="wide">Search radius<select value={request.radius} onChange={(event) => onChange("radius", event.target.value)}><option>Within 5 km</option><option>Within 15 km</option><option>Anywhere in the city</option></select></label></div>}
    {step === 2 && <div className="form-grid"><label>Availability<select value={request.availability} onChange={(event) => onChange("availability", event.target.value)}><option>Open now</option><option>Today</option><option>Any time</option></select></label><label>Home visit needed?<select value={request.homeVisit} onChange={(event) => onChange("homeVisit", event.target.value)}><option>No preference</option><option>Yes</option><option>No</option></select></label><label className="wide">Accessibility or language needs<input value={request.accessibility} onChange={(event) => onChange("accessibility", event.target.value)} placeholder="Optional"/></label></div>}
  </div>;
}
