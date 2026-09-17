import { useEffect, useMemo, useState } from "react";
import { faqCategories, faqCount } from "../data/faqData.js";

export default function FAQ({ isAuthenticated = false }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(faqCategories[0]?.number || "01");
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Frequently Asked Questions — Adoptvilla";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return faqCategories
      .filter((category) => category.number === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalized) return true;
          return `${item.question} ${item.answer}`.toLowerCase().includes(normalized);
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [activeCategory, query]);

  const visibleCount = filteredCategories.reduce((total, category) => total + category.items.length, 0);

  return (
    <main className="faq-page public-home">
      <header className="site-header faq-site-header">
        <a className="brand" href="/" aria-label="ADOPTVILLA home">
          <img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt="" />
          <span className="brand-divider" aria-hidden="true" />
          <span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span>
        </a>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Open navigation">Menu</button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
          <a href="/#pets" onClick={() => setMenu(false)}>Adopt</a>
          <a href="/#matching" onClick={() => setMenu(false)}>AI Match</a>
          <a href="/#cities" onClick={() => setMenu(false)}>Explore your city</a>
          <a href="/#help" onClick={() => setMenu(false)}>Animal help</a>
          <a href="/faq" aria-current="page" onClick={() => setMenu(false)}>FAQs</a>
        </nav>
        <a className="login" href={isAuthenticated ? "/dashboard" : "/login?return_to=%2Fdashboard"}>
          {isAuthenticated ? "Dashboard" : "Log in"}
        </a>
      </header>

      <section className="faq-hero">
        <span className="kicker">ADOPTVILLA — BY DOGSVILLA</span>
        <h1>Frequently Asked Questions</h1>
        <p>A responsible pet adoption, rehoming, foster &amp; animal-support network.</p>
        <p className="faq-hero-sub">Answers about adoption, matching, rehoming, fostering, rescue, lost &amp; found, privacy, fees, shelters, NGOs and independent rescuers.</p>
        <div className="faq-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search within this FAQ section"
            aria-label="Search frequently asked questions"
          />
          {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
        </div>
        <small>{faqCount} questions organised into {faqCategories.length} sections — choose a section below</small>
      </section>

      <section className="faq-content">
        <aside className="faq-categories" aria-label="FAQ categories">
          {faqCategories.map((category) => (
            <button
              key={category.number}
              className={activeCategory === category.number ? "active" : ""}
              onClick={() => setActiveCategory(category.number)}
            >
              <span>{category.number}</span><b>{category.title}</b><small>{category.items.length}</small>
            </button>
          ))}
        </aside>

        <div className="faq-results">
          <div className="faq-results-head">
            <div>
              <span className="kicker">HELP CENTRE</span>
              <h2>{faqCategories.find((category) => category.number === activeCategory)?.title}</h2>
            </div>
            <span>{visibleCount} result{visibleCount === 1 ? "" : "s"}</span>
          </div>

          {filteredCategories.length ? filteredCategories.map((category) => (
            <section className="faq-category-section" key={category.number} id={`faq-${category.number}`}>
              <div className="faq-category-heading">
                <span>{category.number}</span>
                <div><small>FAQ CATEGORY</small><h3>{category.title}</h3></div>
              </div>
              <div className="faq-accordion-list">
                {category.items.map((item, index) => (
                  <details key={`${category.number}-${index}`}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )) : (
            <div className="faq-empty">
              <b>No matching FAQ found.</b>
              <p>Try a broader search or choose another category.</p>
              <button onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </div>
      </section>

      <section className="faq-contact-cta">
        <span className="kicker light">STILL NEED HELP?</span>
        <h2>Start with the situation. Adoptvilla will help you find the next step.</h2>
        <div>
          <a href="/#help">Find animal support</a>
          <a href="/#pets">Browse adoptable pets</a>
          <a href={isAuthenticated ? "/dashboard" : "/login?return_to=%2Fdashboard"}>{isAuthenticated ? "Open dashboard" : "Log in"}</a>
        </div>
      </section>

      <footer className="home-footer faq-footer">
        <div className="footer-grid">
          <div className="footer-about">
            <div className="brand footer-brand"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider" aria-hidden="true"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></div>
            <p>A responsible pet adoption, rehoming, foster and animal-support network built by Dogsvilla.</p>
          </div>
          <div><b>Quick links</b><a href="/#pets">Adopt</a><a href="/#matching">AI Match</a><a href="/#cities">Explore your city</a><a href="/faq">FAQs</a></div>
          <div><b>Animal support</b><a href="/dashboard?tab=Lost%20%26%20found">Lost &amp; Found</a><a href="/#help">Rescue &amp; Emergency</a><a href="/dashboard?tab=Foster">Become a Foster</a><a href="/dashboard?tab=Manage">Shelter &amp; NGO CRM</a></div>
          <div><b>Your account</b><a href="/login?return_to=%2Fdashboard">Log in</a><a href="/signup">Create account</a><a href="/dashboard">Dashboard</a><a href="/">Home</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 AdoptVilla Powered By KickstartX.</span><span>Privacy by design · Welfare first · No commercial pet sales</span></div>
      </footer>
    </main>
  );
}
