// Key for storing extra drivers in localStorage
const EXTRA_DRIVERS_KEY = "driver-staff-lookup-extra-drivers";

// Load extra drivers saved locally on the device
function loadExtraDrivers() {
  try {
    const json = localStorage.getItem(EXTRA_DRIVERS_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// Save extra drivers to localStorage
function saveExtraDrivers(drivers) {
  try {
    localStorage.setItem(EXTRA_DRIVERS_KEY, JSON.stringify(drivers));
  } catch {
    // ignore storage errors
  }
}

// Build the list used by the UI (base + extras, de-duplicated by name)
function combineDrivers() {
  const extras = loadExtraDrivers();
  const map = new Map();

  // Base drivers first
  BASE_DRIVERS.forEach(d => {
    map.set(d.name.toLowerCase(), { ...d });
  });

  // Extras override if same name added on device
  extras.forEach(d => {
    map.set(d.name.toLowerCase(), { ...d });
  });

  // Convert back to array and sort alphabetically
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );
}

// Populate the select element
function populateSelect(drivers) {
  const select = document.getElementById("driverPicker");

  // Clear all except the first placeholder option
  while (select.options.length > 1) {
    select.remove(1);
  }

  drivers.forEach(driver => {
    const option = document.createElement("option");
    option.value = driver.name;
    option.textContent = driver.name;
    select.appendChild(option);
  });
}

// Show staff number when driver is selected
function setupPicker(drivers) {
  const select = document.getElementById("driverPicker");
  const display = document.getElementById("staffNumberDisplay");

  select.addEventListener("change", () => {
    const name = select.value;
    if (!name) {
      display.textContent = "Staff number will appear here";
      display.classList.add("muted");
      return;
    }

    const driver = drivers.find(d => d.name === name);
    if (driver) {
      display.textContent = driver.staffNumber;
      display.classList.remove("muted");
    } else {
      display.textContent = "Not found";
      display.classList.add("muted");
    }
  });
}

// Show messages for add-driver form
function setMessage(text, type) {
  const container = document.getElementById("message");
  container.textContent = text || "";
  container.className = "";
  if (!text) return;
  if (type === "error") container.classList.add("error");
  if (type === "success") container.classList.add("success");
}

// Setup the "Add driver" form (local to device)
function setupAddForm() {
  const nameInput = document.getElementById("newName");
  const numberInput = document.getElementById("newNumber");
  const button = document.getElementById("addDriverButton");

  button.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const staffNumber = numberInput.value.trim();

    if (!name || !staffNumber) {
      setMessage("Please enter both a name and staff number.", "error");
      return;
    }

    // Check if already exists in base or extras
    const allDrivers = combineDrivers();
    const exists = allDrivers.some(
      d => d.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setMessage("That name already exists in the list.", "error");
      return;
    }

    const extras = loadExtraDrivers();
    extras.push({ name, staffNumber });
    saveExtraDrivers(extras);

    // Refresh dropdown with the new combined list
    const updatedDrivers = combineDrivers();
    populateSelect(updatedDrivers);

    // Clear inputs
    nameInput.value = "";
    numberInput.value = "";

    setMessage("Driver added on this device.", "success");
  });
}

// Init everything when page is ready
document.addEventListener("DOMContentLoaded", () => {
  const drivers = combineDrivers();
  populateSelect(drivers);
  setupPicker(drivers);
  setupAddForm();
});
