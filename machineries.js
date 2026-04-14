/**
 * Machineries Logic
 * Handles dynamic fetching and filtering for Processing & Packaging Machineries
 */

const MACHINE_CONFIG = {
    apiKey: 'patzUZXi4xbEcJBtZ.b612407e01e31156ccba38758a352318eae8a69ad628fa26230186c4b30b36a7',
    baseId: 'appkw4hlOEoVJZ7cn',
    tableName: 'machineries',
    categoryTable: 'machine_category',
    whatsappNumber: '919104183331'
};

// Global State
let currentMainCategoryId = 1; // Default to Processing (as per previous request, but mapping 2 to Processing)
let currentSubCategoryId = 'All';
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

const MAIN_CAT_MAP = {
    1: 'Processing Machineries',
    2: 'Packaging Machineries'
};

/**
 * Helper to get image URL from Airtable (String or Attachment Array)
 */
function getProductImage(record) {
    const name = record.product_name || record.Name || record.name || record.Title || 'Unnamed Machine';
    const displayId = record.product_id || record.id;
    const slug = slugify(name);

    const fieldData = record.image || record.Image || record.ImageURL || record.imageurl;
    if (fieldData && ((Array.isArray(fieldData) && fieldData.length > 0) || (typeof fieldData === 'string' && fieldData.length > 5))) {
        return `assets/machines/${slug}_${displayId}_0.png`;
    }
    return 'assets/placeholder-machine.jpg';
}

/**
 * Fetch Sub-Categories for a specific Main Category ID
 */
