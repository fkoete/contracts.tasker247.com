/* ════════════════════════════════════════════
   UTILITY: ordinal date string
════════════════════════════════════════════ */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getContractDate() {
  const d = new Date();
  return `the ${ordinal(d.getDate())} day of ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
}

/* ════════════════════════════════════════════
   CONTRACT ID (cryptographically random)
════════════════════════════════════════════ */
function generateContractID() {
  const today = new Date();
  const date = today.getFullYear()
    + String(today.getMonth() + 1).padStart(2, '0')
    + String(today.getDate()).padStart(2, '0');
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const id = `T247-${date}-${random}`;
  document.getElementById("cid").textContent = id;
  document.getElementById("contractIDField").value = id;
}

/* ════════════════════════════════════════════
   ISO 8601 TIMESTAMP (browser's local offset)
════════════════════════════════════════════ */
function getISOTimestamp() {
  const now = new Date();
  const tzOffset = -now.getTimezoneOffset();
  const sign = tzOffset >= 0 ? "+" : "-";
  const absOff = Math.abs(tzOffset);
  const hh = String(Math.floor(absOff / 60)).padStart(2, "0");
  const mm = String(absOff % 60).padStart(2, "0");
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    + `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    + `${sign}${hh}:${mm}`;
}

/* ════════════════════════════════════════════
   PROGRESS TRACKER
════════════════════════════════════════════ */
const STEP_LABELS = ["Client Details", "Services", "Commercial", "Agreement", "Signature"];

const STEP_FIELDS = [
  ["clientType", "email", "telephone", "physicalAddress"],
  ["serviceType"],
  ["currency", "projectValue", "depositAmount", "expectedStartDate", "expectedCompletionDate"],
  [],
  ["typedSignature", "truthConfirm", "agreementConfirm", "consentConfirm", "clientPlace"]
];

function countFilledInStep(stepIndex) {
  const fields = STEP_FIELDS[stepIndex];
  if (fields.length === 0) return 1;
  let filled = 0;
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      if (el.checked) filled++;
    } else if (el.value && el.value.trim() !== "" && el.value !== "0") {
      filled++;
    }
  });
  return filled;
}

function totalInStep(stepIndex) {
  const fields = STEP_FIELDS[stepIndex];
  return fields.length === 0 ? 1 : fields.length;
}

function updateProgress() {
  const totalFields = STEP_FIELDS.reduce((sum, arr) => sum + (arr.length === 0 ? 1 : arr.length), 0);
  let totalFilled = 0;
  let activeStep = 0;

  for (let i = 0; i < STEP_FIELDS.length; i++) {
    const filled = countFilledInStep(i);
    const total = totalInStep(i);
    totalFilled += filled;
    if (filled >= total && i >= activeStep) activeStep = i + 1;
  }

  if (signaturePad && !signaturePad.isEmpty()) totalFilled += 1;
  const grandTotal = totalFields + 1;
  const pct = Math.min(100, Math.round((totalFilled / grandTotal) * 100));
  if (activeStep > 4) activeStep = 4;

  document.getElementById("progressBarFill").style.width = pct + "%";
  document.getElementById("progressLabel").textContent =
    `Progress: ${pct}% — Step: ${STEP_LABELS[activeStep] || "Complete"}`;

  document.querySelectorAll(".step").forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.remove("active", "complete");
    if (s < activeStep) el.classList.add("complete");
    else if (s === activeStep) el.classList.add("active");
  });
}

/* ════════════════════════════════════════════
   CLIENT TYPE TOGGLE
════════════════════════════════════════════ */
function initClientType() {
  const clientType = document.getElementById("clientType");
  const individualBlock = document.getElementById("individualBlock");
  const companyBlock = document.getElementById("companyBlock");

  function clearFields(block) {
    block.querySelectorAll("input, textarea, select").forEach(el => { el.value = ""; });
  }
  function hideBlock(block) {
    block.classList.add("hidden");
    clearFields(block);
    block.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = true; });
  }
  function showBlock(block) {
    block.classList.remove("hidden");
    block.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = false; });
  }

  clientType.addEventListener("change", () => {
    hideBlock(individualBlock);
    hideBlock(companyBlock);
    if (clientType.value === "individual") showBlock(individualBlock);
    if (clientType.value === "company") showBlock(companyBlock);
    updateProgress();
  });

  hideBlock(individualBlock);
  hideBlock(companyBlock);
}

