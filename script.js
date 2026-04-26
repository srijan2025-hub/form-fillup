const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbx6ggfbsrzzg4wv6cI7VyHidLVQOWQ_CnKStUUYJbxmM971A0R65MpfsBtSewZpiH17Xw/exec";

document.addEventListener("DOMContentLoaded", loadData);

function loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const allInputs = document.querySelectorAll('.form-data');
    let hasData = false;

    allInputs.forEach(input => {
        const id = input.id;
        const savedValue = urlParams.get(id) || localStorage.getItem(id) || "";
        input.value = savedValue;
        if(savedValue) hasData = true;
    });

    if(hasData) lockForm();
}

// NEW: Async added to handle the network request properly
async function saveData() {
    const allInputs = document.querySelectorAll('.form-data');
    let payload = { timestamp: new Date().toLocaleString() };

    // Save to local device first
    allInputs.forEach(input => {
        const val = input.value;
        payload[input.id] = val;
        localStorage.setItem(input.id, val);
    });

    if(GOOGLE_SHEET_URL !== "YOUR_GOOGLE_WEB_APP_URL_HERE") {
        try {
            // Await the fetch. This catches network errors (like no Wi-Fi)
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert("Data saved successfully to your device and synced!");
        } catch (error) {
            // This runs if the internet disconnects or the fetch fails entirely
            console.error("Sync Error:", error);
            alert("⚠️ Data saved to your device, but failed to sync online! Please check your internet connection.");
        }
    } else {
        alert("Data saved locally!");
    }

    lockForm();
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

// NEW: Copy to Clipboard function
function copyInput(buttonElement, inputId) {
    const inputElement = document.getElementById(inputId);
    
    if (!inputElement.value) {
        alert("Nothing to copy!");
        return;
    }

    navigator.clipboard.writeText(inputElement.value).then(() => {
        // Change icon to checkmark for 1.5 seconds
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
        navigator.share ? navigator.share({title: 'My Details', url: shareUrl}) : prompt("Copy this link to share:", shareUrl);
    }
}
