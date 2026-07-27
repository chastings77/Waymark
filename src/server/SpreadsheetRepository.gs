const WAYMARK_CONFIG = Object.freeze({
  sheetName: 'Master Hunt List',
  auditSheetName: 'Waymark Application Log',
  spreadsheetIdProperty: 'WAYMARK_SPREADSHEET_ID',
  season: '2026-2027',
  baseColumns: Object.freeze({
    huntId: 'Hunt ID',
    lastUpdated: 'Waymark Last Updated',
    updatedBy: 'Waymark Updated By'
  }),
  applicants: Object.freeze([
    { name: 'Casey', type: 'Adult', eligibilityHeader: 'Adult' },
    { name: 'Jeremiah', type: 'Youth', eligibilityHeader: 'Youth' }
  ]),
  applicantColumns: Object.freeze({
    Casey: Object.freeze({ status: 'Casey Application Status', date: 'Casey Date Applied', confirmation: 'Casey Confirmation #' }),
    Jeremiah: Object.freeze({ status: 'Jeremiah Application Status', date: 'Jeremiah Date Applied', confirmation: 'Jeremiah Confirmation #' })
  })
});

/** Returns applicant-specific application records for the client. */
function getHunts() {
  const sheet = getMasterSheet_();
  ensureWaymarkInfrastructure_(sheet);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headerMap = headerMap_(values[0]);
  validateDataIntegrity_(values, headerMap);
  const records = [];
  values.slice(1).forEach((row, index) => {
    if (!row.some(Boolean)) return;
    const sourceRow = index + 2;
    WAYMARK_CONFIG.applicants.forEach(applicant => {
      if (isYes_(value_(row, headerMap, applicant.eligibilityHeader))) {
        records.push(rowToHunt_(row, sourceRow, headerMap, applicant));
      }
    });
  });
  return records;
}

/**
 * Saves one applicant's status. Identity is payload.huntId; sourceRow is ignored.
 * payload: { huntId, applicant, status, dateApplied, confirmationNumber }
 */
function saveApplication(payload) {
  validateSavePayload_(payload);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getMasterSheet_();
    ensureWaymarkInfrastructure_(sheet);
    const values = sheet.getDataRange().getDisplayValues();
    const headerMap = headerMap_(values[0]);
    validateDataIntegrity_(values, headerMap);

    const applicant = applicantByName_(payload.applicant);
    const baseHuntId = baseHuntIdFromRecordId_(payload.huntId, applicant.name);
    const rowNumber = findRowByBaseHuntId_(values, headerMap, baseHuntId);
    const row = values[rowNumber - 1];

    if (!isYes_(value_(row, headerMap, applicant.eligibilityHeader))) {
      throw new Error(`${applicant.name} is not eligible for Hunt ID ${baseHuntId}.`);
    }

    const expectedRecordId = recordHuntId_(baseHuntId, applicant.name);
    if (payload.huntId !== expectedRecordId) {
      throw new Error('The selected Hunt ID does not match the applicant. Reload Waymark and try again.');
    }

    const columns = WAYMARK_CONFIG.applicantColumns[applicant.name];
    const oldStatus = normalizeStatus_(value_(row, headerMap, columns.status));
    const newStatus = normalizeStatus_(payload.status);
    const dateApplied = newStatus === 'Applied' ? normalizeDate_(payload.dateApplied) : '';
    const confirmation = String(payload.confirmationNumber || '').trim();
    const updatedAt = new Date();
    const updatedBy = currentUser_();

    setCellByHeader_(sheet, rowNumber, headerMap, columns.status, newStatus);
    setCellByHeader_(sheet, rowNumber, headerMap, columns.date, dateApplied);
    setCellByHeader_(sheet, rowNumber, headerMap, columns.confirmation, confirmation);
    setCellByHeader_(sheet, rowNumber, headerMap, WAYMARK_CONFIG.baseColumns.lastUpdated, updatedAt);
    setCellByHeader_(sheet, rowNumber, headerMap, WAYMARK_CONFIG.baseColumns.updatedBy, updatedBy);

    synchronizeLegacyColumns_(sheet, rowNumber, headerMap, row);
    appendAuditEvent_({
      huntId: baseHuntId,
      applicant: applicant.name,
      oldStatus,
      newStatus,
      confirmationNumber: confirmation,
      updatedBy,
      notes: oldStatus === newStatus ? 'Application record updated' : 'Application status changed'
    });
    SpreadsheetApp.flush();

    const refreshedRow = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const hunt = rowToHunt_(refreshedRow, rowNumber, headerMap, applicant);
    verifySavedHunt_(hunt, newStatus, dateApplied, confirmation);

    return {
      ok: true,
      savedAt: Utilities.formatDate(updatedAt, timezone_(), "yyyy-MM-dd'T'HH:mm:ss"),
      hunt
    };
  } finally {
    lock.releaseLock();
  }
}