/* ════════════════════════════════════════════
   COMMERCIAL CALCULATIONS & CURRENCY SYNC
════════════════════════════════════════════ */
function initCommercialCalculations() {
  const currencySelect = document.getElementById("currency");
  const projectValueInput = document.getElementById("projectValue");
  const depositAmountInput = document.getElementById("depositAmount");
  const balanceAmountInput = document.getElementById("balanceAmount");

  const currencyConfig = {
    ZAR: { symbol: "ZAR (R)", label: "ZAR / R" },
    USD: { symbol: "USD ($)", label: "USD / $" },
    EUR: { symbol: "EUR (€)", label: "EUR / €" },
    GBP: { symbol: "GBP (£)", label: "GBP / £" }
  };

  function updateCurrencyUI() {
    const selected = currencySelect.value || "ZAR";
    const config = currencyConfig[selected] || { symbol: selected, label: selected };

    ["projectValueCurrencyAddon", "depositCurrencyAddon", "balanceCurrencyAddon"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = config.symbol;
    });

    const pLabel = document.querySelector('label[for="projectValue"]');
    const dLabel = document.querySelector('label[for="depositAmount"]');
    const bLabel = document.querySelector('label[for="balanceAmount"]');
    if (pLabel) pLabel.textContent = `Project Value (${config.label})`;
    if (dLabel) dLabel.textContent = `Deposit Amount (${config.label})`;
    if (bLabel) bLabel.textContent = `Balance Amount (${config.label})`;
  }

  function calculateBalance() {
    const val = parseFloat(projectValueInput.value) || 0;
    const dep = parseFloat(depositAmountInput.value) || 0;
    const balance = Math.max(0, val - dep);
    balanceAmountInput.value = (projectValueInput.value || depositAmountInput.value) ? balance.toFixed(2) : "";
    updateProgress();
  }

  currencySelect.addEventListener("change", () => {
    updateCurrencyUI();
    calculateBalance();
    updateProgress();
  });
  projectValueInput.addEventListener("input", calculateBalance);
  depositAmountInput.addEventListener("input", calculateBalance);

  updateCurrencyUI();
}

function buildContractBody() {
  const parts = [];

  const clientType = document.getElementById("clientType").value;
  const serviceSelect = document.getElementById("serviceType");
  const serviceLabel = serviceSelect.options[serviceSelect.selectedIndex]?.text || "(not selected)";
  const currency = document.getElementById("currency")?.value || "ZAR";
  const projectValue = document.getElementById("projectValue")?.value || "0.00";
  const depositAmount = document.getElementById("depositAmount")?.value || "0.00";
  const balanceAmount = document.getElementById("balanceAmount")?.value || "0.00";
  const startDate = document.getElementById("expectedStartDate")?.value || "TBD";
  const completionDate = document.getElementById("expectedCompletionDate")?.value || "TBD";

  parts.push(`CLIENT TYPE: ${clientType || "(not selected)"}`);
  parts.push(`SERVICE SELECTED: ${serviceLabel}`);
  parts.push(`COMMERCIAL TERMS: Currency: ${currency} | Project Value: ${currency} ${projectValue} | Deposit: ${currency} ${depositAmount} | Balance: ${currency} ${balanceAmount} | Start Date: ${startDate} | Completion Date: ${completionDate}`);
  parts.push("");

  const msa = document.getElementById("msaContent");
  if (msa) {
    parts.push("=== MASTER SERVICE AGREEMENT ===");
    parts.push(msa.innerText.trim());
    parts.push("");
  }

  const activeAnnexure = document.querySelector(".annexure.active");
  if (activeAnnexure) {
    parts.push("=== APPLICABLE SERVICE ANNEXURE ===");
    parts.push(activeAnnexure.innerText.trim());
    parts.push("");
  }

  return parts.join("\n");
}

