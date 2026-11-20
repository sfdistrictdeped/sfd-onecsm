# San Fernando District OneCSM — Revised Paged Frontend

## Workflow
1. Welcome and consent
2. Client information (client registration)
3. CSM Page 1: Client information (client type and sex use button pop-up pickers; date is automatically set to today; address is typed manually)
4. CSM Page 2: Citizen's Charter (CC1–CC3)
5. CSM Page 3: All nine SQD questions on one page
6. CSM Page 4: Suggestions and email
7. Certificate of Appearance (shown after successful survey submission)

## Install
Upload the contents of this folder to the existing GitHub Pages repository, replacing the old `index.html`, `css/style.css`, `js/app.js`, and keeping the `assets` folder.

## Backend compatibility note
The current Apps Script API contract accepts the address value through its existing `regionOfResidence` property. Consequently, until the backend spreadsheet schema is migrated, this address will be written into the existing `REGION_OF_RESIDENCE` column. Rename that sheet column to `ADDRESS` and update the Apps Script validation/write mapping in a coordinated backend update before production use.


## Kiosk reset
After the client clicks **Open / Print Certificate**, the PDF opens in a new tab and the kiosk page automatically resets to the welcome screen after 5 seconds, clearing the previous client's entered data.


## Visual refresh
- District logo is used as favicon and Apple touch icon.
- Updated navy-blue and yellow Windows 7 Aero-inspired theme with glossy gradients, layered highlights, decorative circular motifs and depth.
- Form and data-entry panels remain white / light grey for readability.
- Footer heading: “Bansang Makabata, Batang Makabansa”; development credit and year updated.


## Kiosk certificate printing
The PDF opens inside an in-app overlay instead of navigating to a new browser tab. The kiosk remains on OneCSM. After printing, the client selects “Done — Return to Welcome”; the app displays a short thank-you message and resets to the welcome screen after 5 seconds.


## Private certificate delivery (Apps Script backend update required)
The PDF remains private in the existing Google Drive folder. The frontend requests its PDF bytes from Apps Script using a short-lived per-transaction token (15 minutes), then creates a browser-local Blob URL for the embedded PDF viewer. The kiosk does not open a Google Drive sharing page and the PDF does not need to be made public.

### Deployment
1. Replace the entire Apps Script `Code.gs` with the supplied updated `Code.gs`.
2. Save and deploy a **New version** of the existing Web App deployment.
3. Keep Execute as: Me; Who has access: Anyone.
4. Replace the GitHub Pages frontend files with this ZIP's contents.


## Thank-you countdown
After the kiosk user presses **Done — Return to Welcome**, OneCSM now displays a branded thank-you screen with a five-second visible countdown. The user can press **Return to Welcome Now** to skip the countdown. No Apps Script backend changes are needed for this frontend-only update.


## Administrator Portal — Initial Implementation

The public welcome screen includes an Administrator Portal button. The admin area provides:
- Server-verified PIN sign-in (6–12 digits).
- Server-side session tokens with a 30-minute inactivity timeout.
- Overview metrics: registrations, completed responses, responses today, client type and sex distribution, recent responses.
- Graphs & Measurements: SQD averages (excluding N/A), CC1–CC3 distributions, and service counts.
- Logout invalidates the current session.

### Configure the first administrator PIN
1. Open the Apps Script editor.
2. Select the function `setAdminPin` in the function dropdown.
3. Replace the sample argument in the editor with your chosen PIN, for example:
   `setAdminPin("YOUR-OWN-6-TO-12-DIGIT-PIN");`
4. Run the function once and authorize it if prompted.
5. Do not publish the PIN in GitHub or share it in frontend code.

Only a SHA-256 hash is stored in Script Properties. Admin data endpoints require a valid server-issued session token.

### Deployment
- Replace the Apps Script `Code.gs` with `Apps-Script/Code.gs`.
- Deploy a **New version** of the existing Web App deployment.
- Keep Execute as: Me; Who has access: Anyone.
- Replace GitHub Pages files with the contents under `GitHub-Pages/`.

The Report Center is included as a navigation section, but official monthly/quarterly/annual Excel report generation and report history remain the next implementation phase.

## Kiosk restrictions and uppercase collection fields
- Common browser inspection/source shortcuts are suppressed: F12, Ctrl/Command+Shift+I/J/C/K, and Ctrl/Command+U. Right-click is also disabled.
- This is a frontend deterrent only. Configure the browser and operating system in kiosk mode to restrict browser menus, settings, and escape routes; JavaScript cannot guarantee that Developer Tools are inaccessible.
- Free-text collection fields (name, school/agency, purpose, address/region, and suggestions) are automatically converted to uppercase. The backend also normalizes the relevant text fields, including selected office and service, before saving.
- Email addresses remain as entered to avoid altering a contact address.