/** One-time/repeatable setup and migration utility. */
function setupWaymarkSheet() {
  const sheet = getMasterSheet_();
  const addedColumns = ensureWaymarkColumns_(sheet);
  const migration = migrateStableHuntIds_(sheet);
  const audit = ensureAuditSheet_();
  return {
    sheetName: sheet.getName(),
    addedColumns,
    assignedHuntIds: migration.assigned,
    existingHuntIds: migration.existing,
    auditSheetName: audit.getName()
  };
}

/** Reports duplicates/missing IDs without changing application data. */
function validateWaymarkData() {
  const sheet = getMasterSheet_();
  ensureWaymarkInfrastructure_(sheet);
  const values = sheet.getDataRange().getDisplayValues();
  validateDataIntegrity_(values, headerMap_(values[0]));
  return { ok: true, rowsChecked: Math.max(values.length - 1, 0), message: 'Waymark data integrity checks passed.' };
}

function ensureWaymarkInfrastructure_(sheet) {
  ensureWaymarkColumns_(sheet);
  migrateStableHuntIds_(sheet);
  ensureAuditSheet_();
}

function getMasterSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(WAYMARK_CONFIG.spreadsheetIdProperty);
  const spreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('No spreadsheet is connected. Bind this Apps Script project or set WAYMARK_SPREADSHEET_ID.');
  const sheet = spreadsheet.getSheetByName(WAYMARK_CONFIG.sheetName);
  if (!sheet) throw new Error(`Sheet "${WAYMARK_CONFIG.sheetName}" was not found.`);
  return sheet;
}

function ensureWaymarkColumns_(sheet) {
  const required = [
    WAYMARK_CONFIG.baseColumns.huntId,
    WAYMARK_CONFIG.baseColumns.lastUpdated,
    WAYMARK_CONFIG.baseColumns.updatedBy
  ];
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

function migrateStableHuntIds_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { assigned: 0, existing: 0 };
  const headerMap = headerMap_(values[0]);
  const huntIdColumn = headerMap[WAYMARK_CONFIG.baseColumns.huntId] + 1;
  const seen = {};
  let assigned = 0;
  let existing = 0;

  values.slice(1).forEach((row, index) => {
    if (!row.some(Boolean)) return;
    const rowNumber = index + 2;
    let huntId = String(value_(row, headerMap, WAYMARK_CONFIG.baseColumns.huntId) || '').trim();
    if (!huntId) {
      huntId = generateStableHuntId_(row, headerMap, rowNumber, seen);
      sheet.getRange(rowNumber, huntIdColumn).setValue(huntId);
      assigned += 1;
    } else {
      existing += 1;
    }
    if (seen[huntId]) throw new Error(`Duplicate Hunt ID "${huntId}" found on rows ${seen[huntId]} and ${rowNumber}.`);
    seen[huntId] = rowNumber;
  });
  if (assigned) SpreadsheetApp.flush();
  return { assigned, existing };
}

function generateStableHuntId_(row, headerMap, rowNumber, seen) {
  const category = categoryCode_(value_(row, headerMap, 'Hunt Category'));
  const area = slug_(value_(row, headerMap, 'Hunt Area')) || `ROW-${rowNumber}`;
  const base = `TX-${WAYMARK_CONFIG.season.slice(0, 4)}-${category}-${area}`;
  let candidate = base;
  let suffix = 2;
  while (seen[candidate]) candidate = `${base}-${suffix++}`;
  return candidate;
}

