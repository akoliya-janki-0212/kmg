/**
 * Product Details Page Logic
 * Fetches specific record from Airtable using record ID
 */

const SPARES_CONFIG = {
    apiKey: 'patzUZXi4xbEcJBtZ.b612407e01e31156ccba38758a352318eae8a69ad628fa26230186c4b30b36a7',
    baseId: 'appkw4hlOEoVJZ7cn',
    tableName: 'spares',
    categoryTable: 'spares_category',
    brandTable: 'spares_brand',
    technicalTable: 'spares_productTechnical',
    reviewTable: 'spares_review',
    termsTable: 'spares_terms_condtion',
    whatsappNumber: '919104183331'
};

const MACHINERY_CONFIG = {
    apiKey: 'patzUZXi4xbEcJBtZ.b612407e01e31156ccba38758a352318eae8a69ad628fa26230186c4b30b36a7',
    baseId: 'appkw4hlOEoVJZ7cn',
    tableName: 'machineries',
    categoryTable: 'machine_category',
    technicalTable: 'machine_technical',
    whatsappNumber: '919104183331'
};

let currentConfig = SPARES_CONFIG; // Default to spares

// Helper to get image URL(s) from Airtable (String or Attachment Array)
function getProductImages(record) {
    const fieldData = record.image || record.Image || record.ImageURL || record.imageurl;
    if (!fieldData) return ['assets/placeholder-spare.jpg'];
    if (Array.isArray(fieldData) && fieldData.length > 0) {
        return fieldData.map(img => img.url); // Return all attachment URLs
    }
    return [fieldData]; // Return string URL in array
}

// Single Image Helper for Similar Products
function getProductThumb(record) {
    const fieldData = record.image || record.Image || record.ImageURL || record.imageurl;
    if (!fieldData) return 'assets/placeholder-spare.jpg';
    if (Array.isArray(fieldData) && fieldData.length > 0) {
        return fieldData[0].url;
    }
    return fieldData;
}

// Terms & Conditions Helper
async function fetchProductTerms() {
    if (!currentConfig.termsTable) return [];
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${currentConfig.termsTable}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${currentConfig.apiKey}`
            }
        });
        const data = await response.json();
        return data.records.map(r => r.fields);
    } catch (error) {
        console.error("Terms Data Error:", error);
        return [];
    }
}

// Review System Helpers
async function fetchProductReviews(productId) {
    if (!currentConfig.reviewTable) return [];
    const filterFormula = `{product_id} = "${productId}"`;
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${currentConfig.reviewTable}?filterByFormula=${encodeURIComponent(filterFormula)}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${currentConfig.apiKey}`
            }
        });
        const data = await response.json();
        return data.records.map(r => r.fields);
    } catch (error) {
        console.error("Reviews Data Error:", error);
        return [];
    }
}

async function submitProductReview(productId, rating) {
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${currentConfig.reviewTable}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${currentConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    product_id: parseInt(productId),
                    review: parseInt(rating)
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Submission Error Response:", data);
            throw new Error(data.error?.message || "Submission Failed");
        }

        if (data.id) {
            alert("Thank you for your review!");
            location.reload();
        }
    } catch (error) {
        console.error("Submit Review Error:", error);
        alert("Failed to submit review. Please try again later.");
    }
}

function renderStars(rating, interactive = false, productId = '') {
    let starsHtml = '<div class="star-rating">';
    const displayRating = Math.round(rating);

    for (let i = 1; i <= 5; i++) {
        const type = i <= displayRating ? 'fa-solid' : 'fa-regular';
        const colorClass = i <= displayRating ? 'star-filled' : 'star-empty';
        const action = interactive ? `onclick="window.submitProductReview('${productId}', ${i})"` : '';
        const mouseOver = interactive ? `onmouseover="window.previewStars(${i}, this.parentElement)"` : '';
        const mouseOut = interactive ? `onmouseout="window.previewStars(0, this.parentElement)"` : '';
        const cursor = interactive ? 'style="cursor: pointer;"' : '';

        starsHtml += `<i class="${type} fa-star ${colorClass} ${interactive ? 'interactive-star' : ''}" ${action} ${mouseOver} ${mouseOut} ${cursor}></i>`;
    }
    starsHtml += '</div>';
    return starsHtml;
}

// Hover Preview Helper
window.previewStars = function (rating, container) {
    const stars = container.querySelectorAll('.interactive-star');
    stars.forEach((star, index) => {
        const i = index + 1;
        if (i <= rating) {
            star.classList.remove('fa-regular', 'star-empty');
            star.classList.add('fa-solid', 'star-filled');
        } else {
            star.classList.remove('fa-solid', 'star-filled');
            star.classList.add('fa-regular', 'star-empty');
        }
    });
};

// Global expose for onclick
window.submitProductReview = submitProductReview;

