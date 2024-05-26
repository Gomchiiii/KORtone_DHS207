// script.js

// Read color data from Excel file
async function readColorsFromExcel() {
    const response = await fetch("Colors.xlsx");
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const colors = [];
    for (let i = 0; i < 90; i++) {
        const [name, alternativeNames, description, hexCode, rgbCode, pantoneCode, similarColors, usedWith] = rows[i];
        colors.push({
            id: i,
            name: name,
            alternativeNames: alternativeNames ? alternativeNames.split(";") : [],
            description: description,
            hexCode: hexCode,
            rgbCode: rgbCode,
            pantoneCode : pantoneCode,
            similarColors: similarColors ? similarColors.split(";") : [],
            usedWith: usedWith ? usedWith.split(";") : [],
        });
    }

    return colors;
}

// Search functionality
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const colorChooser = document.getElementById("color-chooser");
const searchResults = document.getElementById("search-results");

searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedColor = colorChooser.value;
    const colors = await readColorsFromExcel();

    if (searchTerm) {
        const results = colors.filter((color) =>
            color.name.toLowerCase().includes(searchTerm) ||
            color.alternativeNames.some((name) => name.toLowerCase().includes(searchTerm))
        );
        displaySearchResults(results);
    } else if (selectedColor) {
        const selectedColorRGB = hexToRgb(selectedColor);
        const similarColors = colors.map((color) => ({
            ...color,
            distance: colorDistance(selectedColorRGB, hexToRgb(color.hexCode)),
        }));
        similarColors.sort((a, b) => a.distance - b.distance);
        const topSimilarColors = similarColors.slice(0, 10);
        displaySearchResults(topSimilarColors);
    } else {
        searchResults.innerHTML = "";
    }
});

// ... (existing code)

