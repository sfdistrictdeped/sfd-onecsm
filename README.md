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
