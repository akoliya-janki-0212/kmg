/**
 * Spares & Service - Product Listing Integration
 * Fetches data from Airtable and handles categorization
 */

const SPARES_CONFIG = {
    apiKey: 'patzUZXi4xbEcJBtZ.b612407e01e31156ccba38758a352318eae8a69ad628fa26230186c4b30b36a7',
    baseId: 'appkw4hlOEoVJZ7cn',
    tableName: 'spares',
    categoryTable: 'spares_category',
    brandTable: 'spares_brand',
    whatsappNumber: '919104183331'
};

// Global Filter State
let currentCategoryId = 'All';
let currentBrandId = 'All';
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

// Helper to get image URL from Airtable (String or Attachment Array)
function getProductImage(record) {
    const name = record.product_name || record.Name || record.name || record.Title || 'Unnamed Product';
    const id = record.product_id || record.id || record.ID || record['Product ID'] || 'N/A';
    const slug = slugify(name);

    const fieldData = record.image || record.Image || record.ImageURL || record.imageurl;
    if (fieldData && ((Array.isArray(fieldData) && fieldData.length > 0) || (typeof fieldData === 'string' && fieldData.length > 5))) {
        return `assets/spares/${slug}_${id}_0.png`;
    }
    return 'assets/placeholder-spare.jpg';
}

function slugify(text) {
    if (!text) return 'unnamed_product';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '_')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function fetchProducts(catId, brandId) {
    if (!window.SPARE_CATALOG_DATA) return [];

    let filtered = window.SPARE_CATALOG_DATA.filter(p => {
        if (catId && catId !== 'All' && String(p.category_id) !== String(catId)) return false;
        if (brandId && brandId !== 'All' && String(p.brand) !== String(brandId)) return false;
        return true;
    });

    return filtered.sort((a, b) => {
        const idA = a.product_id || a.id || a.ID || '';
        const idB = b.product_id || b.id || b.ID || '';
        return String(idA).localeCompare(String(idB), undefined, { numeric: true, sensitivity: 'base' });
    });
}

async function fetchFilterOptions(tableName) {
    let rawData = [];
    if (tableName === SPARES_CONFIG.categoryTable) rawData = window.SPARE_CATEGORY_DATA || [];
    else if (tableName === SPARES_CONFIG.brandTable) rawData = window.SPARE_BRAND_DATA || [];

    return rawData.map(record => {
        // Priority for custom ID fields: id, ID, Id, or any field with 'id' in its name
        const customId = record.fields.id || record.fields.ID || record.fields.Id || record.fields['Product ID'] || record.fields['id'];
        return {
            id: customId || record.id, // Fallback to record.id only if truly missing
            name: record.fields.naem || record.fields.Name || record.fields.name || 'Unnamed'
        };
    }).sort((a, b) => {
        // Robust alphanumeric sort (handles 1, 2, 10 correctly)
        return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
    });
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    const countDisplay = document.getElementById('product-count');

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="text-center w-100 p-5">
                <i class="fa-solid fa-box-open fa-3x mb-3" style="opacity:0.3;"></i>
                <p>No products found in this category yet.</p>
            </div>
        `;
        countDisplay.textContent = '0 Products';
        renderPagination(0);
        return;
    }

    countDisplay.textContent = `${products.length} Products`;

    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = products.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    grid.innerHTML = paginatedProducts.map(product => {
        const imgUrl = getProductImage(product);
        const name = product.product_name || product.Name || product.name || product.Title || 'Unnamed Product';
        const id = product.product_id || product.id || product.ID || product['Product ID'] || 'N/A';

        return `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="${imgUrl}" alt="${name}" class="product-img">
                </div>
                <div class="product-content">
                    <h3 class="product-title">${name}</h3>
                    
                    <div class="product-footer">
                        <div class="product-price-column" style="cursor: pointer;" onclick="event.stopPropagation(); orderOnWhatsApp('${id}', '${name}')">
                            <span class="price-main" style="color: var(--color-accent); font-size: 0.95rem; text-transform: uppercase;">Get a Quote</span>
                        </div>
                        <div class="product-divider"></div>
                        <div class="product-action" onclick="window.location.href='products/spare/${slugify(name)}_${id}.html'">
                            <span>View More</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderPagination(products.length);
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
    updateProductList();
    document.getElementById('current-category-name').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function orderOnWhatsApp(id, name) {
    const message = encodeURIComponent(`Hi KMG Industries, I am interested in ordering: \n\nProduct: ${name}\nID: ${id}\n\nPlease provide more details.`);
    window.open(`https://wa.me/${SPARES_CONFIG.whatsappNumber}?text=${message}`, '_blank');
}

function renderFilterBar(categories, brands) {
    const container = document.getElementById('category-filter-container');
    if (!container) return;

    container.innerHTML = `
        <div class="filter-bar-grid d-flex flex-wrap align-items-center gap-4 mb-5">
            <!-- Category Filter -->
            <div class="filter-group d-flex align-items-center gap-3">
                <label for="category-select" class="fw-bold text-dark text-nowrap"><i class="fa-solid fa-layer-group me-2 text-accent"></i>Category:</label>
                <select id="category-select" class="form-select professional-select" onchange="window.switchCategory(this.value)">
                    <option value="All">All Categories</option>
                    ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                </select>
            </div>

            <!-- Brand Filter -->
            <div class="filter-group d-flex align-items-center gap-3">
                <label for="brand-select" class="fw-bold text-dark text-nowrap"><i class="fa-solid fa-tag me-2 text-accent"></i>Brand:</label>
                <select id="brand-select" class="form-select professional-select" onchange="window.switchBrand(this.value)">
                    <option value="All">All Brands</option>
                    ${brands.map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
}

async function updateProductList() {
    const grid = document.getElementById('product-grid');
    const categoryTitle = document.getElementById('current-category-name');

    if (categoryTitle) categoryTitle.textContent = "Filtered Results";

    grid.innerHTML = `
        <div class="text-center w-100 p-5" id="loader">
            <i class="fa-solid fa-circle-notch fa-spin fa-3x text-primary"></i>
            <p class="mt-3">Updating products list...</p>
        </div>
    `;

    const products = await fetchProducts(currentCategoryId, currentBrandId);
    renderProducts(products);
}

// Function switches
window.switchCategory = function (catId) {
    currentCategoryId = catId;
    currentPage = 1;
    updateProductList();
};

window.switchBrand = function (brandId) {
    currentBrandId = brandId;
    currentPage = 1;
    updateProductList();
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch Categories and Brands dynamically from Lookup Tables
    const [categories, brands] = await Promise.all([
        fetchFilterOptions(SPARES_CONFIG.categoryTable),
        fetchFilterOptions(SPARES_CONFIG.brandTable)
    ]);

    // 2. Render the Dual Filter Bar
    renderFilterBar(categories, brands);

    // 3. Load All Products initially
    updateProductList();
});
