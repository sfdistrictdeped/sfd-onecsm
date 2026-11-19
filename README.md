# San Fernando District OneCSM — Initial Frontend

This is the initial GitHub Pages frontend package for the San Fernando District OneCSM system.

## Included
- Welcome and data privacy consent screen
- San Fernando District and institutional logos
- Apps Script API connection check (`?action=ping`)
- JSON API request helper for the backend actions:
  - `startClientTransaction`
  - `retryAppearancePDF`
  - `submitCSMResponse`

## API endpoint
The deployed Google Apps Script Web App URL is configured in `js/app.js`.

## Current development status
The welcome screen and API connectivity check are connected. The client-information form, certificate flow, CSM survey screens, and completion/reset flow are still to be implemented.

## Deployment
Upload the contents of this folder to the root of the GitHub Pages repository. Keep the `assets`, `css`, and `js` folders in their current locations.


## Updated client workflow
1. Welcome, privacy notice, and consent.
2. Client information is saved and the Certificate of Appearance is generated in the background.
3. Client completes the CSM questionnaire (CC1–CC3 and SQD0–SQD8).
4. After successful CSM submission, the certificate screen is shown for opening/printing.

The certificate is generated after client registration but is not displayed until the survey is submitted.
