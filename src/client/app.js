(() => {
"use strict";
const STORAGE_KEY="waymark.hunt-selection.v1", SESSION_KEY="waymark.application-session.v2";
const clone=v=>JSON.parse(JSON.stringify(v));
const today=()=>new Date().toLocaleDateString("en-CA");
const state={hunts:loadHunts(),selected:new Set(),sessionIds:[],currentIndex:0,sessionStarted:false};
const $=id=>document.getElementById(id);
const el={selectionView:$("selectionView"),wizardView:$("wizardView"),completeView:$("completeView"),huntRows:$("huntRows"),selectAll:$("selectAll"),searchInput:$("searchInput"),applicantFilter:$("applicantFilter"),priorityFilter:$("priorityFilter"),statusFilter:$("statusFilter"),sortSelect:$("sortSelect"),resultCount:$("resultCount"),selectedCount:$("selectedCount"),selectedCost:$("selectedCost"),startButton:$("startButton"),resetButton:$("resetButton"),wizardProgress:$("wizardProgress"),wizardProgressBar:$("wizardProgressBar"),wizardApplicant:$("wizardApplicant"),wizardTitle:$("wizardTitle"),wizardSubtitle:$("wizardSubtitle"),wizardDeadline:$("wizardDeadline"),detailPriority:$("detailPriority"),detailFee:$("detailFee"),detailRow:$("detailRow"),wizardNotes:$("wizardNotes"),detailsLink:$("detailsLink"),applyLink:$("applyLink"),confirmationInput:$("confirmationInput"),dateAppliedInput:$("dateAppliedInput"),backButton:$("backButton"),previousButton:$("previousButton"),skipButton:$("skipButton"),appliedButton:$("appliedButton"),completeSummary:$("completeSummary"),completeList:$("completeList"),downloadCsvButton:$("downloadCsvButton"),returnButton:$("returnButton")};

function loadHunts(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!Array.isArray(saved))return clone(WAYMARK_SAMPLE_HUNTS);const byId=new Map(saved.map(h=>[h.huntId,h]));return clone(WAYMARK_SAMPLE_HUNTS).map(h=>({...h,...(byId.get(h.huntId)||{})}));}catch{return clone(WAYMARK_SAMPLE_HUNTS);}}
function saveHunts(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state.hunts));}
function saveSession(){if(state.sessionStarted&&state.sessionIds.length)sessionStorage.setItem(SESSION_KEY,JSON.stringify({sessionIds:state.sessionIds,currentIndex:state.currentIndex}));}
function loadSession(){try{const s=JSON.parse(sessionStorage.getItem(SESSION_KEY));if(!s?.sessionIds?.length)return false;state.sessionIds=s.sessionIds.filter(id=>state.hunts.some(h=>h.huntId===id));if(!state.sessionIds.length)return false;state.currentIndex=Math.min(Math.max(Number(s.currentIndex)||0,0),state.sessionIds.length-1);state.sessionStarted=true;return true;}catch{return false;}}
function clearSession(){sessionStorage.removeItem(SESSION_KEY);state.sessionStarted=false;}
function money(v){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v)||0);}
function dateText(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||""))return v||"No deadline";return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(v+"T12:00:00"));}
function deadlineKey(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||"")?v:"9999-12-31";}
function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function priorityRank(v){return({A:1,B:2,C:3}[v]||9);}
function currentHunt(){return state.hunts.find(h=>h.huntId===state.sessionIds[state.currentIndex]);}
function filteredHunts(){
 let hunts=[...state.hunts],q=el.searchInput.value.trim().toLowerCase();
 if(q)hunts=hunts.filter(h=>[h.huntArea,h.speciesGroup,h.huntCategory,h.region,h.notes,h.priorityReason].some(v=>String(v).toLowerCase().includes(q)));
 if(el.applicantFilter.value!=="all")hunts=hunts.filter(h=>h.applicant===el.applicantFilter.value);
 if(el.priorityFilter.value!=="all")hunts=hunts.filter(h=>h.priority===el.priorityFilter.value);
 if(el.statusFilter.value!=="all")hunts=hunts.filter(h=>h.applicationStatus===el.statusFilter.value);
 const sort=el.sortSelect.value;
 hunts.sort((a,b)=>{
  if(sort==="priority")return priorityRank(a.priority)-priorityRank(b.priority)||deadlineKey(a.applicationDeadline).localeCompare(deadlineKey(b.applicationDeadline))||a.huntArea.localeCompare(b.huntArea);
  if(sort==="area")return a.huntArea.localeCompare(b.huntArea)||a.applicant.localeCompare(b.applicant);
  if(sort==="species")return a.speciesGroup.localeCompare(b.speciesGroup)||a.huntArea.localeCompare(b.huntArea)||a.applicant.localeCompare(b.applicant);
  if(sort==="applicant")return a.applicant.localeCompare(b.applicant)||deadlineKey(a.applicationDeadline).localeCompare(deadlineKey(b.applicationDeadline));
  return deadlineKey(a.applicationDeadline).localeCompare(deadlineKey(b.applicationDeadline))||priorityRank(a.priority)-priorityRank(b.priority)||a.huntArea.localeCompare(b.huntArea)||a.applicant.localeCompare(b.applicant);
 });
 return hunts;
}
function renderList(){
 const hunts=filteredHunts();el.resultCount.textContent=hunts.length;
 el.huntRows.innerHTML=hunts.map(h=>`<tr class="${state.selected.has(h.huntId)?"selected-row":""}">
 <td><input class="hunt-check" type="checkbox" data-id="${escapeHtml(h.huntId)}" ${state.selected.has(h.huntId)?"checked":""}></td>
 <td><strong>${escapeHtml(dateText(h.applicationDeadline))}</strong></td>
 <td><span class="priority-chip priority-${escapeHtml(h.priority.toLowerCase())}">${escapeHtml(h.priority)}</span></td>
 <td><strong>${escapeHtml(h.applicant)}</strong><span class="${h.applicantType==="Youth"?"youth-chip":"adult-chip"}">${escapeHtml(h.applicantType)}</span></td>
 <td><strong>${escapeHtml(h.huntArea)}</strong><br><span class="muted">${escapeHtml(h.region)}</span></td>
 <td><strong>${escapeHtml(h.speciesGroup)}</strong><br><span class="muted">${escapeHtml(h.huntCategory)}</span></td>
 <td>${escapeHtml(money(h.applicationFee))}</td>
 <td><span class="status-chip status-${h.applicationStatus.toLowerCase().replaceAll(" ","-")}">${escapeHtml(h.applicationStatus)}</span>${h.dateApplied?`<br><span class="muted">${escapeHtml(dateText(h.dateApplied))}</span>`:""}</td></tr>`).join("");
 document.querySelectorAll(".hunt-check").forEach(box=>box.addEventListener("change",e=>{e.target.checked?state.selected.add(e.target.dataset.id):state.selected.delete(e.target.dataset.id);renderList();}));
 const selected=state.hunts.filter(h=>state.selected.has(h.huntId));el.selectedCount.textContent=`${selected.length} selected`;el.selectedCost.textContent=` · ${money(selected.reduce((s,h)=>s+Number(h.applicationFee||0),0))} total fees`;el.startButton.disabled=!selected.length;
 el.selectAll.checked=hunts.length>0&&hunts.every(h=>state.selected.has(h.huntId));el.selectAll.indeterminate=hunts.some(h=>state.selected.has(h.huntId))&&!el.selectAll.checked;
}
function startSession(){state.sessionIds=filteredHunts().filter(h=>state.selected.has(h.huntId)).map(h=>h.huntId);if(!state.sessionIds.length)return;state.currentIndex=0;state.sessionStarted=true;saveSession();show("wizard");renderWizard();}
function preserveDraft(){const h=currentHunt();if(!h)return;h.confirmationNumber=el.confirmationInput.value.trim();h.dateApplied=el.dateAppliedInput.value||h.dateApplied||"";saveHunts();}
function renderWizard(){const h=currentHunt();if(!h)return finishSession();const total=state.sessionIds.length;el.wizardProgress.textContent=`${state.currentIndex+1} of ${total}`;el.wizardProgressBar.max=total;el.wizardProgressBar.value=state.currentIndex+1;el.wizardApplicant.textContent=`${h.applicantType} · ${h.applicant}`;el.wizardTitle.textContent=h.huntArea;el.wizardSubtitle.textContent=`${h.speciesGroup} · ${h.huntCategory}`;el.wizardDeadline.textContent=`Due ${dateText(h.applicationDeadline)}`;el.detailPriority.textContent=h.priority;el.detailFee.textContent=money(h.applicationFee);el.detailRow.textContent=h.sourceRow;el.wizardNotes.textContent=h.notes||h.priorityReason||"No notes.";el.detailsLink.href=h.areaDetailsUrl||h.officialDetailsUrl;el.applyLink.href=h.applyPortalUrl||h.officialDetailsUrl;el.confirmationInput.value=h.confirmationNumber||"";el.dateAppliedInput.value=h.dateApplied||today();el.previousButton.disabled=state.currentIndex===0;saveSession();}
function saveApplied(){const h=currentHunt();h.applicationStatus="Applied";h.dateApplied=el.dateAppliedInput.value||today();h.confirmationNumber=el.confirmationInput.value.trim();h.lastUpdated=new Date().toISOString();state.selected.delete(h.huntId);saveHunts();next();}
function skip(){const h=currentHunt();h.applicationStatus="Skipped";h.confirmationNumber=el.confirmationInput.value.trim();h.lastUpdated=new Date().toISOString();saveHunts();next();}
function previous(){if(!state.currentIndex)return;preserveDraft();state.currentIndex--;saveSession();renderWizard();}
function next(){state.currentIndex++;saveSession();state.currentIndex>=state.sessionIds.length?finishSession():renderWizard();}
function finishSession(){show("complete");const session=state.sessionIds.map(id=>state.hunts.find(h=>h.huntId===id)).filter(Boolean),applied=session.filter(h=>h.applicationStatus==="Applied"),skipped=session.filter(h=>h.applicationStatus==="Skipped");el.completeSummary.textContent=`${applied.length} applied${skipped.length?` · ${skipped.length} skipped`:""} · ${session.length} total.`;el.completeList.innerHTML=session.map(h=>`<div><strong>${escapeHtml(h.applicant)} — ${escapeHtml(h.huntArea)}</strong><span>${escapeHtml(h.speciesGroup)} · ${escapeHtml(h.applicationStatus)}${h.dateApplied?` · ${escapeHtml(dateText(h.dateApplied))}`:""}</span></div>`).join("");clearSession();}
function show(v){el.selectionView.hidden=v!=="selection";el.wizardView.hidden=v!=="wizard";el.completeView.hidden=v!=="complete";window.scrollTo({top:0,behavior:"smooth"});}
function downloadCsv(){const rows=[["Master List Row","Hunt ID","Applicant(s)","Hunt Area","Species Group","Hunt Category","Applied","Date Applied","TPWD Confirmation #"]];state.hunts.filter(h=>state.sessionIds.includes(h.huntId)).forEach(h=>rows.push([h.sourceRow,h.huntId,h.applicant,h.huntArea,h.speciesGroup,h.huntCategory,h.applicationStatus==="Applied"?"Yes":"No",h.dateApplied||"",h.confirmationNumber||""]));const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`waymark-application-updates-${today()}.csv`;a.click();URL.revokeObjectURL(a.href);}
[el.searchInput,el.applicantFilter,el.priorityFilter,el.statusFilter,el.sortSelect].forEach(x=>x.addEventListener(x===el.searchInput?"input":"change",renderList));
el.selectAll.addEventListener("change",()=>{filteredHunts().forEach(h=>el.selectAll.checked?state.selected.add(h.huntId):state.selected.delete(h.huntId));renderList();});
el.startButton.addEventListener("click",startSession);el.backButton.addEventListener("click",()=>{preserveDraft();show("selection");renderList();});el.previousButton.addEventListener("click",previous);el.appliedButton.addEventListener("click",saveApplied);el.skipButton.addEventListener("click",skip);el.returnButton.addEventListener("click",()=>{show("selection");renderList();});el.downloadCsvButton.addEventListener("click",downloadCsv);
el.resetButton.addEventListener("click",()=>{if(!confirm("Reset all locally saved statuses and application details?"))return;localStorage.removeItem(STORAGE_KEY);sessionStorage.removeItem(SESSION_KEY);state.hunts=clone(WAYMARK_SAMPLE_HUNTS);state.selected.clear();state.sessionIds=[];state.currentIndex=0;state.sessionStarted=false;show("selection");renderList();});
renderList();if(loadSession()){show("wizard");renderWizard();}
})();