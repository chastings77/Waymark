const WAYMARK_CONFIG = Object.freeze({
  sheetName: 'Master Hunt List',
  spreadsheetIdProperty: 'WAYMARK_SPREADSHEET_ID',
  applicants: Object.freeze([
    { name: 'Casey', type: 'Adult', eligibilityHeader: 'Adult' },
    { name: 'Jeremiah', type: 'Youth', eligibilityHeader: 'Youth' }
  ]),
  applicantColumns: Object.freeze({
    Casey: Object.freeze({
      status: 'Casey Application Status',
      date: 'Casey Date Applied',
      confirmation: 'Casey Confirmation #'
    }),
    Jeremiah: Object.freeze({
      status: 'Jeremiah Application Status',
      date: 'Jeremiah Date Applied',
      confirmation: 'Jeremiah Confirmation #'
    })
  })
});

/** Returns all applicant-specific application records for the client. */
function getHunts() {
  const sheet = getMasterSheet_();
  ensureWaymarkColumns_(sheet);

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const headerMap = headerMap_(headers);
  const records = [];

  values.slice(1).forEach((row, index) => {
    const sourceRow = index + 2;
    if (!row.some(Boolean)) return;

    WAYMARK_CONFIG.applicants.forEach(applicant => {
      if (!isYes_(value_(row, headerMap, applicant.eligibilityHeader))) return;
      records.push(rowToHunt_(row, sourceRow, headerMap, applicant));
    });
  });

  return records;
}

/**
 * Saves one applicant's status to the Master Hunt List.
 * payload: { sourceRow, huntId, applicant, status, dateApplied, confirmationNumber }
 */
function saveApplication(payload) {
  validateSavePayload_(payload);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getMasterSheet_();
    ensureWaymarkColumns_(sheet);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const headerMap = headerMap_(headers);
    const rowNumber = Number(payload.sourceRow);

    if (rowNumber < 2 || rowNumber > sheet.getLastRow()) {
      throw new Error('The Master Hunt List row no longer exists. Reload Waymark and try again.');
    }

    const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const applicant = WAYMARK_CONFIG.applicants.find(item => item.name === payload.applicant);
    if (!applicant || !isYes_(value_(row, headerMap, applicant.eligibilityHeader))) {
      throw new Error(`${payload.applicant} is not eligible on Master Hunt List row ${rowNumber}.`);
    }

    const expectedHuntId = buildHuntId_(rowNumber, value_(row, headerMap, 'Hunt Category'), value_(row, headerMap, 'Hunt Area'), payload.applicant);
    if (payload.huntId !== expectedHuntId) {
      throw new Error('The selected hunt no longer matches the spreadsheet row. Reload Waymark and try again.');
    }

    const columns = WAYMARK_CONFIG.applicantColumns[payload.applicant];
    setCellByHeader_(sheet, rowNumber, headerMap, columns.status, normalizeStatus_(payload.status));
    setCellByHeader_(sheet, rowNumber, headerMap, columns.date, payload.status === 'Applied' ? normalizeDate_(payload.dateApplied) : '');
    setCellByHeader_(sheet, rowNumber, headerMap, columns.confirmation, String(payload.confirmationNumber || '').trim());

    synchronizeLegacyColumns_(sheet, rowNumber, headerMap, row);
    SpreadsheetApp.flush();

    const refreshedRow = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const hunt = rowToHunt_(refreshedRow, rowNumber, headerMap, applicant);
    if (hunt.applicationStatus !== normalizeStatus_(payload.status)) {
      throw new Error('Google Sheets did not preserve the requested application status.');
    }
    if (payload.status === 'Applied' && hunt.dateApplied !== normalizeDate_(payload.dateApplied)) {
      throw new Error('Google Sheets did not preserve the requested application date.');
    }
    if (hunt.confirmationNumber !== String(payload.confirmationNumber || '').trim()) {
      throw new Error('Google Sheets did not preserve the confirmation number.');
    }
    return {
      ok: true,
      savedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Chicago', "yyyy-MM-dd'T'HH:mm:ss"),
      hunt: hunt
    };
  } finally {
    lock.releaseLock();
  }
}

/** Adds the six applicant-specific tracking columns if they do not exist. */
function setupWaymarkSheet() {
  const sheet = getMasterSheet_();
  const added = ensureWaymarkColumns_(sheet);
  return { sheetName: sheet.getName(), addedColumns: added };
}

function getMasterSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(WAYMARK_CONFIG.spreadsheetIdProperty);
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('No spreadsheet is connected. Bind this Apps Script project to the hunting spreadsheet or set the WAYMARK_SPREADSHEET_ID script property.');
  }

  const sheet = spreadsheet.getSheetByName(WAYMARK_CONFIG.sheetName);
  if (!sheet) throw new Error(`Sheet "${WAYMARK_CONFIG.sheetName}" was not found.`);
  return sheet;
}

function ensureWaymarkColumns_(sheet) {
  const required = [];
  Object.keys(WAYMARK_CONFIG.applicantColumns).forEach(name => {
    const cols = WAYMARK_CONFIG.applicantColumns[name];
    required.push(cols.status, cols.date, cols.confirmation);
  });

  let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
  const added = [];
  required.forEach(header => {
    if (!headers.includes(header)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
      added.push(header);
    }
  });
  return added;
}

