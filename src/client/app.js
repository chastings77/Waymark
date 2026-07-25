(() => {
  "use strict";

  const STORAGE_KEY = "waymark.crossbar.mvp.v3";
  const SESSION_KEY = "waymark.crossbar.session.v1";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const today = () => new Date().toLocaleDateString("en-CA");

  const state = {
    hunts: loadHunts(),
    selected: new Set(),
    sessionIds: [],
    currentIndex: 0,
    sessionStarted: false
  };

  state.hunts.forEach((hunt) => {
    if (hunt.applicationStatus !== "Applied") state.selected.add(hunt.huntId);
  });

  const $ = (id) => document.getElementById(id);
  const el = {
    selectionView: $("selectionView"),
    wizardView: $("wizardView"),
    completeView: $("completeView"),
    huntRows: $("huntRows"),
    selectAll: $("selectAll"),
    sortSelect: $("sortSelect"),
    statusFilter: $("statusFilter"),
    selectedCount: $("selectedCount"),
    selectedCost: $("selectedCost"),
    startButton: $("startButton"),
    resetButton: $("resetButton"),
    wizardProgress: $("wizardProgress"),
    wizardProgressBar: $("wizardProgressBar"),
    wizardApplicant: $("wizardApplicant"),
    wizardTitle: $("wizardTitle"),
    wizardSubtitle: $("wizardSubtitle"),
    wizardDeadline: $("wizardDeadline"),
    detailApplicant: $("detailApplicant"),
    detailFee: $("detailFee"),
    detailStatus: $("detailStatus"),
    wizardNotes: $("wizardNotes"),
    detailsLink: $("detailsLink"),
    applyLink: $("applyLink"),
    confirmationInput: $("confirmationInput"),
    dateAppliedInput: $("dateAppliedInput"),
    backButton: $("backButton"),
    previousButton: $("previousButton"),
    skipButton: $("skipButton"),
    appliedButton: $("appliedButton"),
    completeSummary: $("completeSummary"),
    completeList: $("completeList"),
    downloadCsvButton: $("downloadCsvButton"),
    returnButton: $("returnButton")
  };

  function loadHunts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(WAYMARK_SAMPLE_HUNTS);
    } catch {
      return clone(WAYMARK_SAMPLE_HUNTS);
    }
  }

  function loadSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (!saved || !Array.isArray(saved.sessionIds) || saved.sessionIds.length === 0) return false;
      const validIds = saved.sessionIds.filter((id) => state.hunts.some((hunt) => hunt.huntId === id));
      if (validIds.length === 0) return false;
      state.sessionIds = validIds;
      state.currentIndex = Math.min(Math.max(Number(saved.currentIndex) || 0, 0), validIds.length - 1);
      state.sessionStarted = true;
      return true;
    } catch {
      return false;
    }
  }

  function saveHunts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.hunts));
  }

  function saveSession() {
    if (!state.sessionStarted || state.sessionIds.length === 0) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      sessionIds: state.sessionIds,
      currentIndex: state.currentIndex
    }));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    state.sessionStarted = false;
  }

  function money(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
  }

  function date(value) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(value + "T12:00:00"));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function currentHunt() {
    return state.hunts.find((hunt) => hunt.huntId === state.sessionIds[state.currentIndex]);
  }

  function visibleHunts() {
    let hunts = [...state.hunts];
    const filter = el.statusFilter.value;
    if (filter !== "all") hunts = hunts.filter((hunt) => hunt.applicationStatus === filter);

    const sort = el.sortSelect.value;
    hunts.sort((a, b) => {
      if (sort === "species") return a.speciesGroup.localeCompare(b.speciesGroup) || a.applicant.localeCompare(b.applicant);
      if (sort === "deadline") return a.applicationDeadline.localeCompare(b.applicationDeadline) || a.applicant.localeCompare(b.applicant);
      if (sort === "status") return a.applicationStatus.localeCompare(b.applicationStatus) || a.applicant.localeCompare(b.applicant);
      return a.applicant.localeCompare(b.applicant) || a.speciesGroup.localeCompare(b.speciesGroup);
    });
    return hunts;
  }

  function renderList() {
    const hunts = visibleHunts();
    el.huntRows.innerHTML = hunts.map((hunt) => `
      <tr class="${state.selected.has(hunt.huntId) ? "selected-row" : ""}">
        <td><input class="hunt-check" type="checkbox" data-id="${escapeHtml(hunt.huntId)}" ${state.selected.has(hunt.huntId) ? "checked" : ""}></td>
        <td><strong>${escapeHtml(hunt.applicant)}</strong>${hunt.applicant === "Jeremiah" ? '<span class="youth-chip">Youth</span>' : '<span class="adult-chip">Adult</span>'}</td>
        <td><strong>${escapeHtml(hunt.speciesGroup)}</strong><br><span class="muted">${escapeHtml(hunt.huntCategory)}</span></td>
        <td>${escapeHtml(date(hunt.applicationDeadline))}</td>
        <td>${escapeHtml(money(hunt.applicationFee))}</td>
        <td><span class="status-chip status-${hunt.applicationStatus.toLowerCase().replaceAll(" ", "-")}">${escapeHtml(hunt.applicationStatus)}</span>${hunt.dateApplied ? `<br><span class="muted">${escapeHtml(date(hunt.dateApplied))}</span>` : ""}</td>
      </tr>`).join("");

    document.querySelectorAll(".hunt-check").forEach((box) => box.addEventListener("change", (event) => {
      event.target.checked ? state.selected.add(event.target.dataset.id) : state.selected.delete(event.target.dataset.id);
      renderList();
    }));

    const selected = state.hunts.filter((hunt) => state.selected.has(hunt.huntId));
    el.selectedCount.textContent = `${selected.length} selected`;
    el.selectedCost.textContent = ` · ${money(selected.reduce((sum, hunt) => sum + Number(hunt.applicationFee || 0), 0))} total fees`;
    el.startButton.disabled = selected.length === 0;
    el.selectAll.checked = hunts.length > 0 && hunts.every((hunt) => state.selected.has(hunt.huntId));
    el.selectAll.indeterminate = hunts.some((hunt) => state.selected.has(hunt.huntId)) && !el.selectAll.checked;
  }

  function startSession() {
    state.sessionIds = state.hunts
      .filter((hunt) => state.selected.has(hunt.huntId))
      .map((hunt) => hunt.huntId);
    state.currentIndex = 0;
    state.sessionStarted = true;
    saveSession();
    show("wizard");
    renderWizard();
  }

  function preserveCurrentDraft() {
    const hunt = currentHunt();
    if (!hunt) return;
    hunt.confirmationNumber = el.confirmationInput.value.trim();
    hunt.dateApplied = el.dateAppliedInput.value || hunt.dateApplied || "";
    saveHunts();
  }

  function renderWizard() {
    const hunt = currentHunt();
    if (!hunt) return finishSession();

    const total = state.sessionIds.length;
    el.wizardProgress.textContent = `${state.currentIndex + 1} of ${total}`;
    el.wizardProgressBar.max = total;
    el.wizardProgressBar.value = state.currentIndex + 1;
    el.wizardApplicant.textContent = hunt.applicant === "Jeremiah" ? "Youth · Jeremiah" : "Adult · Casey";
    el.wizardTitle.textContent = hunt.speciesGroup;
    el.wizardSubtitle.textContent = `${hunt.huntArea} · ${hunt.huntCategory}`;
    el.wizardDeadline.textContent = `Due ${date(hunt.applicationDeadline)}`;
    el.detailApplicant.textContent = hunt.applicant;
    el.detailFee.textContent = money(hunt.applicationFee);
    el.detailStatus.textContent = hunt.applicationStatus;
    el.wizardNotes.textContent = hunt.notes;
    el.detailsLink.href = hunt.areaDetailsUrl || hunt.officialDetailsUrl;
    el.applyLink.href = hunt.applyPortalUrl || hunt.officialDetailsUrl;
    el.confirmationInput.value = hunt.confirmationNumber || "";
    el.dateAppliedInput.value = hunt.dateApplied || today();
    el.previousButton.disabled = state.currentIndex === 0;
    saveSession();
  }

  function saveApplied() {
    const hunt = currentHunt();
    hunt.applicationStatus = "Applied";
    hunt.dateApplied = el.dateAppliedInput.value || today();
    hunt.confirmationNumber = el.confirmationInput.value.trim();
    hunt.lastUpdated = new Date().toISOString();
    state.selected.delete(hunt.huntId);
    saveHunts();
    next();
  }

  function skip() {
    const hunt = currentHunt();
    hunt.applicationStatus = "Skipped";
    hunt.dateApplied = "";
    hunt.confirmationNumber = el.confirmationInput.value.trim();
    hunt.lastUpdated = new Date().toISOString();
    saveHunts();
    next();
  }

  function previous() {
    if (state.currentIndex === 0) return;
    preserveCurrentDraft();
    state.currentIndex -= 1;
    saveSession();
    renderWizard();
  }

  function next() {
    state.currentIndex += 1;
    saveSession();
    state.currentIndex >= state.sessionIds.length ? finishSession() : renderWizard();
  }

  function finishSession() {
    show("complete");
    const session = state.sessionIds.map((id) => state.hunts.find((hunt) => hunt.huntId === id)).filter(Boolean);
    const applied = session.filter((hunt) => hunt.applicationStatus === "Applied");
    const skipped = session.filter((hunt) => hunt.applicationStatus === "Skipped");
    el.completeSummary.textContent = `${applied.length} applied${skipped.length ? ` · ${skipped.length} skipped` : ""} · ${session.length} total.`;
    el.completeList.innerHTML = session.map((hunt) => `
      <div>
        <strong>${escapeHtml(hunt.applicant)} — ${escapeHtml(hunt.speciesGroup)}</strong>
        <span>${escapeHtml(hunt.applicationStatus)}${hunt.dateApplied ? ` · ${escapeHtml(date(hunt.dateApplied))}` : ""}${hunt.confirmationNumber ? ` · Confirmation ${escapeHtml(hunt.confirmationNumber)}` : ""}</span>
      </div>`).join("");
    clearSession();
  }

  function show(view) {
    el.selectionView.hidden = view !== "selection";
    el.wizardView.hidden = view !== "wizard";
    el.completeView.hidden = view !== "complete";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadCsv() {
    const rows = [[
      "Hunt ID",
      "Applicant(s)",
      "Hunt Area",
      "Species Group",
      "Hunt Category",
      "Applied",
      "Date Applied",
      "Confirmation Number"
    ]];

    state.hunts
      .filter((hunt) => state.sessionIds.includes(hunt.huntId))
      .forEach((hunt) => rows.push([
        hunt.huntId,
        hunt.applicant,
        hunt.huntArea,
        hunt.speciesGroup,
        hunt.huntCategory,
        hunt.applicationStatus === "Applied" ? "Yes" : "No",
        hunt.dateApplied || "",
        hunt.confirmationNumber || ""
      ]));

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `waymark-crossbar-updates-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  el.sortSelect.addEventListener("change", renderList);
  el.statusFilter.addEventListener("change", renderList);
  el.selectAll.addEventListener("change", () => {
    visibleHunts().forEach((hunt) => el.selectAll.checked ? state.selected.add(hunt.huntId) : state.selected.delete(hunt.huntId));
    renderList();
  });
  el.startButton.addEventListener("click", startSession);
  el.backButton.addEventListener("click", () => {
    preserveCurrentDraft();
    show("selection");
    renderList();
  });
  el.previousButton.addEventListener("click", previous);
  el.appliedButton.addEventListener("click", saveApplied);
  el.skipButton.addEventListener("click", skip);
  el.returnButton.addEventListener("click", () => {
    show("selection");
    renderList();
  });
  el.downloadCsvButton.addEventListener("click", downloadCsv);
  el.resetButton.addEventListener("click", () => {
    if (!confirm("Reset all four Cross Bar records to Not Started?")) return;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    state.hunts = clone(WAYMARK_SAMPLE_HUNTS);
    state.selected = new Set(state.hunts.map((hunt) => hunt.huntId));
    state.sessionIds = [];
    state.currentIndex = 0;
    state.sessionStarted = false;
    show("selection");
    renderList();
  });

  renderList();
  if (loadSession()) {
    show("wizard");
    renderWizard();
  }
})();
