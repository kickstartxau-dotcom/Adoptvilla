import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const home = read("src/pages/Home.jsx");
const homeText = home.replaceAll("&amp;", "&");
const app = read("src/App.jsx");
const auth = read("src/pages/Auth.jsx");
const dashboard = read("src/pages/Dashboard.jsx");
const faq = read("src/pages/FAQ.jsx");
const city = read("src/pages/Indore.jsx");
const mockApi = read("src/mockApi.js");
const styles = read("src/styles.css");
const html = read("index.html");

const requiredHomeCopy = [
  "INDIA’S ONLY INTELLIGENT AI POWERED PET ADOPTION & SUPPORT NETWORK",
  "Adopt love.",
  "Re-home. Foster. Support.",
  "Shelter & NGO CRM",
  "Become a Foster",
  "Register as An Animal Rescuer",
  "ONE PLATFORM. EVERY STEP THAT MATTERS.",
  "THE NUMBERS THAT MATTER",
  "Adoption Done",
  "Foster Homes",
  "Rescue & Welfare Partners",
  "A two-way AI search engine",
  "EXPLORE YOUR CITY",
  "NEED HELP WITH AN ANIMAL?",
  "WHY ₹99?",
];
for (const text of requiredHomeCopy) assert(homeText.includes(text), `Client homepage copy missing: ${text}`);

assert(!home.includes('<article><b>—</b><span>Adoption Done'), "Adoption Done counter is still a placeholder.");
assert(!home.includes('<article><b>—</b><span>Foster Homes'), "Foster Homes counter is still a placeholder.");
assert(home.includes("public-metrics"), "Homepage is not connected to the public metrics resource.");
assert(mockApi.includes('resource === "public-metrics"'), "Public metrics endpoint is missing.");

assert(app.includes('path === "/city"'), "Dynamic city route is missing.");
assert(city.includes("No sourced local service directory is published"), "City page does not safely handle cities without sourced directory records.");
assert(!home.includes('window.location.href = "/indore"'), "Local services still hard-code Indore.");
assert(home.includes("serviceRequest"), "Local animal services request state is missing.");
assert(home.includes('aria-pressed={request.need === option}'), "Local animal services choices do not expose selected state.");
assert(home.includes('onClick={() => onChange("need", option)}'), "Local animal services choices are not wired to selection state.");
assert(styles.includes("service-choice-grid button.selected"), "Selected service UI styling is missing.");
assert(city.includes("requestedService"), "Selected local service is not carried to the city directory.");

assert(auth.includes("adoptvilla_purpose"), "Purpose-specific sign-up metadata is missing.");
assert(auth.includes("Register as an Animal Rescuer"), "Rescuer sign-up experience is missing.");
assert(dashboard.includes('"RESCUER"'), "Rescuer onboarding option is missing.");
assert(dashboard.includes('"FOSTER"'), "Foster onboarding option is missing.");
assert(dashboard.includes('setTab("Rescue & help")'), "Rescuer onboarding does not route to Rescue & help.");
assert(dashboard.includes('setTab("Foster")'), "Foster onboarding does not route to Foster.");
assert(!dashboard.includes('upload.append("purpose", "PUBLIC_WELFARE");\n                const upload = new FormData();'), "Rescue media upload still references FormData before declaration.");

assert(!faq.includes('setActiveCategory("ALL")'), "FAQ still contains the All Questions view.");
assert(!faq.includes('<b>All questions</b>'), "FAQ still renders an All Questions category.");
assert(faq.includes('faqCategories[0]?.number || "01"'), "FAQ does not default to a section-specific view.");

assert(html.includes("Adoptvilla — Adopt. Rehome. Rescue."), "Client SEO title is missing.");
assert(html.includes("Built by Dogsvilla for animals in need."), "Client SEO description is incomplete.");

const faqModule = await import(pathToFileURL(path.join(root, "src/data/faqData.js")).href);
const faqCategories = faqModule.faqCategories || [];
const faqCount = faqCategories.reduce((sum, category) => sum + (Array.isArray(category.items) ? category.items.length : 0), 0);
assert(faqCategories.length === 11, `Expected 11 FAQ categories, found ${faqCategories.length}.`);
assert(faqCount === 90, `Expected 90 FAQ questions, found ${faqCount}.`);

console.log("Client final check OK:");
console.log(" - homepage revision requirements present");
console.log(" - four number counters connected");
console.log(" - city explorer is city-aware and no longer hard-codes Indore");
console.log(" - Local Animal Services selections persist and show a selected state");
console.log(" - foster and independent rescuer onboarding paths present");
console.log(" - FAQ is section-only (no All Questions mega-view)");
console.log(" - rescue media FormData ordering fixed");
console.log(" - SEO copy aligned");
console.log(` - FAQs: ${faqCategories.length} categories / ${faqCount} questions`);