// Helper functions
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function colorDistance(color1, color2) {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

function displaySearchResults(results) {
    searchResults.innerHTML = "";
    results.forEach((color) => {
        const resultItem = document.createElement("div");
        resultItem.className = "search-result-item";
        resultItem.innerHTML = `
            <div class="search-result-color" style="background-color: ${color.hexCode}"></div>
            <div class="search-result-info">
                <h3>${color.name}</h3>
            </div>
        `;
        resultItem.addEventListener("click", () => showColorDetails(color.id));
        searchResults.appendChild(resultItem);
    });
}


// Color details functionality
async function showColorDetails(colorId) {
    const colors = await readColorsFromExcel();
    const color = colors.find((color) => color.id === colorId);

    // Create a modal element
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${color.name}</h2>
            <div class="color-swatch" style="background-color: ${color.hexCode}"></div>
            <p><strong>Alternative Names:</strong> ${color.alternativeNames.join(", ")}</p>
            <p><strong>Description:</strong> ${color.description}</p>
            <p><strong>HEX Code:</strong> ${color.hexCode}</p>
            <p><strong>RGB Code:</strong> ${color.rgbCode}</p>
            <p><strong>Pantone Code:</strong> ${color.pantoneCode}</p>
            <h3>Similar Colors:</h3>
            <ul>
                ${color.similarColors.map((similarColor) => `<li>${similarColor}</li>`).join("")}
            </ul>
            <h3>Used With:</h3>
            <ul>
                ${color.usedWith.map((usedWithColor) => `<li>${usedWithColor}</li>`).join("")}
            </ul>
            <button class="add-to-palette" data-color="${color.hexCode}">Put this color to color palette generator</button>
        </div>
    `;

    // ... (existing code)

    // Add event listener to close the modal when clicking on the close button or outside the modal content
    const closeModal = () => {
        modal.remove();
    };
    modal.querySelector(".close").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Append the modal to the document body
    document.body.appendChild(modal);
}

// Color graph functionality
async function createColorGraph() {
    const graphContainer = document.getElementById("color-graph");
    const colors = await readColorsFromExcel();

    // Create nodes for each color
    const nodes = colors.map((color) => ({
        id: color.id,
        label: color.name,
        title: color.description,
        color: color.hexCode,
    }));

    // Create edges for similar colors and used with colors
    const edges = [];
    colors.forEach((color) => {
        color.similarColors.forEach((similarColorName) => {
            const similarColor = colors.find((c) => c.name === similarColorName);
            if (similarColor) {
                edges.push({ from: color.id, to: similarColor.id, label: "유사색" });
            }
        });
        color.usedWith.forEach((usedWithColorName) => {
            const usedWithColor = colors.find((c) => c.name === usedWithColorName);
            if (usedWithColor) {
                edges.push({ from: color.id, to: usedWithColor.id, label: "함께 사용" });
            }
        });
    });

    // Create a dataset with nodes and edges
    const data = {
        nodes: nodes,
        edges: edges,
    };

    // Configure the graph options
    const options = {
        nodes: {
            shape: "dot",
            size: 20,
            font: {
                size: 14,
                color: "#ffffff",
            },
            borderWidth: 2,
        },
        edges: {
            width: 2,
            length: 200,
            font: {
                size: 12,
                align: "middle",
            },
            arrows: {
                to: { enabled: false }, // Disable arrows
            },
        },
        layout: {
            hierarchical: false,
        },
        interaction: {
            hover: true,
            navigationButtons: true,
            keyboard: true,
        },
    };

    // Initialize the network
    const network = new vis.Network(graphContainer, data, options);

    // Handle click events on nodes
    network.on("click", (params) => {
        if (params.nodes.length > 0) {
            const colorId = params.nodes[0];
            showColorDetails(colorId);
        }
    });
}

// Color catalog functionality
async function createColorCatalog() {
    const catalogContainer = document.getElementById("color-catalog");
    const colors = await readColorsFromExcel();

    colors.forEach((color) => {
        const colorItem = document.createElement("div");
        colorItem.className = "color-item";
        colorItem.innerHTML = `
            <div class="color-swatch" style="background-color: ${color.hexCode}"></div>
            <h3>${color.name}</h3>
            <p>${color.alternativeNames.join(", ")}</p>
            <p>${color.description}</p>
            <p>HEX: ${color.hexCode}</p>
            <p>RGB: ${color.rgbCode}</p>
            <p>Pantone: ${color.pantoneCode}</p>
        `;
        colorItem.addEventListener("click", () => showColorDetails(color.id));
        catalogContainer.appendChild(colorItem);
    });
}


// Browser notice functionality
function isSamsungBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('samsungbrowser');
}


function showNotice() {
    const notice = document.querySelector('.notice');
    if (isSamsungBrowser()) {
        notice.style.display = 'block';
    } 
}

function hideNotice() {
    const notice = document.querySelector('.notice');
    notice.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', showNotice);
document.querySelector('.close-notice').addEventListener('click', hideNotice);

function createReferencesSection() {
    const referencesContainer = document.getElementById("references-container");
    const references = [
        {
            text: "Kim, J. (2022). Traditional Korean colors: A historical perspective. Journal of Korean Art and Culture, 15(3), 123-145.",
            url: "https://example.com/kim-2022"
        },
        {
            text: "Lee, S., & Park, H. (2021). Color symbolism in Korean traditional art. Korean Journal of Color Research, 8(2), 56-78.",
            // No URL provided for this reference
        },
        {
            text: "Park, M. (2020). The meaning of colors in Korean culture. Seoul: Korean Publishing House.",
            // No URL provided for this reference
        },
        {
            text: "Park, M. (2020). The meaning of colors in Korean culture. Seoul: Korean Pub한국어도되나?체크.//기lishing House.",
            // No URL provided for this reference
        },
        // Add more references as needed
    ];

    references.forEach((reference, index) => {
        const referenceItem = document.createElement("div");
        referenceItem.className = "reference-item";

        if (reference.url) {
            referenceItem.innerHTML = `
                <p>[${index + 1}] <a href="${reference.url}" target="_blank">${reference.text}</a></p>
            `;
        } else {
            referenceItem.innerHTML = `
                <p>[${index + 1}] ${reference.text}</p>
            `;
        }

        referencesContainer.appendChild(referenceItem);
    });
}

// Color palette generator functionality
async function createPaletteGenerator() {
    const paletteColorsContainer = document.getElementById("palette-colors");
    const generatePaletteButton = document.getElementById("generate-palette");
    const paletteResultContainer = document.getElementById("palette-result");

    const colors = await readColorsFromExcel();

    colors.forEach((color) => {
        const paletteColor = document.createElement("div");
        paletteColor.className = "palette-color";
        paletteColor.style.backgroundColor = color.hexCode;
        paletteColor.addEventListener("click", () => {
            paletteColor.classList.toggle("selected");
        });
        paletteColorsContainer.appendChild(paletteColor);
    });

    generatePaletteButton.addEventListener("click", () => {
        const selectedColors = Array.from(document.querySelectorAll(".palette-color.selected"));
        const paletteColors = selectedColors.map((color) => color.style.backgroundColor);

        const existingColors = Array.from(paletteResultContainer.children).map(
            (paletteItem) => paletteItem.style.backgroundColor
        );

        paletteColors.forEach((color) => {
            if (!existingColors.includes(color)) {
                const paletteItem = document.createElement("div");
                paletteItem.className = "palette-item";
                paletteItem.style.backgroundColor = color;
                paletteResultContainer.appendChild(paletteItem);
            }
        });
    });
}
// ... (existing code)

// Handle click event on "Put this color to color palette generator" button
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-to-palette")) {
        const colorHexCode = event.target.getAttribute("data-color");
        addColorToPaletteResult(colorHexCode);
    }
});

function addColorToPaletteResult(colorHexCode) {
    const paletteResultContainer = document.getElementById("palette-result");
    const existingPaletteItems = paletteResultContainer.querySelectorAll(".palette-item");

    const isDuplicate = Array.from(existingPaletteItems).some(
        (paletteItem) => paletteItem.style.backgroundColor === colorHexCode
    );

    if (!isDuplicate) {
        const paletteItem = document.createElement("div");
        paletteItem.className = "palette-item";
        paletteItem.style.backgroundColor = colorHexCode;
        paletteItem.addEventListener("click", () => {
            paletteItem.classList.toggle("selected");
        });
        paletteResultContainer.appendChild(paletteItem);
    }
}

// ... (existing code)

// Initialize the website
async function init() {
    await createColorGraph();
    await createColorCatalog();
    createReferencesSection();
    createPaletteGenerator();
}

init();
