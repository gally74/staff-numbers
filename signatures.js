// Store all safety records in localStorage
const RECORDS_KEY = "staff-safety-records-v1";

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

// Record ID: date + "|" + doc name
function makeRecordId(name, date) {
  return `${date}|${name}`;
}

let records = loadRecords();
let activeRecordId = null;

// ---------- Formatting helpers ----------

// UK-style datetime: dd/mm/yyyy, HH:MM:SS (24h)
function formatUkDateTime(isoString) {
  const dt = new Date(isoString);
  if (isNaN(dt.getTime())) return isoString;

  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
}

// ---------- UI helpers ----------

function setRecordMessage(text, type) {
  const el = document.getElementById("recordMessage");
  el.textContent = text || "";
  el.className = "message";
  if (!text) return;
  if (type === "error") el.classList.add("error");
  if (type === "success") el.classList.add("success");
}

function setSignMessage(text, type) {
  const el = document.getElementById("signMessage");
  el.textContent = text || "";
  el.className = "message";
  if (!text) return;
  if (type === "error") el.classList.add("error");
  if (type === "success") el.classList.add("success");
}

function findDriverByStaffNumber(staffNumber) {
  return BASE_DRIVERS.find((d) => d.staffNumber === staffNumber);
}

// Populate driver dropdown from BASE_DRIVERS (from drivers.js)
// Hides any drivers who have already signed for the ACTIVE record.
function populateDriversSelect(record) {
  const select = document.getElementById("driverPicker");

  // Keep the placeholder, remove others
  while (select.options.length > 1) {
    select.remove(1);
  }

  const signedStaffNumbers = record && record.signatures
    ? record.signatures.map((s) => s.staffNumber)
    : [];

  const sorted = [...BASE_DRIVERS].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );

  sorted.forEach((d) => {
    if (signedStaffNumbers.includes(d.staffNumber)) return; // already signed for this record
    const opt = document.createElement("option");
    opt.value = d.staffNumber; // unique
    opt.textContent = d.name;
    select.appendChild(opt);
  });

  // Reset selection after refresh
  select.value = "";
}

// Fill existing records dropdown
function refreshRecordsSelect() {
  const select = document.getElementById("existingRecords");

  // keep placeholder
  while (select.options.length > 1) {
    select.remove(1);
  }

  const entries = Object.values(records).sort((a, b) => {
    // newest first by date
    if (a.date === b.date) {
      return a.name.localeCompare(b.name);
    }
    return a.date < b.date ? 1 : -1;
  });

  entries.forEach((rec) => {
    const opt = document.createElement("option");
    opt.value = rec.id;
    opt.textContent = `${rec.date} – ${rec.name}`;
    select.appendChild(opt);
  });

  if (activeRecordId && records[activeRecordId]) {
    select.value = activeRecordId;
  } else {
    select.value = "";
  }
}

// Update header + table for active record
function refreshActiveRecordUI() {
  const info = document.getElementById("activeRecordInfo");
  const signingSection = document.getElementById("signingSection");
  const counter = document.getElementById("signCounter");
  const tbody = document.getElementById("signatureTableBody");

  const record = activeRecordId ? records[activeRecordId] : null;

  // Update driver picker based on record (hide already-signed drivers)
  populateDriversSelect(record || null);

  if (!record) {
    info.textContent =
      "No active record yet. Enter a document/PPE name above to start.";
    signingSection.style.display = "none";
    return;
  }

  info.textContent = `Active record: “${record.name}” on ${record.date}`;
  signingSection.style.display = "block";

  // table
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  if (!record.signatures || record.signatures.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "No signatures yet for this record.";
    td.className = "muted";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    const sortedSigs = [...record.signatures].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );

    sortedSigs.forEach((sig) => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.textContent = sig.name;

      const tdStaff = document.createElement("td");
      tdStaff.textContent = sig.staffNumber;

      const tdTime = document.createElement("td");
      tdTime.textContent = formatUkDateTime(sig.timestamp);

      tr.appendChild(tdName);
      tr.appendChild(tdStaff);
      tr.appendChild(tdTime);

      tbody.appendChild(tr);
    });
  }

  const totalDrivers = BASE_DRIVERS.length;
  const signedCount = record.signatures ? record.signatures.length : 0;
  counter.textContent = `${signedCount} of ${totalDrivers} drivers recorded for this document.`;
}

