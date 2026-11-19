function updateProceedButton() {
      const consentGiven = document.getElementById(
        "consentCheckbox"
      ).checked;

      document.getElementById("proceedButton").disabled =
        !consentGiven;

      document.getElementById("buttonHint").textContent =
        consentGiven
          ? "Thank you. You may now proceed."
          : "Please read the notice and provide your consent to continue.";
    }

    function proceedToAppearance() {
      const consentGiven = document.getElementById(
        "consentCheckbox"
      ).checked;

      if (!consentGiven) return;

      // Temporary development action.
      // The Stage 1 appearance form will replace this in the next step.
      const notice = document.getElementById("developmentNotice");
      notice.textContent =
        "Consent accepted. The Appearance Information screen will be connected in the next development step.";
      notice.style.display = "block";
    }
