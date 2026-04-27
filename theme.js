document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("masterFormTheme") || "theme-default";
    document.body.className = savedTheme;
    
    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
});

function changeTheme() {
    const themeSelect = document.getElementById("themeSelect");
    const selectedTheme = themeSelect.value;
    
    document.body.className = selectedTheme;
    localStorage.setItem("masterFormTheme", selectedTheme);
}