// Create or load a record from inputs
function handleLoadRecord() {
  setRecordMessage("");
  setSignMessage("");

  const nameInput = document.getElementById("docName");
  const dateInput = document.getElementById("docDate");

  const name = nameInput.value.trim();
  let date = dateInput.value;

  if (!name) {
    setRecordMessage("Please enter a document or PPE name.", "error");
    return;
  }

  if (!date) {
    // default to today's date
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    date = `${yyyy}-${mm}-${dd}`;
    dateInput.value = date;
  }

  const id = makeRecordId(name, date);
  let record = records[id];

  if (!record) {
    record = {
      id,
      name,
      date,
      createdAt: new Date().toISOString(),
      signatures: [],
    };
    records[id] = record;
    saveRecords(records);
    setRecordMessage("New record created.", "success");
  } else {
    setRecordMessage("Existing record loaded.", "success");
  }

  activeRecordId = id;
  refreshRecordsSelect();
  refreshActiveRecordUI();
}

// Load record from existing dropdown
function handleSelectExistingRecord() {
  setRecordMessage("");
  setSignMessage("");

  const select = document.getElementById("existingRecords");
  const id = select.value;
  if (!id) return;

  if (!records[id]) {
    setRecordMessage("Record not found.", "error");
    return;
  }

  activeRecordId = id;

  const record = records[id];
  document.getElementById("docName").value = record.name;
  document.getElementById("docDate").value = record.date;

  refreshRecordsSelect();
  refreshActiveRecordUI();
  setRecordMessage("Existing record loaded.", "success");
}

// Mark a driver as signed for current record
function handleMarkReceived() {
  setSignMessage("");

  if (!activeRecordId || !records[activeRecordId]) {
    setSignMessage("Please load or create a record first.", "error");
    return;
  }

  const record = records[activeRecordId];
  const select = document.getElementById("driverPicker");
  const staffNumber = select.value;

  if (!staffNumber) {
    setSignMessage("Please choose a driver.", "error");
    return;
  }

  const driver = findDriverByStaffNumber(staffNumber);
  if (!driver) {
    setSignMessage("Driver not found in base list.", "error");
    return;
  }

  record.signatures = record.signatures || [];

  const existingIndex = record.signatures.findIndex(
    (s) => s.staffNumber === staffNumber
  );

  const nowIso = new Date().toISOString();

  if (existingIndex >= 0) {
    // already signed – update timestamp
    record.signatures[existingIndex].timestamp = nowIso;
    setSignMessage(
      `${driver.name} was already recorded. Time updated to now.`,
      "success"
    );
  } else {
    record.signatures.push({
      staffNumber,
      name: driver.name,
      timestamp: nowIso,
    });
    setSignMessage(`${driver.name} marked as received & signed.`, "success");
  }

  saveRecords(records);
  refreshActiveRecordUI(); // also refreshes picker and hides that driver
}

// Delete the current record completely
function handleDeleteRecord() {
  setRecordMessage("");
  setSignMessage("");

  if (!activeRecordId || !records[activeRecordId]) {
    setRecordMessage("No active record to delete.", "error");
    return;
  }

  const record = records[activeRecordId];

  const ok = window.confirm(
    `Delete record "${record.name}" on ${record.date}?\n\nThis will remove all signatures for this document on this date from this iPhone.`
  );
  if (!ok) return;

  delete records[activeRecordId];
  saveRecords(records);
  activeRecordId = null;

  refreshRecordsSelect();
  refreshActiveRecordUI();

  setRecordMessage("Record deleted. You can create a new one above.", "success");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  // Default date to today
  const dateInput = document.getElementById("docDate");
  if (dateInput && !dateInput.value) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  refreshRecordsSelect();
  refreshActiveRecordUI(); // also populates driver picker

  document
    .getElementById("loadRecordBtn")
    .addEventListener("click", handleLoadRecord);

  document
    .getElementById("existingRecords")
    .addEventListener("change", handleSelectExistingRecord);

  document
    .getElementById("markReceivedBtn")
    .addEventListener("click", handleMarkReceived);

  const deleteBtn = document.getElementById("deleteRecordBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", handleDeleteRecord);
  }
});