/* ════════════════════════════════════════════
   SERVICE / ANNEXURE TOGGLE
════════════════════════════════════════════ */
function initServiceSelection() {
  const service = document.getElementById("serviceType");
  service.addEventListener("change", () => {
    document.querySelectorAll(".annexure").forEach(a => a.classList.remove("active"));
    const annexureNameField = document.getElementById("annexureNameField");
    const annexureVersionField = document.getElementById("annexureVersion");

    if (service.value) {
      const ann = document.getElementById(
        "annexure" + service.value.charAt(0).toUpperCase() + service.value.slice(1)
      );
      if (ann) {
        ann.classList.add("active");
        const header = ann.querySelector("h2");
        if (annexureNameField && header) annexureNameField.value = header.textContent.trim();
        if (annexureVersionField) annexureVersionField.value = "v1.0";
      }
    } else {
      if (annexureNameField) annexureNameField.value = "";
      if (annexureVersionField) annexureVersionField.value = "";
    }
    updateProgress();
  });
}

/* ════════════════════════════════════════════
   LIVE "PLACE" DISPLAY (no innerHTML → no XSS)
════════════════════════════════════════════ */
function initClientPlace() {
  document.getElementById("clientPlace").addEventListener("input", function () {
    const display = document.getElementById("clientPlaceDisplay");
    display.textContent = "";
    if (this.value.trim()) {
      const s = document.createElement("strong");
      s.textContent = this.value;
      display.appendChild(s);
    } else {
      const em = document.createElement("em");
      em.textContent = "(place not yet entered)";
      display.appendChild(em);
    }
    updateProgress();
  });
}

/* ════════════════════════════════════════════
   SIGNATURE PAD
════════════════════════════════════════════ */
let signaturePad;
let clientDateSet = false;

function clearSignature() {
  if (!signaturePad) return;
  signaturePad.clear();
  clientDateSet = false;
  document.getElementById("clientSignatureDate").textContent = "[date will appear once you sign]";
  updateProgress();
}

function initSignaturePad() {
  const canvas = document.getElementById("signaturePad");
  if (typeof SignaturePad !== 'undefined') {
    signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255,255,255)' });

    signaturePad.addEventListener("afterUpdateStroke", () => {
      if (!clientDateSet) {
        document.getElementById("clientSignatureDate").textContent = getContractDate();
        clientDateSet = true;
      }
      updateProgress();
    });

    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const savedData = signaturePad.isEmpty() ? null : signaturePad.toData();

      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);

      if (savedData) {
        signaturePad.fromData(savedData);
      } else {
        signaturePad.clear();
        clientDateSet = false;
        document.getElementById("clientSignatureDate").textContent = "[date will appear once you sign]";
      }
      updateProgress();
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    });

    resizeCanvas();
  } else {
    console.warn("Signature Pad library not loaded");
  }

  // Replaces the old inline onclick="clearSignature()" (inline handlers are blocked by the CSP)
  document.getElementById("clearSignatureBtn").addEventListener("click", clearSignature);
}

/* ════════════════════════════════════════════
   TRACKED FIELD LISTENERS
════════════════════════════════════════════ */
function attachFieldListeners() {
  STEP_FIELDS.flat().forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(el.type === "checkbox" ? "change" : "input", updateProgress);
  });
}

/* ════════════════════════════════════════════
   SECURE SUBMISSION
════════════════════════════════════════════ */
const pageLoadedAt = Date.now();
let isSubmitting = false;

