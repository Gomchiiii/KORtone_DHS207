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
        const [name, alternativeNames, description, hexCode, rgbCode, pantoneCode, similarColors, usedWith, englishName] = rows[i];
        colors.push({
            id: i,
            name: name,
            englishName: englishName, // 추가된 부분
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


async function updateColorNames(language) {
    const colors = await readColorsFromExcel();
    const colorNameElements = document.querySelectorAll(".search-result-info h3, .modal h2, .color-item h3");

    colorNameElements.forEach((element) => {
        const colorId = element.parentElement.parentElement.getAttribute("data-color-id");
        const color = colors.find((color) => color.id === Number(colorId));

        if (color) {
            element.textContent = language === "en" ? color.englishName : color.name;
        }
    });
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
        resultItem.setAttribute("data-color-id", color.id);
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
    modal.setAttribute("data-color-id", colorId);
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
            <div class="color-grid">
                ${color.similarColors.map((similarColorName) => {
                    const similarColor = colors.find((c) => c.name === similarColorName);
                    if (similarColor) {
                        return `<div class="color-block" style="background-color: ${similarColor.hexCode};" title="${similarColor.name}"></div>`;
                    }
                    return '';
                }).join("")}
            </div>
            <h3>Used With:</h3>
            <div class="color-grid">
                ${color.usedWith.map((usedWithColorName) => {
                    const usedWithColor = colors.find((c) => c.name === usedWithColorName);
                    if (usedWithColor) {
                        return `<div class="color-block" style="background-color: ${usedWithColor.hexCode};" title="${usedWithColor.name}"></div>`;
                    }
                    return '';
                }).join("")}
            </div>
            <button class="add-to-palette" data-color="${color.hexCode}">Put this color to Palette</button>
            <button class="download-color-chip" data-color="${color.hexCode}" data-name="${color.name}" data-rgb="${color.rgbCode}" data-pantone="${color.pantoneCode}">Download Color Chip</button>
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
// Create edges for similar colors and used with colors
    const edges = [];
    colors.forEach((color) => {
        // color.similarColors.forEach((similarColorName) => {
        //     const similarColor = colors.find((c) => c.name === similarColorName);
        //     if (similarColor && color.name !== similarColor.name) { // 자기 자신인 경우 제외
        //     edges.push({ from: color.id, to: similarColor.id, label: "유사색" });
        //     }
        // });
        color.usedWith.forEach((usedWithColorName) => {
            const usedWithColor = colors.find((c) => c.name === usedWithColorName);
            if (usedWithColor) {
            edges.push({ from: color.id, to: usedWithColor.id, label: "" });
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
            size: 25,
            font: {
                size: 14,
                color: "#ffffff",
            },
            borderWidth: 2,
        },
        edges: {
            width: 1,
            length: 200,
            font: {
                size: 12,
                align: "middle",
            },
            arrows: {
                to: { enabled: false }, // Disable arrows
            },
        },
        // layout: {
        //     hierarchical: false,
        // },
        interaction: {
            hover: true,
            navigationButtons: true,
            keyboard: true,
        },
        // //berneshut
        // physics: {
        //     stabilization: {
        //       enabled: true,
        //       iterations: 1000,
        //       updateInterval: 100,
        //     },
        //     solver: 'barnesHut',
        //     barnesHut: {
        //       gravitationalConstant: -8000,
        //       springConstant: 0.04,
        //       damping: 0.09,
        //     },
        // }, // too heavy 
        layout: {
            hierarchical: {
                enabled: true,
                levelSeparation: 100, // 노드 간 수직 거리 조정
                nodeSpacing: 50, // 노드 간 수평 거리 조정
                treeSpacing: 100,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: true,
                direction: 'LR', // 그래프를 가로 방향으로 설정
                sortMethod: 'directed',
                },
            },
        };

    // Initialize the network
    const network = new vis.Network(graphContainer, data, options);
    //network.cluster(options);

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
        colorItem.setAttribute("data-color-id", color.id);
        colorItem.innerHTML = `
            <div class="color-swatch" style="background-color: ${color.hexCode}"></div>
            <h3>${color.name}</h3>
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
            text: "lee, J. (2012). Traditional Korean colors",
            url: "https://www.iljinsa.com/shop/goods/goods_view.php?goodsno=181"
        },
        {
            text: "Lee, S., & Park, H. (2021). Color symbolism in Korean traditional art. Korean Journal of Color Research, 8(2), 56-78.",
            // No URL provided for this reference
        },
        {
            text: "JiYoung Kim (2013). Standard Color Space for Color Communication of Korean Traditional Costume. 한국디자인포럼,(38), 157-163.",
            // No URL provided for this reference
        },
        {
            text: "Joo Deh-Won (2021). Analysis of Pantone Coated Color Guide for Korean Traditional Standard Colors of National Museum of Modern and Contemporary Art (MMCA). 한국디자인리서치학회, 6(1), 64-75.",
            // No URL provided for this reference
        },
        {
            text: "국립현대미술관. 한국전통표준색명 및 색상. 경기도: 국립현대미술관, 1992.",
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
    const paletteResultContainer = document.getElementById("palette-result");

    const colors = await readColorsFromExcel();

    colors.forEach((color) => {
        const paletteColor = document.createElement("div");
        paletteColor.className = "palette-color";
        paletteColor.style.backgroundColor = color.hexCode;
        paletteColor.addEventListener("click", () => {
            paletteColor.classList.toggle("selected");
            updatePaletteResult();
        });
        paletteColorsContainer.appendChild(paletteColor);
    });

    function updatePaletteResult() {
        const selectedColors = Array.from(document.querySelectorAll(".palette-color.selected"));
        const paletteColors = selectedColors.map((color) => color.style.backgroundColor);

        paletteResultContainer.innerHTML = "";
        paletteColors.forEach((color) => {
            const paletteItem = document.createElement("div");
            paletteItem.className = "palette-item";
            paletteItem.style.backgroundColor = color;
            paletteItem.addEventListener("click", () => {
                paletteItem.remove();
                const correspondingPaletteColor = document.querySelector(`.palette-color[style="background-color: ${color};"]`);
                if (correspondingPaletteColor) {
                    correspondingPaletteColor.classList.remove("selected");
                }
            });
            paletteResultContainer.appendChild(paletteItem);
        });
    }
}

function addColorToPaletteResult(colorHexCode) {
    const paletteColorsContainer = document.getElementById("palette-colors");
    const paletteColors = paletteColorsContainer.querySelectorAll(".palette-color");
    const paletteResultContainer = document.getElementById("palette-result");

    let isColorSelected = false;

    paletteColors.forEach((paletteColor) => {
        if (paletteColor.style.backgroundColor === colorHexCode) {
            paletteColor.classList.add("selected");
            isColorSelected = true;
        }
    });

    if (!isColorSelected) {
        const paletteColor = document.createElement("div");
        paletteColor.className = "palette-color selected";
        paletteColor.style.backgroundColor = colorHexCode;
        paletteColor.addEventListener("click", () => {
            paletteColor.classList.toggle("selected");
            updatePaletteResult();
        });
        paletteColorsContainer.appendChild(paletteColor);
    }

    const existingPaletteItem = Array.from(paletteResultContainer.children).find(
        (item) => item.style.backgroundColor === colorHexCode
    );

    if (!existingPaletteItem) {
        const paletteItem = document.createElement("div");
        paletteItem.className = "palette-item";
        paletteItem.style.backgroundColor = colorHexCode;
        paletteItem.addEventListener("click", () => {
            paletteItem.remove();
            const correspondingPaletteColor = document.querySelector(`.palette-color[style="background-color: ${colorHexCode};"]`);
            if (correspondingPaletteColor) {
                correspondingPaletteColor.classList.remove("selected");
                updatePaletteResult();
            }
        });
        paletteResultContainer.appendChild(paletteItem);
    }
}

async function savePaletteAsImage() {
    const paletteResultContainer = document.getElementById("palette-result");

    if (paletteResultContainer.children.length === 0) {
        alert("컬러 팔레트에 색상을 선택해 주세요.");
        return;
    }

    const siteNameWatermark = "KORtone - https://gomchiiii.github.io/KORtone_DHS207/";

    // 이미지 생성 전 스타일 저장
    const originalPadding = paletteResultContainer.style.padding;
    const originalPosition = paletteResultContainer.style.position;

    // 팔레트 결과 컨테이너 스타일 조정
    paletteResultContainer.style.position = "relative";
    paletteResultContainer.style.padding = "20px";

    // 워터마크 요소 생성
    const watermark = document.createElement("div");
    watermark.style.position = "absolute";
    watermark.style.bottom = "5px";
    watermark.style.right = "5px";
    watermark.style.fontSize = "14px";
    watermark.style.fontWeight = "bold";
    watermark.style.color = "black";
    watermark.textContent = siteNameWatermark;
    paletteResultContainer.appendChild(watermark);

    // 팔레트 결과를 이미지로 변환
    const canvas = await html2canvas(paletteResultContainer, {
        backgroundColor: null,
        scale: 2,
    });

    // 이미지 다운로드
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "color_palette_result.png";
    link.click();

    // 워터마크 요소 제거
    watermark.remove();

    // 이미지 생성 후 스타일 복원
    paletteResultContainer.style.padding = originalPadding;
    paletteResultContainer.style.position = originalPosition;
}

// "이미지로 저장" 버튼 클릭 이벤트 리스너 추가
document.getElementById("save-palette-image").addEventListener("click", savePaletteAsImage);

function sortPaletteResult() {
    const paletteColorsContainer = document.getElementById("palette-colors");
    const paletteColors = Array.from(paletteColorsContainer.querySelectorAll(".palette-color"));
    const paletteResultContainer = document.getElementById("palette-result");
    const paletteItems = Array.from(paletteResultContainer.querySelectorAll(".palette-item"));

    const sortedColors = paletteColors.map((color) => color.style.backgroundColor);
    const sortedPaletteItems = sortedColors.map((color) => {
        return paletteItems.find((item) => item.style.backgroundColor === color);
    }).filter((item) => item !== undefined);

    paletteResultContainer.innerHTML = "";
    sortedPaletteItems.forEach((item) => {
        paletteResultContainer.appendChild(item);
    });
}

// "Sort Palette" 버튼 클릭 이벤트 리스너 추가
// document.getElementById("sort-palette").addEventListener("click", sortPaletteResult);

async function downloadColorChip(event) {
    const button = event.target;
    const colorHex = button.getAttribute("data-color");
    const colorName = button.getAttribute("data-name");
    const colorRGB = button.getAttribute("data-rgb");
    const colorPantone = button.getAttribute("data-pantone");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const chipWidth = 240;
    const chipHeight = 240;
    const textHeight = 150;
    const padding = 10;

    canvas.width = chipWidth;
    canvas.height = chipHeight + textHeight;

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, chipWidth, chipHeight);

    ctx.fillStyle = "white";
    ctx.fillRect(0, chipHeight, chipWidth, textHeight);

    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(colorName, padding, chipHeight + 25);

    ctx.font = "14px Arial";
    ctx.fillText(`RGB: ${colorRGB}`, padding, chipHeight + 40);
    ctx.fillText(`HEX: ${colorHex}`, padding, chipHeight + 55);
    ctx.fillText(`Pantone: ${colorPantone}`, padding, chipHeight + 70);

    const watermarkText = "https://gomchiiii.github.io/KORtone_DHS207/";
    const watermarkMargin = 5;

    ctx.font = "10px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(watermarkText, chipWidth - padding, chipHeight + textHeight - watermarkMargin);


    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${colorName}_color_chip.png`;
    link.click();
}

// "Download Color Chip" 버튼 클릭 이벤트 리스너 등록
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("download-color-chip")) {
        downloadColorChip(event);
    }
});

const languageSelector = document.getElementById("language");

languageSelector.addEventListener("change", async () => {
    const selectedLanguage = languageSelector.value;
    await updateColorNames(selectedLanguage);
});

// Initialize the website
async function init() {
    await createColorGraph();
    await createColorCatalog();
    createReferencesSection();
    createPaletteGenerator();
}

init();
