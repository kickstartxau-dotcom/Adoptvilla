import fs from "node:fs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const forms = read("src/components/ClientSpecForms.jsx");
const dashboard = read("src/pages/Dashboard.jsx");
const home = read("src/pages/Home.jsx");
const api = read("src/mockApi.js");
const publicPrograms = read("src/pages/PublicPrograms.jsx");
const dav = read("src/components/DogAssistant.jsx");

const checks = [
  [forms.includes("const adopterSteps") && forms.includes("STEP 10") || forms.includes("Commitment"), "10-step adopter matching form"],
  [forms.includes("const rehomeSteps") && forms.includes("Why Are You Rehoming?") && forms.includes("What Are You Looking For?"), "8-step rehome form"],
  [forms.includes("const fosterSteps") && forms.includes("Emergency / Backup Plan") && forms.includes("Final Declaration"), "11-step foster profile"],
  [forms.includes("const rescuerSteps") && forms.includes("Emergency Contact & Consent") && forms.includes("Verification"), "rescuer profile workflow"],
  [forms.includes("LostFoundReportWizard") && forms.includes("Private ownership-proof detail") && forms.includes("Lat") || forms.includes("Latitude"), "step-by-step lost/found report"],
  [forms.includes("LostFoundSightingForm") && dashboard.includes("Report a sighting"), "separate sighting flow"],
  [api.includes("scoreLostFoundPair") && api.includes("Species conflict") && api.includes("Date window is plausible"), "weighted lost/found fallback matching"],
  [api.includes("applyLostFoundLifecycle") && api.includes("EXPIRED") && api.includes("60 days"), "lost/found reminders and expiry"],
  [dashboard.includes("Potential Match") && dashboard.includes("Confidence is a search aid, not proof of identity"), "non-guaranteed Lost & Found match output"],
  [dashboard.includes("YOUR RESCUE PROFILE IS READY") && dashboard.includes("You’re Now Part of the Network"), "rescuer completion summary"],
  [home.includes("offerRequest") && home.includes("aria-pressed={request.ways.includes(way)}") && home.includes("offerDestinationHref"), "offer-help tabs are interactive and routed"],
  [publicPrograms.includes("You Don't Have to Rescue Them Alone") && publicPrograms.includes("Give Them a Place to Belong"), "rescuer and foster public entry pages"],
  [dav.includes("I may not be in this world anymore") && dav.includes("Your Adoptvilla Assistant"), "Davo client copy"],
  [api.includes("rescue-profile") && api.includes("save-rescuer-profile"), "rescuer profile API fallback"],
  [api.includes("save-lost-found-sighting") && api.includes("renew-lost-found-report"), "sighting and case renewal actions"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Full client specification check FAILED:");
  for (const item of failures) console.error(` - ${item}`);
  process.exit(1);
}
console.log("Full client specification static check OK:");
for (const [, label] of checks) console.log(` - ${label}`);
