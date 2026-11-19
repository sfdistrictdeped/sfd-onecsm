/****************************************************
 * SAN FERNANDO DISTRICT ONECSM — FRONTEND API CLIENT
 ****************************************************/

const API_URL = "https://script.google.com/macros/s/AKfycbzQ22SS12cfTw5OZSQRREpbKcwInqLMHWcfk8FulLguw7fMm7p9eqPID_gLUM9ziqkQJA/exec";
let apiOnline = false;
let activeControlNumber = null;

async function apiRequest(action, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, data })
  });
  if (!response.ok) throw new Error(`API request failed (HTTP ${response.status}).`);
  const payload = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("The API returned an invalid response.");
  if (payload.success !== true) throw new Error(payload.message || "The API could not process the request.");
  if (payload.result && payload.result.success === false) throw new Error(payload.result.message || "The transaction was not completed.");
  return payload.result ?? payload;
}

async function checkApiConnection() {
  const notice = document.getElementById("developmentNotice");
  try {
    const response = await fetch(`${API_URL}?action=ping`, { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.success !== true || result.status !== "API ONLINE") throw new Error("Unexpected API response.");
    apiOnline = true;
    notice.textContent = "System connection verified. You may proceed.";
    notice.classList.add("api-online");
    notice.classList.remove("api-offline");
  } catch (error) {
    console.error("OneCSM API connection error:", error);
    apiOnline = false;
    notice.textContent = "Unable to connect to the OneCSM server. Please check your internet connection or contact the system administrator.";
    notice.classList.add("api-offline");
    notice.classList.remove("api-online");
  }
  notice.style.display = "block";
  updateProceedButton();
}

function updateProceedButton() {
  const consentGiven = document.getElementById("consentCheckbox").checked;
  document.getElementById("proceedButton").disabled = !consentGiven || !apiOnline;
  document.getElementById("buttonHint").textContent = !consentGiven
    ? "Please read the notice and provide your consent to continue."
    : apiOnline ? "Thank you. You may now proceed." : "Waiting for a connection to the OneCSM server.";
}

function showScreen(screenId) {
  document.getElementById("clientInformationScreen").hidden = screenId !== "clientInformationScreen";
  document.getElementById("certificateScreen").hidden = screenId !== "certificateScreen";
  const welcomeElements = ["welcomeTitle", "welcomeIntro", "privacyPanel", "consentRow", "proceedButton", "buttonHint", "developmentNotice"];
  welcomeElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.hidden = screenId !== "welcome";
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function proceedToAppearance() {
  if (!document.getElementById("consentCheckbox").checked || !apiOnline) return;
  showScreen("clientInformationScreen");
  document.getElementById("fullName").focus();
}

function setFormBusy(busy) {
  const button = document.getElementById("submitClientButton");
  button.disabled = busy;
  button.textContent = busy ? "Submitting… Please wait" : "Submit & Generate Certificate →";
}

function showFormError(message) {
  const error = document.getElementById("formError");
  error.textContent = message;
  error.hidden = false;
}

async function submitClientInformation(event) {
  event.preventDefault();
  const form = document.getElementById("clientInformationForm");
  const error = document.getElementById("formError");
  error.hidden = true;
  if (!form.reportValidity()) return;
  if (!apiOnline) return showFormError("The server connection is unavailable. Please try again later.");

  const data = {
    fullName: document.getElementById("fullName").value.trim().toUpperCase(),
    schoolOrAgency: document.getElementById("schoolOrAgency").value.trim().toUpperCase(),
    purpose: document.getElementById("purpose").value.trim().toUpperCase(),
    consentGiven: document.getElementById("consentCheckbox").checked
  };
  if (!data.consentGiven) return showFormError("Consent is required before submitting.");
  setFormBusy(true);
  try {
    const result = await apiRequest("startClientTransaction", data);
    activeControlNumber = result.controlNumber;
    displayCertificateResult(result);
    showScreen("certificateScreen");
  } catch (err) {
    console.error("Client transaction failed:", err);
    showFormError(`${err.message} Your information may not have been submitted. Please do not submit repeatedly; contact the office if you are unsure.`);
  } finally {
    setFormBusy(false);
  }
}

function displayCertificateResult(result) {
  document.getElementById("controlNumberValue").textContent = result.controlNumber || "Not available";
  const message = document.getElementById("certificateMessage");
  const actions = document.getElementById("certificateActions");
  const error = document.getElementById("certificateError");
  const retry = document.getElementById("retryCertificateButton");
  const link = document.getElementById("openCertificateLink");
  error.hidden = true;
  if (result.certificateReady && result.pdfUrl) {
    message.textContent = "Your information has been recorded and your Certificate of Appearance is ready.";
    link.href = result.pdfUrl;
    actions.hidden = false;
    retry.hidden = true;
  } else {
    message.textContent = "Your information has been recorded, but the certificate could not be generated yet.";
    actions.hidden = true;
    retry.hidden = false;
    error.textContent = result.certificateError || result.message || "Certificate generation failed.";
    error.hidden = false;
  }
}

async function retryCertificateGeneration() {
  if (!activeControlNumber) return;
  const button = document.getElementById("retryCertificateButton");
  const error = document.getElementById("certificateError");
  button.disabled = true;
  button.textContent = "Retrying…";
  error.hidden = true;
  try {
    const result = await apiRequest("retryAppearancePDF", { controlNumber: activeControlNumber });
    displayCertificateResult(result);
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Retry Certificate Generation";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("clientInformationForm").addEventListener("submit", submitClientInformation);
  document.getElementById("backToWelcomeButton").addEventListener("click", () => showScreen("welcome"));
  document.getElementById("retryCertificateButton").addEventListener("click", retryCertificateGeneration);
  ["fullName", "schoolOrAgency", "purpose"].forEach(id => {
    document.getElementById(id).addEventListener("input", event => {
      const start = event.target.selectionStart;
      const end = event.target.selectionEnd;
      event.target.value = event.target.value.toUpperCase();
      try { event.target.setSelectionRange(start, end); } catch (_) {}
    });
  });
  checkApiConnection();
});
