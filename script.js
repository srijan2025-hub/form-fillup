const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbx6ggfbsrzzg4wv6cI7VyHidLVQOWQ_CnKStUUYJbxmM971A0R65MpfsBtSewZpiH17Xw/exec";
const STORAGE_KEY = "masterFormStudentsDB"; 
let currentProfileName = ""; // Tracks the currently active profile to fix renaming bugs

document.addEventListener("DOMContentLoaded", () => {
    setupEnterKeyNavigation();
    
    const db = getStudentsDB();
    const studentNames = Object.keys(db);
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('name')) {
        // If opening a shared link, load that data
        checkUrlParams();
        updateDropdown(); 
    } else if (studentNames.length > 0) {
        // Automatically load the last viewed student so the page isn't confusingly blank
        const lastStudent = studentNames[studentNames.length - 1];
        updateDropdown(lastStudent);
        switchStudent(); 
    } else {
        // Fresh start for a new user
        updateDropdown();
        clearForm();
    }
});

// Skip to next text box when pressing Enter
function setupEnterKeyNavigation() {
    const inputs = Array.from(document.querySelectorAll('.form-data'));
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                const nextInput = inputs[index + 1];
                if (nextInput && !nextInput.disabled) {
                    nextInput.focus(); 
                } else {
                    input.blur(); 
                }
            }
        });
    });
}

function getStudentsDB() {
    const db = localStorage.getItem(STORAGE_KEY);
    return db ? JSON.parse(db) : {};
}

function updateDropdown(selectedName = "") {
    const db = getStudentsDB();
    const selector = document.getElementById("studentSelector");
    
    selector.innerHTML = '<option value="">-- Add New Student --</option>';
    
    Object.keys(db).forEach(studentName => {
        let option = document.createElement("option");
        option.value = studentName;
        option.textContent = studentName;
        if(studentName === selectedName) option.selected = true;
        selector.appendChild(option);
    });

    toggleDeleteButton(selectedName);
}

function toggleDeleteButton(name) {
    const deleteBtn = document.getElementById('deleteBtn');
    if (name && getStudentsDB()[name]) {
        deleteBtn.style.display = "block";
    } else {
        deleteBtn.style.display = "none";
    }
}

function switchStudent() {
    const selector = document.getElementById("studentSelector");
    const selectedName = selector.value;
    
    if (!selectedName) {
        clearForm(); 
        return;
    }

    const db = getStudentsDB();
    const studentData = db[selectedName];
    
    if (studentData) {
        currentProfileName = selectedName; // Set active tracker
        document.querySelectorAll('.form-data').forEach(input => {
            input.value = studentData[input.id] || "";
        });
        toggleDeleteButton(selectedName);
        lockForm(); 
    }
}

function clearForm() {
    currentProfileName = ""; // Reset tracker for new student
    document.querySelectorAll('.form-data').forEach(input => {
        input.value = "";
    });
    document.getElementById("studentSelector").value = "";
    toggleDeleteButton("");
    enableEdit();
    document.getElementById('name').focus();
}

function deleteProfile() {
    const selector = document.getElementById("studentSelector");
    const selectedName = selector.value;
    
    if (!selectedName) return;

    if (confirm(`⚠️ Are you sure you want to permanently delete the profile for "${selectedName}" from this device?`)) {
        let db = getStudentsDB();
        delete db[selectedName];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        
        clearForm();
        updateDropdown();
        alert(`🗑️ Profile for ${selectedName} deleted successfully.`);
    }
}

async function saveData() {
    const nameInput = document.getElementById('name').value.trim();
    if (!nameInput) {
        alert("⚠️ Please enter a Name! The Name is required to save the profile.");
        document.getElementById('name').focus();
        return;
    }

    const allInputs = document.querySelectorAll('.form-data');
    let payload = { timestamp: new Date().toLocaleString() };

    allInputs.forEach(input => {
        payload[input.id] = input.value;
    });

    let db = getStudentsDB();
    
    // If they renamed an existing profile, delete the old name key so we don't duplicate
    if (currentProfileName && currentProfileName !== nameInput) {
        delete db[currentProfileName];
    }

    db[nameInput] = payload; 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    
    currentProfileName = nameInput; // Update tracker
    updateDropdown(nameInput);

    // Sync to Google
    if(GOOGLE_SHEET_URL !== "YOUR_GOOGLE_WEB_APP_URL_HERE") {
        try {
            document.getElementById('saveBtn').innerText = "⏳ Syncing...";
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert(`✅ ${nameInput}'s data saved locally and synced!`);
        } catch (error) {
            console.error("Sync Error:", error);
            alert(`⚠️ ${nameInput}'s data saved to device, but failed to sync online!`);
        } finally {
            document.getElementById('saveBtn').innerHTML = "💾 Save & Sync";
        }
    } else {
        alert("Data saved locally!");
    }

    lockForm();
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('name')) {
        let hasData = false;
        document.querySelectorAll('.form-data').forEach(input => {
            const val = urlParams.get(input.id);
            if(val) {
                input.value = val;
                hasData = true;
            }
        });
        if(hasData) {
            currentProfileName = ""; // Treat shared data as unsaved
            document.getElementById("studentSelector").value = ""; 
            lockForm();
        }
    }
}

function lockForm() {
    document.querySelectorAll('.form-data').forEach(input => input.disabled = true);
    document.getElementById('saveBtn').style.display = "none";
    document.getElementById('editBtn').style.display = "block";
}

function enableEdit() {
    document.querySelectorAll('.form-data').forEach(input => input.disabled = false);
    document.getElementById('saveBtn').style.display = "block";
    document.getElementById('editBtn').style.display = "none";
}

function copyInput(buttonElement, inputId) {
    const inputElement = document.getElementById(inputId);
    
    if (!inputElement.value) {
        alert("Nothing to copy!");
        return;
    }

    navigator.clipboard.writeText(inputElement.value).then(() => {
        const originalText = buttonElement.innerText;
        buttonElement.innerText = "✅";
        setTimeout(() => {
            buttonElement.innerText = originalText;
        }, 1500);
    }).catch(err => {
        alert("Failed to copy! Your browser might not support this feature.");
        console.error("Copy Error:", err);
    });
}

function shareBlank() {
    const blankUrl = window.location.origin + window.location.pathname;
    navigator.share ? navigator.share({title: 'Form Filler', url: blankUrl}) : alert("Copy link: " + blankUrl);
}

function shareWithInfo() {
    if (confirm("🚨 RED ALERT! 🚨\n\nYou are sharing highly sensitive personal data. Anyone with this link can see your information. Proceed?")) {
        let params = new URLSearchParams();
        
        document.querySelectorAll('.form-data').forEach(input => {
            if(input.value) params.append(input.id, input.value);
        });
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        navigator.share ? navigator.share({title: 'Student Details', url: shareUrl}) : prompt("Copy this link to share:", shareUrl);
    }
}