async function fetchSubCategories(mainCatId) {
    if (!window.MACHINE_CATEGORY_DATA) return [];

    return window.MACHINE_CATEGORY_DATA
        .filter(c => c.fields && c.fields.main_category == mainCatId)
        .map(c => ({
            id: c.fields.id || c.id,
            name: c.fields.Name || c.fields.name || c.fields.naem || 'Unnamed'
        }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/**
 * Fetch Machineries with Filter IDs
 */
async function fetchMachineries(mainCatId, subCategoryId) {
    if (!window.MACHINE_CATALOG_DATA) return [];

    let filtered = window.MACHINE_CATALOG_DATA.filter(m => {
        if (!m.category || m.category != mainCatId) return false;
        if (subCategoryId && subCategoryId !== 'All') {
            const isNumeric = !isNaN(subCategoryId);
            if (isNumeric) {
                if (m.sub_category != subCategoryId) return false;
            } else {
                if (String(m.sub_category) !== String(subCategoryId)) return false;
            }
        }
        return true;
    });

    return filtered.sort((a, b) => {
        const nameA = a.name || a.product_name || a.Name || '';
        const nameB = b.name || b.product_name || b.Name || '';
        return String(nameA).localeCompare(String(nameB));
    });
}

/**
 * Render Sub-Category Dropdown Options
 */
function renderSubCategoryOptions(categories) {
    const select = document.getElementById('sub-category-select-v3');
    if (!select) return;

    let html = '<option value="All">All Categories</option>';
    html += categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    select.innerHTML = html;
    select.value = currentSubCategoryId;
}

/**
 * Render Machinery Cards to Grid
 */
/**
 * Render Machinery Cards to Grid
 */
function slugify(text) {
    if (!text) return 'unnamed_machine';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '_')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function renderMachineries(machines) {
    const grid = document.getElementById('dynamic-machine-grid');
    const resultsCountDisplay = document.getElementById('machine-results-count');
    const loader = document.getElementById('machine-loader');

    if (loader) loader.style.display = 'none';

    if (resultsCountDisplay) {
        resultsCountDisplay.textContent = `${machines.length} Products`;
    }

    if (machines.length === 0) {
        grid.innerHTML = `
            <div class="text-center w-100 py-5" style="grid-column: 1 / -1;">
                <div class="empty-state-container p-5 rounded-4" style="background: #f8fafc; border: 2px dashed #e2e8f0;">
                    <i class="fa-solid fa-box-open fa-4x mb-4" style="color: #cbd5e1;"></i>
                    <h4 class="fw-bold text-dark mb-2">No Machineries Found</h4>
                    <p class="text-muted mx-auto" style="max-width: 400px;">We couldn't find any machines matching your current filter. Please try a different category or check back later.</p>
                    <button class="btn btn-primary mt-3 px-4 rounded-pill" onclick="switchSubCategory('All')">Clear Filter</button>
                </div>
            </div>
        `;
        renderPagination(0);
        return;
    }

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedMachines = machines.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    grid.innerHTML = paginatedMachines.map(machine => {
        const imgUrl = getProductImage(machine);
        const name = machine.product_name || machine.Name || machine.name || machine.Title || 'Unnamed Machine';
        const displayId = machine.product_id || machine.id;
        const slug = slugify(name);

        return `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="${imgUrl}" alt="${name}" class="product-img">
                </div>
                <div class="product-content">
                    <h3 class="product-title">${name}</h3>
                    <div class="product-footer">
                        <div class="product-price-column" style="cursor: pointer;" onclick="event.stopPropagation(); orderOnWhatsApp('${displayId}', '${name}')">
                            <span class="price-main" style="color: var(--color-accent); font-size: 0.95rem; text-transform: uppercase;">Get a Quote</span>
                        </div>
                        <div class="product-divider"></div>
                        <div class="product-action" onclick="window.location.href='products/machine/${slug}_${displayId}.html'">
                            <span>View More</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderPagination(machines.length);
}

function renderPagination(totalItems) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    html += `<button class="btn btn-outline-primary rounded-pill px-3" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fa-solid fa-chevron-left me-1"></i> Prev</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7) {
            if (i !== 1 && i !== totalPages && Math.abs(i - currentPage) > 1) {
                if (i === 2 && currentPage > 3) html += `<span class="px-2">...</span>`;
                if (i === totalPages - 1 && currentPage < totalPages - 2) html += `<span class="px-2">...</span>`;
                continue;
            }
        }

        const isActive = i === currentPage ? 'btn-primary' : 'btn-outline-primary';
        html += `<button class="btn ${isActive} rounded-pill px-3 fw-bold" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button class="btn btn-outline-primary rounded-pill px-3" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next <i class="fa-solid fa-chevron-right ms-1"></i></button>`;

    container.innerHTML = html;
}

window.changePage = function (page) {
    currentPage = page;
    updateMachineryList();
    document.getElementById('machine-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Switch Main Category (Horizontal Tab Click)
 */
window.switchMainCategory = async function (mainCategoryLabel, element) {
    // Map label to ID: Processing = 1, Packaging = 2
    const newId = mainCategoryLabel.includes('Packaging') || mainCategoryLabel === 2 ? 2 : 1;

    currentMainCategoryId = newId;
    currentSubCategoryId = 'All'; // Reset sub-category on main change
    currentPage = 1; // Reset pagination

    // Update Tab UI
    if (element) {
        document.querySelectorAll('.btn-main-cat-v3').forEach(btn => btn.classList.remove('active'));
        element.classList.add('active');
    }

    // Refresh Sub-categories and Product List
    await updateAll();
};

/**
 * Switch Sub-Category (Dropdown Change)
 */
window.switchSubCategory = async function (subCategoryId) {
    currentSubCategoryId = subCategoryId;
    currentPage = 1; // Reset pagination
    await updateMachineryList();
};

/**
 * WhatsApp Quote Helper
 */
function orderOnWhatsApp(id, name) {
    const message = encodeURIComponent(`Hi KMG Industries, I am interested in a quote for:\n\nMachine: ${name}\nID: ${id}\n\nPlease provide more details.`);
    window.open(`https://wa.me/${MACHINE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
}
window.orderOnWhatsApp = orderOnWhatsApp;


/**
 * Main Update Loop
 */
async function updateAll() {
    const grid = document.getElementById('dynamic-machine-grid');
    grid.innerHTML = `
        <div class="text-center w-100 py-5" style="grid-column: 1 / -1;">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 fw-bold text-primary animate__animated animate__pulse animate__infinite">Syncing with Industrial Database...</p>
        </div>
    `;

    const subCategories = await fetchSubCategories(currentMainCategoryId);
    renderSubCategoryOptions(subCategories);

    await updateMachineryList();
}

async function updateMachineryList() {
    const machines = await fetchMachineries(currentMainCategoryId, currentSubCategoryId);
    renderMachineries(machines);
}

// Initialization
document.addEventListener('DOMContentLoaded', updateAll);
