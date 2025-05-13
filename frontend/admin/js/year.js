// Get the current year
const currentYear = new Date().getFullYear();

// Get the element where the year will be displayed
const yearElement = document.getElementById("copyright-year");

// Insert the year into the HTML
if (yearElement) {
    yearElement.textContent = currentYear;
}