function validateDataIntegrity_(values, headerMap) {
  const requiredHeaders = [WAYMARK_CONFIG.baseColumns.huntId, 'Hunt Area', 'Hunt Category', 'Adult', 'Youth'];
  requiredHeaders.forEach(header => {
    if (headerMap[header] === undefined) throw new Error(`Required column "${header}" was not found.`);
  });
  const ids = {};
  values.slice(1).forEach((row, index) => {
    if (!row.some(Boolean)) return;
    const rowNumber = index + 2;
    const id = String(value_(row, headerMap, WAYMARK_CONFIG.baseColumns.huntId) || '').trim();
    if (!id) throw new Error(`Missing Hunt ID on row ${rowNumber}. Run setupWaymarkSheet().`);
    if (ids[id]) throw new Error(`Duplicate Hunt ID "${id}" found on rows ${ids[id]} and ${rowNumber}.`);
    ids[id] = rowNumber;
  });
}

function findRowByBaseHuntId_(values, headerMap, baseHuntId) {
  const matches = [];
  values.slice(1).forEach((row, index) => {
    if (String(value_(row, headerMap, WAYMARK_CONFIG.baseColumns.huntId)).trim() === baseHuntId) matches.push(index + 2);
  });
  if (!matches.length) throw new Error(`Hunt ID ${baseHuntId} was not found. Reload Waymark and try again.`);
  if (matches.length > 1) throw new Error(`Hunt ID ${baseHuntId} is duplicated in the spreadsheet.`);
  return matches[0];
}