function cleanText(v) {
  return String(v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ") // control chars (keeps line breaks)
    .replace(/[<>]/g, "")                                            // markup characters
    .trim();
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
}

function validateForm() {
  const v = id => (document.getElementById(id)?.value || "").trim();
  const errors = [];
  const type = v("clientType");

  if (!type) errors.push("Select a client type.");
  if (type === "individual") {
    if (!v("fullName")) errors.push("Full name is required.");
    if (!v("idNumber")) errors.push("ID / Passport number is required.");
  }
  if (type === "company") {
    if (!v("companyName")) errors.push("Company name is required.");
    if (!v("registrationNumber")) errors.push("Registration number is required.");
    if (!v("representativeName")) errors.push("Representative name is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) errors.push("Enter a valid email address.");
  if (v("telephone").replace(/\D/g, "").length < 9) errors.push("Enter a valid telephone number.");
  if (!v("physicalAddress")) errors.push("Physical address is required.");
  if (!v("serviceType")) errors.push("Select a service.");

  const pv = parseFloat(v("projectValue")), dep = parseFloat(v("depositAmount")) || 0;
  if (!(pv > 0)) errors.push("Enter a project value greater than 0.");
  if (dep > pv) errors.push("Deposit cannot exceed the project value.");

  const s = v("expectedStartDate"), c = v("expectedCompletionDate");
  if (s && c && c < s) errors.push("Completion date cannot be before the start date.");

  if (!v("clientPlace")) errors.push("Enter your place of signature.");
  if (v("typedSignature").length < 3) errors.push("Type your full name as your electronic signature.");
  return errors;
}

document.getElementById("contractForm").addEventListener("submit", async function (e) {
  e.preventDefault();               // we submit manually after hashing
  if (isSubmitting) return;

  // Bot checks
  if (document.getElementById("honeypot").value) return;
  if (Date.now() - pageLoadedAt < 20000) {
    alert("Please take the time to read the agreement before signing.");
    return;
  }

  if (!signaturePad || signaturePad.isEmpty()) {
    alert("Please draw your signature before submitting.");
    return;
  }
  for (const id of ["truthConfirm", "agreementConfirm", "consentConfirm"]) {
    if (!document.getElementById(id).checked) {
      alert("Please tick all three confirmation checkboxes before submitting.");
      return;
    }
  }

  // Sanitise all text inputs
  this.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea:not(#contractBody)')
    .forEach(el => { if (el.id !== "honeypot") el.value = cleanText(el.value); });

  const errors = validateForm();
  if (errors.length) {
    alert("Please fix the following:\n\n• " + errors.join("\n• "));
    return;
  }

  isSubmitting = true;
  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Submitting…";

  try {
    const body = buildContractBody();
    const sig = signaturePad.toDataURL();
    const ts = getISOTimestamp();
    document.getElementById("contractBody").value = body;
    document.getElementById("signatureDataField").value = sig;
    document.getElementById("contractDateField").value = getContractDate();
    document.getElementById("signingTimestamp").value = ts;

    const active = document.querySelector(".annexure.active");
    if (active) {
      document.getElementById("scopeOfServicesField").value = active.innerText.trim();
      document.getElementById("annexureNameField").value = active.querySelector("h2")?.textContent.trim() || "";
      document.getElementById("annexureVersion").value = "v1.0";
    } else {
      document.getElementById("scopeOfServicesField").value = "";
      document.getElementById("annexureNameField").value = "None Selected";
      document.getElementById("annexureVersion").value = "";
    }

    // Tamper-evidence: hash of contract ID + contract text + signature + timestamp
    const cid = document.getElementById("contractIDField").value;
    document.getElementById("contractHash").value = await sha256Hex([cid, body, sig, ts].join("|"));

    this.submit();                  // native submit; skips this handler
  } catch (err) {
    isSubmitting = false;
    btn.disabled = false;
    btn.textContent = "Sign and Submit";
    alert("Something went wrong. Please try again.");
  }
});

// Don't let the back button / bfcache show filled-in personal data
window.addEventListener("pageshow", e => { if (e.persisted) location.reload(); });

/* ════════════════════════════════════════════
   INIT ON DOM READY
════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  generateContractID();
  document.getElementById("taskerSignatureDate").textContent = getContractDate();

  initClientType();
  initServiceSelection();
  initCommercialCalculations();
  initClientPlace();
  initSignaturePad();
  attachFieldListeners();
  updateProgress();
});