async function fetchProductDetails(recordId) {
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${currentConfig.tableName}/${recordId}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${currentConfig.apiKey}`
            }
        });
        const data = await response.json();
        return { id: data.id, ...data.fields };
    } catch (error) {
        console.error("Airtable Fetch Error:", error);
        return null;
    }
}

async function fetchProductTechnical(productId) {
    const filterFormula = `{product_id} = "${productId}"`;
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${currentConfig.technicalTable}?filterByFormula=${encodeURIComponent(filterFormula)}`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${currentConfig.apiKey}` }
        });
        const data = await response.json();
        return data.records.map(r => r.fields);
    } catch (error) {
        console.error("Technical Data Error:", error);
        return [];
    }
}

async function fetchLookupName(tableName, recordValue) {
    if (!tableName) return 'N/A';
    let customId = Array.isArray(recordValue) ? recordValue[0] : recordValue;
    if (customId === undefined || customId === null || customId === '' || customId === 'N/A') return 'N/A';

    const filterFormula = `{id} = "${customId}"`;
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${tableName}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${currentConfig.apiKey}` }
        });
        const data = await response.json();
        if (data.records && data.records.length > 0) {
            const fields = data.records[0].fields;
            return fields.naem || fields.Name || fields.name || 'Unknown';
        }
        return 'Not Found';
    } catch (error) {
        console.error(`Lookup Error (${tableName}):`, error);
        return 'N/A';
    }
}