function rowToHunt_(row, sourceRow, headerMap, applicant) {
  const columns = WAYMARK_CONFIG.applicantColumns[applicant.name];
  const legacyApplied = isYes_(value_(row, headerMap, 'Applied'));
  const specificStatus = value_(row, headerMap, columns.status);
  const status = specificStatus || (legacyApplied ? 'Applied' : 'Not Started');
  const dateApplied = value_(row, headerMap, columns.date) || (legacyApplied ? value_(row, headerMap, 'Date Applied') : '');
  const confirmation = value_(row, headerMap, columns.confirmation) || (legacyApplied ? value_(row, headerMap, 'TPWD Confirmation #') : '');
  const category = value_(row, headerMap, 'Hunt Category');
  const area = value_(row, headerMap, 'Hunt Area');

  return {
    huntId: buildHuntId_(sourceRow, category, area, applicant.name),
    sourceRow,
    season: '2026-2027',
    state: 'Texas',
    huntArea: area,
    region: value_(row, headerMap, 'Region'),
    huntCategory: category,
    speciesGroup: value_(row, headerMap, 'Species Group'),
    applicant: applicant.name,
    applicantType: applicant.type,
    priority: value_(row, headerMap, 'Priority') || 'C',
    applicationDeadline: normalizeDateForClient_(value_(row, headerMap, 'Application Deadline')),
    huntWindow: value_(row, headerMap, 'Hunt Window'),
    applicationFee: number_(value_(row, headerMap, 'Application Fee')),
    approxMiles: number_(value_(row, headerMap, 'Approx Miles from Amarillo')),
    driveZone: value_(row, headerMap, 'Drive Zone'),
    applicationStatus: normalizeStatus_(status),
    dateApplied: normalizeDateForClient_(dateApplied),
    confirmationNumber: confirmation,
    officialDetailsUrl: value_(row, headerMap, 'Official Category Link') || value_(row, headerMap, 'Source URL'),
    areaDetailsUrl: value_(row, headerMap, 'TPWD Area / Brochure Search'),
    applyPortalUrl: value_(row, headerMap, 'Official Category Link') || value_(row, headerMap, 'Source URL'),
    notes: value_(row, headerMap, 'Notes'),
    priorityReason: value_(row, headerMap, 'Priority Reason')
  };
}

function synchronizeLegacyColumns_(sheet, rowNumber, headerMap, rowBeforeUpdate) {
  const eligible = WAYMARK_CONFIG.applicants.filter(applicant =>
    isYes_(value_(rowBeforeUpdate, headerMap, applicant.eligibilityHeader))
  );
  const currentRow = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const statuses = eligible.map(applicant => {
    const cols = WAYMARK_CONFIG.applicantColumns[applicant.name];
    return {
      applicant: applicant.name,
      status: normalizeStatus_(value_(currentRow, headerMap, cols.status)),
      date: value_(currentRow, headerMap, cols.date),
      confirmation: value_(currentRow, headerMap, cols.confirmation)
    };
  });

  const allApplied = statuses.length > 0 && statuses.every(item => item.status === 'Applied');
  setCellByHeader_(sheet, rowNumber, headerMap, 'Applied', allApplied ? 'Yes' : '');
  setCellByHeader_(sheet, rowNumber, headerMap, 'Date Applied', allApplied ? latestDate_(statuses.map(item => item.date)) : '');
  setCellByHeader_(sheet, rowNumber, headerMap, 'TPWD Confirmation #', allApplied
    ? statuses.filter(item => item.confirmation).map(item => `${item.applicant}: ${item.confirmation}`).join(' | ')
    : '');
}

function validateSavePayload_(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Missing application data.');
  if (!payload.huntId) throw new Error('Missing Hunt ID.');
  if (!payload.sourceRow) throw new Error('Missing Master Hunt List row.');
  if (!WAYMARK_CONFIG.applicants.some(item => item.name === payload.applicant)) throw new Error('Unknown applicant.');
  normalizeStatus_(payload.status);
  if (payload.status === 'Applied') normalizeDate_(payload.dateApplied);
}

function normalizeStatus_(status) {
  const normalized = String(status || 'Not Started').trim();
  if (!['Not Started', 'Applied', 'Skipped'].includes(normalized)) {
    throw new Error(`Unsupported application status: ${normalized}`);
  }
  return normalized;
}

function normalizeDate_(dateValue) {
  const value = normalizeDateForClient_(dateValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Application date must be YYYY-MM-DD.');
  return value;
}

function normalizeDateForClient_(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return Utilities.formatDate(parsed, Session.getScriptTimeZone() || 'America/Chicago', 'yyyy-MM-dd');
}

function latestDate_(dates) {
  return dates.filter(Boolean).sort().pop() || '';
}

function buildHuntId_(rowNumber, category, area, applicant) {
  return `V5-R${rowNumber}-${categoryCode_(category)}-${slug_(area)}-${slug_(applicant)}`;
}

function categoryCode_(category) {
  const words = String(category || '').match(/[A-Za-z0-9]+/g) || [];
  return words.slice(0, 4).map(word => word[0].toUpperCase()).join('') || 'HUNT';
}

function slug_(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function headerMap_(headers) {
  return headers.reduce((map, header, index) => {
    map[String(header).trim()] = index;
    return map;
  }, {});
}

function value_(row, headerMap, header) {
  const index = headerMap[header];
  return index === undefined ? '' : row[index];
}

function setCellByHeader_(sheet, rowNumber, headerMap, header, value) {
  const index = headerMap[header];
  if (index === undefined) throw new Error(`Required column "${header}" was not found.`);
  sheet.getRange(rowNumber, index + 1).setValue(value);
}

function isYes_(value) {
  return String(value || '').trim().toLowerCase() === 'yes';
}

function number_(value) {
  const parsed = Number(String(value || '').replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
