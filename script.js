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
        const [name, alternativeNames, description, hexCode, rgbCode, similarColors, usedWith] = rows[i];
        colors.push({
            id: i,
            name: name,
            alternativeNames: alternativeNames ? alternativeNames.split(";") : [],
            description: description,
            hexCode: hexCode,
            rgbCode: rgbCode,
            similarColors: similarColors ? similarColors.split(";") : [],
            usedWith: usedWith ? usedWith.split(";") : [],
        });
    }

    return colors;
}

// Search functionality
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchTerm = searchInput.value.trim().toLowerCase();
    const colors = await readColorsFromExcel();
    const results = colors.filter((color) =>
        color.name.toLowerCase().includes(searchTerm) ||
        color.alternativeNames.some((name) => name.toLowerCase().includes(searchTerm))
    );
    displaySearchResults(results);
});

function displaySearchResults(results) {
    searchResults.innerHTML = "";
    results.forEach((color) => {
        const resultItem = document.createElement("div");
        resultItem.innerHTML = `
            <h3>${color.name}</h3>
            <button onclick="showColorDetails(${color.id})">상세보기</button>
        `;
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
            <h3>Similar Colors:</h3>
            <ul>
                ${color.similarColors.map((similarColor) => `<li>${similarColor}</li>`).join("")}
            </ul>
            <h3>Used With:</h3>
            <ul>
                ${color.usedWith.map((usedWithColor) => `<li>${usedWithColor}</li>`).join("")}
            </ul>
        </div>
    `;

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

function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function showNotice() {
    const notice = document.querySelector('.notice');
    if (isSamsungBrowser() && isDarkMode()) {
        notice.style.display = 'block';
    } 
}

function hideNotice() {
    const notice = document.querySelector('.notice');
    notice.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', showNotice);
document.querySelector('.close-notice').addEventListener('click', hideNotice);

// Initialize the website
async function init() {
    await createColorGraph();
    await createColorCatalog();
}

init();
