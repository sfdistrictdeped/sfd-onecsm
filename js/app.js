/****************************************************
 * SAN FERNANDO DISTRICT ONECSM — FRONTEND API CLIENT
 ****************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbzQ22SS12cfTw5OZSQRREpbKcwInqLMHWcfk8FulLguw7fMm7p9eqPID_gLUM9ziqkQJA/exec";
let apiOnline = false;
let activeControlNumber = null;
let certificateResult = null;
let activeCertificateBlobUrl = null;
let currentSurveyPage = "client";

const cc1Choices = [
  "I know what a CC is and I saw this office's CC.",
  "I know what a CC is but I did NOT see this office's CC.",
  "I learned of the CC only when I saw this office's CC.",
  "I do not know what a CC is and I did not see one in this office."
];
const cc2Choices = ["Easy to see","Somewhat easy to see","Difficult to see","Not visible at all","N/A"];
const cc3Choices = ["Helped very much","Somewhat helped","Did not help","N/A"];
const clientTypeChoices = ["Citizen","Business","Government (Employee or another agency)"];
const sexChoices = ["Male","Female"];
const sqdQuestions = [
 "I am satisfied with the service that I availed.",
 "I spent a reasonable amount of time for my transaction.",
 "The office followed the transaction's requirements and steps based on the information provided.",
 "The steps (including payment) I needed to do for my transaction were easy and simple.",
 "I easily found information about my transaction from the office or its website.",
 "I paid a reasonable amount of fees for my transaction.",
 "I feel the office was fair to everyone, or “walang palakasan”, during my transaction.",
 "I was treated courteously by the staff, and (if asked for help) the staff was helpful.",
 "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
];
const ratingChoices = [
 {emoji:"😀",label:"Strongly Agree"},
 {emoji:"😊",label:"Agree"},
 {emoji:"😐",label:"Neither Agree nor Disagree"},
 {emoji:"😞",label:"Disagree"},
 {emoji:"😭",label:"Strongly Disagree"},
 {emoji:"🤔",label:"Not Applicable"}
];

async function apiRequest(action,data={}) {
  const response = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify({action,data})
  });
  if(!response.ok) throw new Error(`API request failed (HTTP ${response.status}).`);
  const payload=await response.json();
  if(!payload || typeof payload!=="object") throw new Error("The API returned an invalid response.");
  if(payload.success!==true) throw new Error(payload.message||"The API could not process the request.");
  if(payload.result && payload.result.success===false) throw new Error(payload.result.message||"The transaction was not completed.");
  return payload.result??payload;
}

async function checkApiConnection(){
  const notice=document.getElementById("developmentNotice");
  try{
    const r=await fetch(`${API_URL}?action=ping`,{cache:"no-store"});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const d=await r.json();
    if(d.success!==true || d.status!=="API ONLINE") throw new Error("Unexpected API response.");
    apiOnline=true;
    notice.textContent="System connection verified. You may proceed.";
    notice.classList.add("api-online"); notice.classList.remove("api-offline");
  }catch(e){
    console.error(e); apiOnline=false;
    notice.textContent="Unable to connect to the OneCSM server. Please check your internet connection or contact the system administrator.";
    notice.classList.add("api-offline"); notice.classList.remove("api-online");
  }
  notice.style.display="block"; updateProceedButton();
}

function updateProceedButton(){
  const consent=document.getElementById("consentCheckbox");
  if(!consent)return;
  document.getElementById("proceedButton").disabled=!consent.checked||!apiOnline;
  document.getElementById("buttonHint").textContent=!consent.checked
    ?"Please read the notice and provide your consent to continue."
    :apiOnline?"Thank you. You may now proceed.":"Waiting for a connection to the OneCSM server.";
}

function showScreen(id){
  const ids=["clientInformationScreen","csmScreen","certificateScreen"];
  ids.forEach(x=>document.getElementById(x).hidden=x!==id);
  const welcome=["welcomeTitle","welcomeIntro","privacyPanel","consentRow","proceedButton","buttonHint","developmentNotice"];
  welcome.forEach(x=>{const el=document.getElementById(x);if(el)el.hidden=id!=="welcome";});
  window.scrollTo({top:0,behavior:"instant"});
}

function proceedToAppearance(){
  if(!document.getElementById("consentCheckbox").checked||!apiOnline)return;
  showScreen("clientInformationScreen");
  document.getElementById("fullName").focus();
}

function setBusy(id,busy,busyText,normalText){
  const b=document.getElementById(id); b.disabled=busy; b.textContent=busy?busyText:normalText;
}
function showError(id,msg){const el=document.getElementById(id);el.textContent=msg;el.hidden=false;}

async function submitClientInformation(event){
  event.preventDefault();
  const form=document.getElementById("clientInformationForm");
  document.getElementById("formError").hidden=true;
  if(!form.reportValidity())return;
  if(!apiOnline)return showError("formError","The server connection is unavailable.");
  const data={
    fullName:document.getElementById("fullName").value.trim().toUpperCase(),
    schoolOrAgency:document.getElementById("schoolOrAgency").value.trim().toUpperCase(),
    purpose:document.getElementById("purpose").value.trim().toUpperCase(),
    consentGiven:document.getElementById("consentCheckbox").checked
  };
  if(!data.consentGiven)return showError("formError","Consent is required before submitting.");
  setBusy("submitClientButton",true,"Saving client information…","Continue to CSM Survey →");
  try{
    const result=await apiRequest("startClientTransaction",data);
    activeControlNumber=result.controlNumber; certificateResult=result;
    setTodayDate();
    showScreen("csmScreen"); showSurveyPage("client");
  }catch(e){
    showError("formError",e.message+" If unsure whether the record was saved, contact the office before trying again.");
  }finally{
    setBusy("submitClientButton",false,"Saving client information…","Continue to CSM Survey →");
  }
}

function setTodayDate(){
  const now=new Date();
  const localDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  document.getElementById("surveyDate").value=localDate;
  document.getElementById("surveyDateDisplay").textContent=now.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
}

function showSurveyPage(page){
  currentSurveyPage=page;
  const pages={client:"surveyPageClient",cc:"surveyPageCc",sqd:"surveyPageSqd",feedback:"surveyPageFeedback"};
  Object.entries(pages).forEach(([key,id])=>document.getElementById(id).hidden=key!==page);
  document.querySelectorAll("[data-page-dot]").forEach(dot=>{
    const active=dot.dataset.pageDot===page;
    dot.classList.toggle("active",active);
    dot.classList.toggle("complete",Object.keys(pages).indexOf(dot.dataset.pageDot)<Object.keys(pages).indexOf(page));
  });
  window.scrollTo({top:0,behavior:"instant"});
}

function openPicker(type){
  const choices=type==="clientType"?clientTypeChoices:sexChoices;
  const title=type==="clientType"?"Select Client Type":"Select Sex";
  const hidden=document.getElementById(type);
  document.getElementById("pickerTitle").textContent=title;
  document.getElementById("pickerOptions").innerHTML=choices.map(value=>
    `<button type="button" class="picker-option ${hidden.value===value?"selected":""}" data-value="${value.replace(/"/g,"&quot;")}">${value}<span>→</span></button>`
  ).join("");
  document.getElementById("pickerOverlay").hidden=false;
  document.getElementById("pickerOptions").querySelectorAll("button").forEach(button=>{
    button.addEventListener("click",()=>{
      hidden.value=button.dataset.value;
      const picker=document.getElementById(type==="clientType"?"clientTypePicker":"sexPicker");
      picker.innerHTML=`${button.dataset.value}<span>⌄</span>`;
      picker.classList.add("has-value");
      document.getElementById("pickerOverlay").hidden=true;
    });
  });
}
function selected(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||"";}

function renderChoices(containerId,name,choices){
  const box=document.getElementById(containerId);
  box.innerHTML=choices.map((value,index)=>
    `<label class="choice-option"><input type="radio" name="${name}" value="${value.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}"><span class="choice-index">${String.fromCharCode(65+index)}</span><span class="choice-text">${value}</span></label>`
  ).join("");
}
function handleCC1Change(){
  const skip=selected("cc1")===cc1Choices[3];
  document.getElementById("cc2Field").hidden=skip;
  document.getElementById("cc3Field").hidden=skip;
}

function renderAllSqdQuestions(){
  const box=document.getElementById("sqdAllQuestions");
  box.innerHTML=sqdQuestions.map((question,index)=>`
    <article class="sqd-item">
      <div class="sqd-item-heading"><span class="sqd-tag">SQD${index}</span><p>${question}</p></div>
      <div class="sqd-rating-grid">
        ${ratingChoices.map(r=>`<label class="sqd-rating-option"><input type="radio" name="sqd${index}" value="${r.emoji}"><span class="sqd-emoji">${r.emoji}</span><span class="sqd-rating-label">${r.label}</span></label>`).join("")}
      </div>
    </article>`).join("");
}

function validateClientPage(){
  const required=[["clientType","Please select your client type."],["sex","Please select your sex."],["age","Please enter your age."],["address","Please enter your address."],["serviceAvailed","Please enter the service you availed."]];
  for(const [id,message] of required){
    const el=document.getElementById(id);
    if(!String(el.value).trim()){showError("clientPageError",message);return false;}
  }
  const age=Number(document.getElementById("age").value);
  if(!Number.isInteger(age)||age<1||age>120){showError("clientPageError","Please enter a valid age from 1 to 120.");return false;}
  document.getElementById("clientPageError").hidden=true;return true;
}
function validateCcPage(){
  if(!selected("cc1")){showError("ccPageError","Please answer CC1.");return false;}
  if(selected("cc1")!==cc1Choices[3]&&!selected("cc2")){showError("ccPageError","Please answer CC2.");return false;}
  if(selected("cc1")!==cc1Choices[3]&&!selected("cc3")){showError("ccPageError","Please answer CC3.");return false;}
  document.getElementById("ccPageError").hidden=true;return true;
}
function validateSqdPage(){
  for(let i=0;i<9;i++)if(!selected(`sqd${i}`)){showError("sqdPageError",`Please answer SQD${i}.`);return false;}
  document.getElementById("sqdPageError").hidden=true;return true;
}

async function submitCsm(event){
  event.preventDefault();
  document.getElementById("feedbackPageError").hidden=true;
  const email=document.getElementById("emailAddress").value.trim();
  if(email&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
    showError("feedbackPageError","Please enter a valid email address.");return;
  }
  const data={
    controlNumber:activeControlNumber,
    clientType:document.getElementById("clientType").value,
    date:document.getElementById("surveyDate").value,
    sex:document.getElementById("sex").value,
    age:document.getElementById("age").value,
    // The current Apps Script contract still names this field regionOfResidence.
    // Address is passed through that field until the sheet/backend schema is migrated.
    regionOfResidence:document.getElementById("address").value.trim(),
    serviceAvailed:document.getElementById("serviceAvailed").value.trim(),
    cc1:selected("cc1"),cc2:selected("cc2")||"N/A",cc3:selected("cc3")||"N/A",
    suggestions:document.getElementById("suggestions").value.trim(),
    emailAddress:email
  };
  for(let i=0;i<9;i++)data[`sqd${i}`]=selected(`sqd${i}`);
  setBusy("submitCsmButton",true,"Submitting survey…","Submit Survey ✓");
  try{
    await apiRequest("submitCSMResponse",data);
    displayCertificateResult(certificateResult);showScreen("certificateScreen");
  }catch(e){showError("feedbackPageError",e.message);}
  finally{setBusy("submitCsmButton",false,"Submitting survey…","Submit Survey ✓");}
}

function displayCertificateResult(result){
  document.getElementById("controlNumberValue").textContent=result.controlNumber||activeControlNumber||"Not available";
  const msg=document.getElementById("certificateMessage");
  const actions=document.getElementById("certificateActions");
  const err=document.getElementById("certificateError");
  const retry=document.getElementById("retryCertificateButton");
  const link=document.getElementById("openCertificateLink");
  err.hidden=true;
  if(result.certificateReady&&result.certificateToken){
    msg.textContent="Thank you for completing the survey. Your information and feedback have been recorded. Your Certificate of Appearance is ready.";
    link.disabled=false;actions.hidden=false;retry.hidden=true;
  }else{
    msg.textContent="Your information and survey response have been recorded, but the certificate could not be generated yet.";
    link.disabled=true;actions.hidden=true;retry.hidden=false;
    err.textContent=result.certificateError||result.message||"Certificate generation failed.";err.hidden=false;
  }
}

function resetKioskToWelcome(){
  // Clear the completed transaction from the kiosk before the next client.
  const clientForm=document.getElementById("clientInformationForm");
  const csmForm=document.getElementById("csmForm");
  if(clientForm) clientForm.reset();
  if(csmForm) csmForm.reset();

  ["clientType","sex"].forEach(id=>{
    const field=document.getElementById(id);
    if(field) field.value="";
  });
  document.getElementById("clientTypePicker").innerHTML='Choose client type <span>⌄</span>';
  document.getElementById("sexPicker").innerHTML='Choose sex <span>⌄</span>';
  document.getElementById("clientTypePicker").classList.remove("has-value");
  document.getElementById("sexPicker").classList.remove("has-value");

  ["formError","clientPageError","ccPageError","sqdPageError","feedbackPageError","certificateError"].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.hidden=true;el.textContent="";}
  });
  document.getElementById("cc2Field").hidden=false;
  document.getElementById("pickerOverlay").hidden=true;
  document.getElementById("certificateActions").hidden=true;
  document.getElementById("retryCertificateButton").hidden=true;
  document.getElementById("certificateMessage").textContent="Your client information has been recorded.";
  document.getElementById("controlNumberValue").textContent="—";
  document.getElementById("certificatePreviewFrame").src="about:blank";
  document.getElementById("certificatePreviewOverlay").hidden=true;
  if(activeCertificateBlobUrl){
    URL.revokeObjectURL(activeCertificateBlobUrl);
    activeCertificateBlobUrl=null;
  }

  activeControlNumber=null;
  certificateResult=null;
  setTodayDate();
  showScreen("welcome");
  window.scrollTo({top:0,behavior:"instant"});
}

async function openCertificatePreview(){
  if(!certificateResult || !certificateResult.certificateToken || !activeControlNumber)return;
  const button=document.getElementById("openCertificateLink");
  button.disabled=true;
  const originalText=button.textContent;
  button.textContent="Preparing certificate…";
  try{
    const pdfData=await apiRequest("getAppearancePdf",{
      controlNumber:activeControlNumber,
      certificateToken:certificateResult.certificateToken
    });
    const binary=atob(pdfData.base64);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const pdfBlob=new Blob([bytes],{type:"application/pdf"});
    if(activeCertificateBlobUrl)URL.revokeObjectURL(activeCertificateBlobUrl);
    activeCertificateBlobUrl=URL.createObjectURL(pdfBlob);
    document.getElementById("certificatePreviewFrame").src=activeCertificateBlobUrl;
    document.getElementById("certificatePreviewOverlay").hidden=false;
  }catch(error){
    showError("certificateError",error.message);
  }finally{
    button.disabled=false;
    button.textContent=originalText;
  }
}

function closeCertificatePreview(){
  document.getElementById("certificatePreviewOverlay").hidden=true;
  document.getElementById("certificatePreviewFrame").src="about:blank";
  if(activeCertificateBlobUrl){
    URL.revokeObjectURL(activeCertificateBlobUrl);
    activeCertificateBlobUrl=null;
  }
}

function finishCertificateAndReset(){
  closeCertificatePreview();
  document.getElementById("certificateMessage").textContent=
    "Thank you! Please submit your printed Certificate of Appearance to the Administrative Officer / Aide of the Day, or directly to the Supervisor if present.";
  // Brief thank-you pause, then clear this kiosk for the next client.
  window.setTimeout(resetKioskToWelcome,5000);
}

async function retryCertificateGeneration(){
  if(!activeControlNumber)return;
  const b=document.getElementById("retryCertificateButton"),err=document.getElementById("certificateError");
  b.disabled=true;b.textContent="Retrying…";err.hidden=true;
  try{certificateResult=await apiRequest("retryAppearancePDF",{controlNumber:activeControlNumber});displayCertificateResult(certificateResult);}
  catch(e){showError("certificateError",e.message);}
  finally{b.disabled=false;b.textContent="Retry Certificate Generation";}
}

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("clientInformationForm").addEventListener("submit",submitClientInformation);
  document.getElementById("csmForm").addEventListener("submit",submitCsm);
  document.getElementById("backToWelcomeButton").addEventListener("click",()=>showScreen("welcome"));
  document.getElementById("backToClientButton").addEventListener("click",()=>showSurveyPage("client"));
  document.getElementById("retryCertificateButton").addEventListener("click",retryCertificateGeneration);
  document.getElementById("openCertificateLink").addEventListener("click",openCertificatePreview);
  document.getElementById("closeCertificatePreview").addEventListener("click",closeCertificatePreview);
  document.getElementById("finishCertificateButton").addEventListener("click",finishCertificateAndReset);
  document.getElementById("clientToCcButton").addEventListener("click",()=>{if(validateClientPage())showSurveyPage("cc");});
  document.getElementById("ccBackButton").addEventListener("click",()=>showSurveyPage("client"));
  document.getElementById("ccToSqdButton").addEventListener("click",()=>{if(validateCcPage())showSurveyPage("sqd");});
  document.getElementById("sqdBackButton").addEventListener("click",()=>showSurveyPage("cc"));
  document.getElementById("sqdToFeedbackButton").addEventListener("click",()=>{if(validateSqdPage())showSurveyPage("feedback");});
  document.getElementById("feedbackBackButton").addEventListener("click",()=>showSurveyPage("sqd"));
  document.getElementById("clientTypePicker").addEventListener("click",()=>openPicker("clientType"));
  document.getElementById("sexPicker").addEventListener("click",()=>openPicker("sex"));
  document.getElementById("closePickerButton").addEventListener("click",()=>document.getElementById("pickerOverlay").hidden=true);
  document.getElementById("pickerOverlay").addEventListener("click",e=>{if(e.target.id==="pickerOverlay")e.currentTarget.hidden=true;});
  renderChoices("cc1Options","cc1",cc1Choices);
  renderChoices("cc2Options","cc2",cc2Choices);
  renderChoices("cc3Options","cc3",cc3Choices);
  document.getElementById("cc1Options").addEventListener("change",handleCC1Change);
  renderAllSqdQuestions();
  ["fullName","schoolOrAgency","purpose"].forEach(id=>document.getElementById(id).addEventListener("input",e=>{
    const a=e.target.selectionStart,b=e.target.selectionEnd;e.target.value=e.target.value.toUpperCase();
    try{e.target.setSelectionRange(a,b);}catch(_){}
  }));
  checkApiConnection();
});
