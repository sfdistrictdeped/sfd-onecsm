/****************************************************
 * SAN FERNANDO DISTRICT ONECSM — FRONTEND API CLIENT
 ****************************************************/

// Deployed Google Apps Script Web App endpoint.
const API_URL = "https://script.google.com/macros/s/AKfycbzQ22SS12cfTw5OZSQRREpbKcwInqLMHWcfk8FulLguw7fMm7p9eqPID_gLUM9ziqkQJA/exec";

/**
 * Sends a JSON request to the OneCSM Apps Script API.
 * Using text/plain avoids triggering a CORS preflight request.
 * The API response is still expected to be readable JSON.
 */
async function apiRequest(action, data = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({ action, data })
  });

  if (!response.ok) {
    throw new Error(`API request failed (HTTP ${response.status}).`);
  }

  const result = await response.json();

  if (!result || typeof result !== "object") {
    throw new Error("The API returned an invalid response.");
  }

  return result;
}

/** Checks whether the deployed API is reachable. */
async function checkApiConnection() {
  const notice = document.getElementById("developmentNotice");
  const proceedButton = document.getElementById("proceedButton");

  try {
    const response = await fetch(`${API_URL}?action=ping`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (
      result.success !== true ||
      result.status !== "API ONLINE"
    ) {
      throw new Error("Unexpected API response.");
    }

    notice.textContent = "System connection verified. You may proceed.";
    notice.classList.add("api-online");
    notice.classList.remove("api-offline");
    notice.style.display = "block";
    proceedButton.disabled = !document.getElementById("consentCheckbox").checked;

    return true;
  } catch (error) {
    console.error("OneCSM API connection error:", error);
    notice.textContent =
      "Unable to connect to the OneCSM server. Please check your internet connection or contact the system administrator.";
    notice.classList.add("api-offline");
    notice.classList.remove("api-online");
    notice.style.display = "block";
    proceedButton.disabled = true;
    return false;
  }
}

function updateProceedButton() {
  const consentGiven = document.getElementById("consentCheckbox").checked;
  const apiOnline = document.getElementById("developmentNotice").classList.contains("api-online");

  document.getElementById("proceedButton").disabled =
    !consentGiven || !apiOnline;

  document.getElementById("buttonHint").textContent = !consentGiven
    ? "Please read the notice and provide your consent to continue."
    : apiOnline
      ? "Thank you. You may now proceed."
      : "Waiting for a connection to the OneCSM server.";
}

function proceedToAppearance() {
  const consentGiven = document.getElementById("consentCheckbox").checked;
  const apiOnline = document.getElementById("developmentNotice").classList.contains("api-online");

  if (!consentGiven || !apiOnline) return;

  // The welcome screen is connected. The Stage 1 client-information
  // form and transaction submission will be implemented next.
  const notice = document.getElementById("developmentNotice");
  notice.textContent =
    "Connection successful. The Client Information screen is the next development step.";
  notice.style.display = "block";
}

// Check the Apps Script API as soon as the page is ready.
document.addEventListener("DOMContentLoaded", () => {
  checkApiConnection().then(updateProceedButton);
});