async function fetchSimilarProducts(categoryId, currentId) {
    if (!categoryId) return [];

    const catField = currentConfig === MACHINERY_CONFIG ? 'sub_category' : 'category_id';
    const filterFormula = `AND({${catField}} = "${categoryId}", RECORD_ID() != "${currentId}")`;
    const url = `https://api.airtable.com/v0/${currentConfig.baseId}/${currentConfig.tableName}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=4`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${currentConfig.apiKey}` }
        });
        const data = await response.json();
        return data.records.map(r => ({ id: r.id, ...r.fields }));
    } catch (error) {
        console.error("Similar Products Error:", error);
        return [];
    }
}

async function renderProductDetails(product) {
    const container = document.getElementById('product-details-container');
    const breadcrumbName = document.getElementById('breadcrumb-name');

    if (!product) {
        container.innerHTML = `<div class="text-center p-5"><h2>Product Not Found</h2></div>`;
        return;
    }

    // Data Mapping from 'spares' table - Exact column matching
    const name = product.Name || product.product_name || 'Unnamed Product';
    const rawId = product.product_id || product['product_id'] || product['Product ID'] || 'N/A';
    const idString = (rawId === 'N/A') ? 'N/A' : (rawId.toString().startsWith('SAL-') ? rawId.toString() : `SAL-${rawId}`);

    // Pricing - EXACT COLUMN NAMES: Price, Selling Price
    // We parse as number to avoid comparison issues
    const price = parseFloat(product.Price || product.price || 0);
    const sellingPrice = parseFloat(product['Selling Price'] || product.SellingPrice || product['selling price'] || price);

    const images = getProductImages(product);
    const description = product.Description || product.description || product.DescriptionText || 'Quality industrial spare part.';

    // Parallel fetch for extra data AND name lookups
    const rawCategoryId = product.Category_id || product.category_id || product['Category_id'] || '';
    const rawBrandId = product.brand || product.Brand || product.brand_id || '';

    // Parallel Fetching: Get all related data in one go
    const [technicalSpecs, similarProducts, resolvedCategory, resolvedBrand, reviews, terms] = await Promise.all([
        fetchProductTechnical(rawId),
        fetchSimilarProducts(currentConfig === MACHINERY_CONFIG ? (product.sub_category?.[0] || product.sub_category) : rawCategoryId, product.id),
        fetchLookupName(currentConfig.categoryTable, currentConfig === MACHINERY_CONFIG ? (product.sub_category?.[0] || product.sub_category) : rawCategoryId),
        fetchLookupName(currentConfig.brandTable, rawBrandId),
        fetchProductReviews(rawId),
        fetchProductTerms()
    ]);

    // Calculate Average Rating
    const ratings = reviews.map(r => r.review).filter(r => r !== undefined);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const ratingHtml = renderStars(avgRating);

    // Consolidate Category and Brand into specs if they exist
    const allSpecs = [];
    if (resolvedCategory && resolvedCategory !== 'N/A') allSpecs.push({ Name: 'Category', Value: resolvedCategory });
    if (resolvedBrand && resolvedBrand !== 'N/A') allSpecs.push({ Name: 'Brand', Value: resolvedBrand });

    // Add technical specs from the technicalTable
    technicalSpecs.forEach(spec => {
        allSpecs.push({
            Name: spec.Name || spec.Title || 'Parameter',
            Value: spec.Value || spec.value || '-'
        });
    });

    if (breadcrumbName) breadcrumbName.textContent = name;
    document.title = `${name} | KMG Machineries`;

    container.innerHTML = `
        <div class="details-grid-condensed">
            <!-- Left Side: Interactive Gallery -->
            <div class="product-gallery">
                <div class="thumbnails-column">
                    ${images.map((img, index) => `
                        <div class="thumb-item ${index === 0 ? 'active' : ''}" onclick="window.setActiveImage(this, '${img}')">
                            <img src="${img}" alt="thumbnail">
                        </div>
                    `).join('')}
                </div>
                <div class="main-viewport" onmousemove="window.handleZoom(event, this)" onmouseleave="window.resetZoom(this)">
                    <img id="main-product-img" src="${images[0]}" alt="${name}">
                </div>
            </div>
            
            <!-- Right Side: Essential Product Info -->
            <div class="details-content-condensed">
                <div class="mb-1">
                    <span class="badge-mini">SKU: ${idString}</span>
                </div>
                <h1 class="product-h1 mb-1">${name}</h1>
                <div class="mb-3">
                    ${ratingHtml}
                </div>
                
                <!-- Combined Specifications Table -->
                <div class="technical-section mb-4">
                    <h5 class="section-subtitle-compact mb-2">Product Details:</h5>
                    <table class="specs-table-premium">
                        <tbody>
                            ${allSpecs.map(spec => `
                                <tr>
                                    <td class="spec-label">${spec.Name}</td>
                                    <td class="spec-value">${spec.Value}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="action-buttons mb-4">
                    <button class="btn btn-primary-whatsapp w-100 mb-2" onclick="orderOnWhatsApp('${idString}', '${name}')">
                        <i class="fa-brands fa-whatsapp me-2"></i> GET A QUOTE
                    </button>
                    <button class="btn btn-outline-share w-100" onclick="shareProduct('${name}')">
                        <i class="fa-solid fa-share-nodes me-2"></i> Share Product
                    </button>
                </div>
            </div>
        </div>

        <!-- Dynamic Accordion Section -->
        <div class="details-accordion">
            <!-- Item 1: Details & Overview (Product Description) -->
            <div class="accordion-item active">
                <button class="accordion-header" onclick="toggleAccordion(this)">
                    <h3 class="accordion-title">Details & Overview</h3>
                    <i class="fa-solid fa-chevron-down accordion-icon"></i>
                </button>
                <div class="accordion-content">
                    <div class="accordion-inner">
                        <p>${description.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            </div>

            <!-- Item 2: Terms & Conditions (Static) -->
            <div class="accordion-item">
                <button class="accordion-header" onclick="toggleAccordion(this)">
                    <h3 class="accordion-title">Terms & Conditions</h3>
                    <i class="fa-solid fa-chevron-down accordion-icon"></i>
                </button>
                <div class="accordion-content">
                    <div class="accordion-inner">
                        ${terms.length > 0 ? `
                            <div class="dynamic-terms-container">
                                ${terms.sort((a, b) => (a.id || 0) - (b.id || 0)).map(t => `
                                    <div class="term-entry">
                                        <div class="term-icon-wrapper">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                        <div class="term-text">
                                            ${t.description || t.Description || ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p>Please refer to our standard terms and conditions for details.</p>'}
                    </div>
                </div>
            </div>
        </div>

        <!-- Product Review Section (Standalone) -->
        <div class="product-review-section mt-5">
            <div class="review-box text-center py-4">
                <h5 class="mb-3">Rate this product:</h5>
                ${renderStars(0, true, rawId)}
                <p class="mt-2 text-muted small">Click a star to submit your review</p>
            </div>
        </div>

        <!-- Part 2: Similar Products (From spares table) -->
        ${similarProducts.length > 0 ? `
            <div class="similar-products-section mt-5 pt-5">
                <h3 class="section-title mb-4" style="text-align: left;">Similar <span class="highlight">Products</span></h3>
                <div class="grid-4">
                    ${similarProducts.map(p => {
        const img = getProductThumb(p);
        const pName = p.product_name || p.Name || 'Unnamed';
        const pPrice = parseFloat(p.Price || p.price || 0);
        const pSellingPrice = parseFloat(p['Selling Price'] || p.SellingPrice || p.selling_price || pPrice);

        return `
                            <div class="product-card">
                                <div class="product-img-container">
                                    <img src="${img}" alt="${pName}" class="product-img">
                                </div>
                                <div class="product-content">
                                    <h3 class="product-title">${pName}</h3>
                                    <div class="product-footer">
                                        <div class="product-price-column" style="cursor: pointer;" onclick="event.stopPropagation(); orderOnWhatsApp('${p.product_id || p.id}', '${pName}')">
                                            <span class="price-main" style="color: var(--color-accent); font-size: 0.95rem; text-transform: uppercase;">Get a Quote</span>
                                        </div>
                                        <div class="product-divider"></div>
                                        <div class="product-action" onclick="window.location.href='product-details.html?id=${p.id}'">
                                            <span>View More</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="mt-5 pt-5 text-center">
            <a href="${currentConfig === MACHINERY_CONFIG ? 'machineries.html' : 'spares.html'}" class="btn btn-outline px-5">
                <i class="fa-solid fa-arrow-left me-2"></i> Back to ${currentConfig === MACHINERY_CONFIG ? 'Machineries' : '120 Min Spares'}
            </a>
        </div>
    `;
}

window.toggleAccordion = function (button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');

    // Close all other accordion items (standard behavior)
    document.querySelectorAll('.accordion-item').forEach(el => {
        el.classList.remove('active');
    });

    // Toggle current item
    if (!isActive) {
        item.classList.add('active');
    }
};

window.previewStars = function (rating, container) {
    const stars = container.querySelectorAll('.interactive-star');
    stars.forEach((star, index) => {
        const i = index + 1;
        if (i <= rating) {
            star.classList.remove('fa-regular');
            star.classList.add('fa-solid');
            star.style.color = '#ffc107';
            star.style.opacity = '1';
        } else {
            star.classList.remove('fa-solid');
            star.classList.add('fa-regular');
            star.style.color = '#e2e8f0';
            star.style.opacity = '0.5';
        }
    });
};

window.submitProductReview = async function(productId, rating) {
    const url = `https://api.airtable.com/v0/${SPARES_CONFIG.baseId}/${SPARES_CONFIG.reviewTable}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${SPARES_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    product_id: parseInt(productId) || 0,
                    review: parseInt(rating)
                }
            })
        });

        if (response.ok) {
            alert("Thank you for your rating!");
            // Instead of reload, just update UI optionally, but reload is fine for static text refresh
            location.reload();
        } else {
            console.error("Review Error");
            alert("Thank you for your feedback!");
        }
    } catch (error) {
        console.error("Submit Review Error:", error);
        alert("Thank you for your feedback!");
    }
}

window.toggleAccordion = function (btn) {
    const parent = btn.closest('.accordion-item');
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('i');
    const isActive = parent.classList.contains('active');

    if (!isActive) {
        // Open
        parent.classList.add('active');
        btn.classList.add('active');
        btn.style.background = '#e2e8f0';
        if(icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        
        content.style.display = 'block';
        setTimeout(() => {
            content.style.maxHeight = '1000px';
            content.style.opacity = '1';
        }, 10);
    } else {
        // Close
        parent.classList.remove('active');
        btn.classList.remove('active');
        btn.style.background = '#f8fafc';
        if(icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        setTimeout(() => {
            content.style.display = 'none';
        }, 300);
    }
}

function orderOnWhatsApp(id, name) {
    const message = encodeURIComponent(`Hi KMG Machineries, I am interested in ordering: \n\nProduct: ${name}\nID: ${id}\n\nPlease provide more details.`);
    window.open(`https://wa.me/919104183331?text=${message}`, '_blank');
}

// Interactive Gallery & Zoom Functionality
window.setActiveImage = function (element, src) {
    // Update Main Image
    const mainImg = document.getElementById('main-product-img');
    if (mainImg) mainImg.src = src;

    // Update Active Thumbnail
    document.querySelectorAll('.thumb-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
};

window.handleZoom = function (e, container) {
    const img = container.querySelector('img');
    const zoomHint = container.querySelector('.zoom-hint');
    if (!img) return;

    if (zoomHint) zoomHint.style.opacity = '0';

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(2)';
};

window.resetZoom = function (container) {
    const img = container.querySelector('img');
    const zoomHint = container.querySelector('.zoom-hint');
    if (!img) return;

    if (zoomHint) zoomHint.style.opacity = '1';

    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center';
};

function shareProduct(name) {
    if (navigator.share) {
        navigator.share({
            title: name,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Product link copied to clipboard!');
    }
}

// Global Initialization Guard
let isDetailsInitialized = false;

// Initialization and URL Parsing
document.addEventListener('DOMContentLoaded', async () => {
    if (isDetailsInitialized) return;
    isDetailsInitialized = true;

    if (window.isStaticPage && window.productData) {
        console.log("Static Page Detected: Using pre-injected SPARE data.");
        // We can skip fetching because the build script baked everything in.
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('id');
    const type = urlParams.get('type');

    if (type === 'machine') {
        currentConfig = MACHINERY_CONFIG;
    }

    if (recordId) {
        const product = await fetchProductDetails(recordId);
        renderProductDetails(product);
    } else {
        renderProductDetails(null);
    }
});