function rowToHunt_(row, sourceRow, headerMap, applicant) {
  const columns = WAYMARK_CONFIG.applicantColumns[applicant.name];
  const legacyApplied = isYes_(value_(row, headerMap, 'Applied'));
  const specificStatus = value_(row, headerMap, columns.status);
  const status = specificStatus || (legacyApplied ? 'Applied' : 'Not Started');
  const dateApplied = value_(row, headerMap, columns.date) || (legacyApplied ? value_(row, headerMap, 'Date Applied') : '');
  const confirmation = value_(row, headerMap, columns.confirmation) || (legacyApplied ? value_(row, headerMap, 'TPWD Confirmation #') : '');
  const baseHuntId = value_(row, headerMap, WAYMARK_CONFIG.baseColumns.huntId);
  const spreadsheetFee = number_(value_(row, headerMap, 'Application Fee'));

  return {
    huntId: recordHuntId_(baseHuntId, applicant.name),
    baseHuntId,
    sourceRow,
    season: WAYMARK_CONFIG.season,
    state: 'Texas',
    huntArea: value_(row, headerMap, 'Hunt Area'),
    region: value_(row, headerMap, 'Region'),
    huntCategory: value_(row, headerMap, 'Hunt Category'),
    speciesGroup: value_(row, headerMap, 'Species Group'),
    applicant: applicant.name,
    applicantType: applicant.type,
    priority: value_(row, headerMap, 'Priority') || 'C',
    applicationDeadline: normalizeDateForClient_(value_(row, headerMap, 'Application Deadline')),
    huntWindow: value_(row, headerMap, 'Hunt Window'),
    applicationFee: effectiveApplicationFee_(spreadsheetFee, applicant),
    spreadsheetApplicationFee: spreadsheetFee,
    feeRuleApplied: applicant.type === 'Youth' && spreadsheetFee !== 0,
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

function effectiveApplicationFee_(spreadsheetFee, applicant) {
  return applicant.type === 'Youth' ? 0 : spreadsheetFee;
}

function ensureAuditSheet_() {
  const spreadsheet = getMasterSheet_().getParent();
  let sheet = spreadsheet.getSheetByName(WAYMARK_CONFIG.auditSheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(WAYMARK_CONFIG.auditSheetName);
  const headers = ['Event ID', 'Timestamp', 'Hunt ID', 'Applicant', 'Old Status', 'New Status', 'Confirmation Number', 'Updated By', 'Notes'];
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function appendAuditEvent_(event) {
  ensureAuditSheet_().appendRow([
    Utilities.getUuid(), new Date(), event.huntId, event.applicant, event.oldStatus, event.newStatus,
    event.confirmationNumber || '', event.updatedBy || '', event.notes || ''
  ]);
}

function synchronizeLegacyColumns_(sheet, rowNumber, headerMap, rowBeforeUpdate) {
  const eligible = WAYMARK_CONFIG.applicants.filter(applicant => isYes_(value_(rowBeforeUpdate, headerMap, applicant.eligibilityHeader)));
  const currentRow = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const statuses = eligible.map(applicant => {
    const cols = WAYMARK_CONFIG.applicantColumns[applicant.name];
    return { applicant: applicant.name, status: normalizeStatus_(value_(currentRow, headerMap, cols.status)), date: value_(currentRow, headerMap, cols.date), confirmation: value_(currentRow, headerMap, cols.confirmation) };
  });
  const allApplied = statuses.length > 0 && statuses.every(item => item.status === 'Applied');
  setCellByHeader_(sheet, rowNumber, headerMap, 'Applied', allApplied ? 'Yes' : '');
  setCellByHeader_(sheet, rowNumber, headerMap, 'Date Applied', allApplied ? latestDate_(statuses.map(item => item.date)) : '');
  setCellByHeader_(sheet, rowNumber, headerMap, 'TPWD Confirmation #', allApplied ? statuses.filter(item => item.confirmation).map(item => `${item.applicant}: ${item.confirmation}`).join(' | ') : '');
}

function verifySavedHunt_(hunt, status, dateApplied, confirmation) {
  if (hunt.applicationStatus !== status) throw new Error('Google Sheets did not preserve the requested application status.');
  if (status === 'Applied' && hunt.dateApplied !== dateApplied) throw new Error('Google Sheets did not preserve the requested application date.');
  if (hunt.confirmationNumber !== confirmation) throw new Error('Google Sheets did not preserve the confirmation number.');
}

function validateSavePayload_(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Missing application data.');
  if (!payload.huntId) throw new Error('Missing Hunt ID.');
  applicantByName_(payload.applicant);
  normalizeStatus_(payload.status);
  if (payload.status === 'Applied') normalizeDate_(payload.dateApplied);
}

function applicantByName_(name) {
  const applicant = WAYMARK_CONFIG.applicants.find(item => item.name === name);
  if (!applicant) throw new Error('Unknown applicant.');
  return applicant;
}

function recordHuntId_(baseHuntId, applicantName) { return `${baseHuntId}::${slug_(applicantName)}`; }
function baseHuntIdFromRecordId_(recordId, applicantName) {
  const suffix = `::${slug_(applicantName)}`;
  const text = String(recordId || '');
  if (!text.endsWith(suffix)) throw new Error('Hunt ID and applicant do not match.');
  return text.slice(0, -suffix.length);
}
function currentUser_() { return Session.getActiveUser().getEmail() || 'Waymark user'; }
function timezone_() { return Session.getScriptTimeZone() || 'America/Chicago'; }
function normalizeStatus_(status) {
  const normalized = String(status || 'Not Started').trim();
  if (!['Not Started', 'Applied', 'Skipped'].includes(normalized)) throw new Error(`Unsupported application status: ${normalized}`);
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
  return Utilities.formatDate(parsed, timezone_(), 'yyyy-MM-dd');
}
function latestDate_(dates) { return dates.filter(Boolean).sort().pop() || ''; }
function categoryCode_(category) {
  const words = String(category || '').match(/[A-Za-z0-9]+/g) || [];
  return words.slice(0, 4).map(word => word[0].toUpperCase()).join('') || 'HUNT';
}
function slug_(value) { return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function headerMap_(headers) { return headers.reduce((map, header, index) => { map[String(header).trim()] = index; return map; }, {}); }
function value_(row, headerMap, header) { const index = headerMap[header]; return index === undefined ? '' : row[index]; }
function setCellByHeader_(sheet, rowNumber, headerMap, header, value) {
  const index = headerMap[header];
  if (index === undefined) throw new Error(`Required column "${header}" was not found.`);
  sheet.getRange(rowNumber, index + 1).setValue(value);
}
function isYes_(value) { return String(value || '').trim().toLowerCase() === 'yes'; }
function number_(value) { const parsed = Number(String(value || '').replace(/[$,]/g, '')); return Number.isFinite(parsed) ? parsed : 0; }
