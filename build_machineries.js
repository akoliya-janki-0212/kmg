const fs = require('fs');
const path = require('path');

const CONFIG = {
    apiKey: 'patzUZXi4xbEcJBtZ.b612407e01e31156ccba38758a352318eae8a69ad628fa26230186c4b30b36a7',
    baseId: 'appkw4hlOEoVJZ7cn',
    tables: {
        machineries: 'machineries',
        categories: 'machine_category',
        technical: 'machine_technical',
        machine_reviews: 'machine_review',
        spares: 'spares',
        spares_categories: 'spares_category',
        spares_brand: 'spares_brand',
        spares_reviews: 'spares_review',
        spares_terms: 'spares_terms_condtion'
    },
    outputDir: './',
    baseUrl: 'https://kmgindustries.in/'
};

/**
 * Slugify Title: Lowercase, replace non-alphanumeric with underscore
 */
function slugify(text) {
    if (!text) return 'unnamed_product';
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '_')           // Replace spaces with _
        .replace(/[^\w-]+/g, '')       // Remove all non-word chars
        .replace(/--+/g, '_')           // Replace multiple - with single _
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function fetchAll(url) {
    let allRecords = [];
    let offset = '';
    do {
        const fullUrl = offset ? `${url}${url.includes('?') ? '&' : '?'}offset=${offset}` : url;
        const response = await fetch(fullUrl, {
            headers: { Authorization: `Bearer ${CONFIG.apiKey}` }
        });
        const data = await response.json();
        if (data.records) allRecords = allRecords.concat(data.records);
        offset = data.offset;
    } while (offset);
    return allRecords;
}

async function downloadImage(url, filePath) {
    if (!url) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(filePath)) return;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
    } catch (e) {
        console.error(`Image error (${url}):`, e.message);
    }
}

/**
 * Helper to render star rating HTML
 */
function renderStarsHtml(rating, interactive = false, productId = '') {
    let starsHtml = `<div class="star-rating d-flex gap-2" style="${interactive ? 'justify-content: center; width: 100%; margin: 0 auto; text-align: center;' : 'justify-content: flex-start;'}">`;
    const displayRating = Math.round(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        const type = i <= displayRating ? 'fa-solid' : 'fa-regular';
        const color = i <= displayRating ? '#ffc107' : '#e2e8f0';
        const action = interactive ? `onclick="window.submitProductReview('${productId}', ${i})"` : '';
        const mouseOver = interactive ? `onmouseover="window.previewStars(${i}, this.parentElement)"` : '';
        const mouseOut = interactive ? `onmouseout="window.previewStars(0, this.parentElement)"` : '';
        const cursor = interactive ? 'style="cursor: pointer; font-size: 2rem;"' : `style="color: ${color}; font-size: 1.2rem;"`;
        starsHtml += `<i class="${type} fa-star ${interactive ? 'interactive-star' : ''}" ${action} ${mouseOver} ${mouseOut} ${cursor} data-index="${i}"></i>`;
    }
    starsHtml += '</div>';
    return starsHtml;
}

async function build() {
    console.log("🚀 Starting Final Static Generation & SEO Sync...");

    const machineUrls = await buildMachineries();
    const spareUrls = await buildSpares();

    // 6. Update Sitemap
    console.log("Updating Sitemap...");
    const sitemapPath = path.join(process.cwd(), 'sitemap.xml');
    const baseSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kmgindustries.in/index.html</loc><lastmod>2026-04-03</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>https://kmgindustries.in/about.html</loc><lastmod>2026-04-03</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://kmgindustries.in/machineries.html</loc><lastmod>2026-04-03</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://kmgindustries.in/spares.html</loc><lastmod>2026-04-03</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://kmgindustries.in/contact.html</loc><lastmod>2026-04-03</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://kmgindustries.in/careers.html</loc><lastmod>2026-04-03</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;

    const allDynamicUrls = [...machineUrls, ...spareUrls].map(url => `  <url><loc>${url}</loc><lastmod>2026-04-03</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`).join('\n');
    fs.writeFileSync(sitemapPath, `${baseSitemap}\n${allDynamicUrls}\n</urlset>`);

    // 7. Generate Pre-loaded Static Catalog Data for List Pages
    console.log("Generating static catalog data for listings...");
    try {
        const machineCategories = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.categories}`);
        const machineriesRow = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.machineries}?sort[0][field]=name&sort[0][direction]=asc`);
        const spareCategories = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares_categories}`);
        const spareBrands = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares_brand}`);
        const sparesRow = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares}?sort[0][field]=Name&sort[0][direction]=asc`);

        const machineCatalog = machineriesRow.map(r => ({ id: r.id, ...r.fields }));
        const spareCatalog = sparesRow.map(r => ({ id: r.id, ...r.fields }));

        const jsContent = `// Auto-generated static payloads for catalog grids
window.MACHINE_CATEGORY_DATA = ${JSON.stringify(machineCategories)};
window.MACHINE_CATALOG_DATA = ${JSON.stringify(machineCatalog)};
window.SPARE_CATEGORY_DATA = ${JSON.stringify(spareCategories)};
window.SPARE_BRAND_DATA = ${JSON.stringify(spareBrands)};
window.SPARE_CATALOG_DATA = ${JSON.stringify(spareCatalog)};
`;
        fs.writeFileSync(path.join(process.cwd(), 'catalog_data.js'), jsContent);
        console.log("✅ Static catalog_data.js written successfully.");

        // SSR HTML Grid prep
        const initialMachineries = machineCatalog.filter(m => m.category == 1).sort((a, b) => {
            const nameA = a.name || a.product_name || a.Name || '';
            const nameB = b.name || b.product_name || b.Name || '';
            return String(nameA).localeCompare(String(nameB));
        });

        const initialSpares = spareCatalog.sort((a, b) => {
            const idA = a.product_id || a.id || a.ID || '';
            const idB = b.product_id || b.id || b.ID || '';
            return String(idA).localeCompare(String(idB), undefined, { numeric: true, sensitivity: 'base' });
        });

        injectPreloadedHTML(path.join(process.cwd(), 'machineries.html'), initialMachineries, 'machineries');
        injectPreloadedHTML(path.join(process.cwd(), 'spares.html'), initialSpares, 'spares');

    } catch (e) {
        console.error("Failed writing catalog_data.js:", e);
    }

    // 7.5 Inject SEO fallbacks into list pages
    injectSeoFallback(path.join(process.cwd(), 'machineries.html'), machineUrls);
    injectSeoFallback(path.join(process.cwd(), 'spares.html'), spareUrls);

    // 8. Cleanup Root Directory
    cleanupRootDirectory([...machineUrls, ...spareUrls]);

    console.log(`✅ Build Complete! Machineries: ${machineUrls.length}, Spares: ${spareUrls.length}`);
}

function injectSeoFallback(htmlPath, urls) {
    console.log(`Injecting SEO links into ${path.basename(htmlPath)}...`);
    try {
        if (!fs.existsSync(htmlPath)) return;
        let content = fs.readFileSync(htmlPath, 'utf8');
        const linksHtml = urls.map(url => `<a href="${url}">${url.split('/').pop().split('.html')[0].replace(/_/g, ' ')}</a>`).join('\n');

        const startTag = '<div id="seo-links-container" style="display: none;">';
        const endTag = '</div>';

        const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`);
        if (regex.test(content)) {
            content = content.replace(regex, `${startTag}\n${linksHtml}\n${endTag}`);
            fs.writeFileSync(htmlPath, content);
            console.log(`✅ Inject success for ${path.basename(htmlPath)}`);
        } else {
            console.warn(`⚠️ seo-links-container not found in ${path.basename(htmlPath)}`);
        }
    } catch (e) {
        console.error(`Error injecting SEO into ${htmlPath}:`, e);
    }
}

function injectPreloadedHTML(htmlPath, items, type) {
    console.log(`Preloading first page into ${path.basename(htmlPath)}...`);
    try {
        if (!fs.existsSync(htmlPath)) return;
        let content = fs.readFileSync(htmlPath, 'utf8');

        // 1. Render Grid
        let gridHtml = '';
        const firstPage = items.slice(0, 50);
        firstPage.forEach(item => {
            const name = item.product_name || item.Name || item.name || item.Title || 'Unnamed Product';
            const displayId = item.product_id || item.id || item.ID || 'N/A';
            const slug = slugify(name);
            const folder = type === 'machineries' ? 'machine' : 'spare';
            const assetSubfolder = type === 'machineries' ? 'machines' : 'spares';

            let imgUrl = type === 'machineries' ? 'assets/placeholder-machine.jpg' : 'assets/placeholder-spare.jpg';
            const rawImages = item.image || item.Image || item.ImageURL || [];

            if (rawImages && rawImages.length > 0) {
                // Point to the first local image downloaded by buildMachineries/buildSpares
                imgUrl = `assets/${assetSubfolder}/${slug}_${displayId}_0.png`;
            }

            gridHtml += `
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
                        <div class="product-action" onclick="window.location.href='products/${folder}/${slug}_${displayId}.html'">
                            <span>View More</span>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        const gridRegex = type === 'machineries' ? /(<div id="dynamic-machine-grid" class="grid-4">)[\s\S]*?(<\/div>\s*<!-- Pagination UI -->)/ : /(<div id="product-grid" class="product-grid">)[\s\S]*?(<\/div>\s*<!-- Pagination UI -->)/;

        content = content.replace(gridRegex, `$1\n${gridHtml}\n$2`);

        // 2. Render Pagination
        let paginationHtml = '';
        const totalPages = Math.ceil(items.length / 50);
        if (totalPages > 1) {
            let currentPage = 1;
            paginationHtml += `<button class="btn btn-outline-primary rounded-pill px-3" disabled onclick="changePage(${currentPage - 1})"><i class="fa-solid fa-chevron-left me-1"></i> Prev</button>`;
            for (let i = 1; i <= totalPages; i++) {
                if (totalPages > 7) {
                    if (i !== 1 && i !== totalPages && Math.abs(i - currentPage) > 1) {
                        if (i === 2 && currentPage > 3) paginationHtml += `<span class="px-2">...</span>`;
                        if (i === totalPages - 1 && currentPage < totalPages - 2) paginationHtml += `<span class="px-2">...</span>`;
                        continue;
                    }
                }
                const isActive = i === currentPage ? 'btn-primary' : 'btn-outline-primary';
                paginationHtml += `<button class="btn ${isActive} rounded-pill px-3 fw-bold" onclick="changePage(${i})">${i}</button>`;
            }
            paginationHtml += `<button class="btn btn-outline-primary rounded-pill px-3" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next <i class="fa-solid fa-chevron-right ms-1"></i></button>`;
        }

        const pagRegex = type === 'machineries' ? /(<div id="pagination-container"[^>]*>)[\s\S]*?(<\/div>)/ : /(<div id="pagination-container"[^>]*>)[\s\S]*?(<\/div>)/;
        content = content.replace(pagRegex, `$1\n${paginationHtml}\n$2`);

        // 3. Render Count
        const countRegex = type === 'machineries' ? /(<span id="machine-results-count"[^>]*>)[\s\S]*?(<\/span>)/ : /(<span id="product-count"[^>]*>)[\s\S]*?(<\/span>)/;
        content = content.replace(countRegex, `$1${items.length} Products$2`);

        fs.writeFileSync(htmlPath, content);
        console.log(`✅ Preloaded HTML success for ${path.basename(htmlPath)}`);
    } catch (e) {
        console.error(`Error preloading HTML into ${htmlPath}:`, e);
    }
}

function cleanupRootDirectory(generatedUrls) {
    console.log("🧹 Cleaning up root directory...");
    const protectedFiles = [
        'index.html', 'about.html', 'machineries.html', 'spares.html',
        'careers.html', 'contact.html', 'projects.html', 'media.html',
        'talkwithdhyan.html', 'case-studies.html', 'coaching.html',
        'contract-packaging.html', 'machine-details.html', 'product-details.html',
        '404.html', 'sitemap.xml', 'robots.txt'
    ];
    const files = fs.readdirSync('./');
    files.forEach(file => {
        if (file.endsWith('.html') && !protectedFiles.includes(file)) {
            // It might be a generated file from an older build
            console.log(`Deleting stale root file: ${file}`);
            fs.unlinkSync(file);
        }
    });
}

async function buildMachineries() {
    console.log("--- Building Machineries ---");
    const machineOutputDir = path.join(CONFIG.outputDir, 'products', 'machine');
    if (!fs.existsSync(machineOutputDir)) fs.mkdirSync(machineOutputDir, { recursive: true });

    // 1. Fetch Categories
    const categories = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.categories}`);
    const catMap = {};
    categories.forEach(c => catMap[c.fields.id || c.id] = c.fields.Name || c.fields.name);

    // 2. Fetch Technical Specs
    const technical = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.technical}`);
    const techMap = {};
    technical.forEach(t => {
        const pid = t.fields.product_id;
        if (!techMap[pid]) techMap[pid] = [];
        techMap[pid].push(t.fields);
    });

    // 3. Fetch Reviews
    const reviews = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.machine_reviews}`);
    const reviewMap = {};
    reviews.forEach(r => {
        const pid = r.fields.product_id;
        if (!reviewMap[pid]) reviewMap[pid] = [];
        reviewMap[pid].push(r.fields.review);
    });

    // 4. Fetch Machines
    const machinesRaw = await fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.machineries}?sort[0][field]=name&sort[0][direction]=asc`);
    const templatePath = path.join(process.cwd(), 'machine-details.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Fix relative paths for subdirectory
    template = template.replace(/href="styles\.css"/g, 'href="../../styles.css"');
    template = template.replace(/src="main\.js"/g, 'src="../../main.js"');
    template = template.replace(/src="components\.js"/g, 'src="../../components.js"');
    template = template.replace(/src="machine-details\.js"/g, 'src="../../machine-details.js"');
    template = template.replace(/href="assets\/favicon\.png"/g, 'href="../../assets/favicon.png"');

    const urls = [];
    for (const record of machinesRaw) {
        const machine = { id: record.id, airtableId: record.id, ...record.fields };
        const name = machine.product_name || machine.Name || machine.name || machine.Title || 'Unnamed Machine';
        const pid = machine.product_id || machine.id;
        const slug = slugify(name);
        const fileName = `${slug}_${pid}.html`;
        const description = (machine.description || "KMG Industries industrial machinery.").replace(/"/g, '&quot;');

        // Image Sync
        const localImages = [];
        const rawImages = machine.image || machine.Image || machine.ImageURL || [];
        for (let i = 0; i < rawImages.length; i++) {
            const localName = `${slug}_${pid}_${i}.png`;
            const localPath = `assets/machines/${localName}`;
            await downloadImage(rawImages[i].url, path.join(CONFIG.outputDir, localPath));
            localImages.push(`../../${localPath}`);
        }
        if (localImages.length === 0) localImages.push('../../assets/placeholder-machine.jpg');

        // Ratings
        const productReviews = reviewMap[pid] || [];
        const avgRating = productReviews.length > 0 ? productReviews.reduce((a, b) => a + b, 0) / productReviews.length : 4.5;
        const ratingHtml = renderStarsHtml(avgRating);

        // Technical Specs
        const specs = techMap[pid] || [];
        const specsHtml = specs.map(s => `<tr><td class="spec-label">${s.Title || s.technical_parameter || 'Spec'}</td><td class="spec-value">${s.Value || s.value || '-'}</td></tr>`).join('');

        const detailsHtml = `
            <div class="details-grid-condensed">
                <div class="product-gallery d-flex gap-3">
                    <div class="thumbnails-column">
                        ${localImages.map((img, i) => `<div class="thumb-item ${i === 0 ? 'active border-primary' : ''}" onclick="window.switchProductImage('${img}', this)"><img src="${img}"></div>`).join('')}
                    </div>
                    <div class="main-viewport shadow-sm border p-3">
                        <img id="main-product-img" src="${localImages[0]}" alt="${name}" class="img-fluid">
                    </div>
                </div>
                <div class="details-content">
                    <span class="badge-mini mb-2">SKU: SAL-M-${pid}</span>
                    <h1 class="product-h1 mt-0">${name}</h1>
                    <div class="mb-3">${ratingHtml}</div>
                    <div class="product-details-summary mb-4">
                        <table class="specs-table-premium">
                            <tr><td class="spec-label">Sub-Category</td><td class="spec-value">${catMap[machine.sub_category] || 'Equipment'}</td></tr>
                            ${specsHtml}
                        </table>
                    </div>
                    <button class="btn-primary-whatsapp w-100" onclick="window.orderOnWhatsApp('SAL-M-${pid}', '${name}')"><i class="fa-brands fa-whatsapp me-2"></i> GET A QUOTE</button>
                </div>
            </div>
            <div class="details-accordion mt-4">
                <div class="accordion-item active shadow-sm">
                    <button class="accordion-header p-3 w-100 d-flex justify-content-between align-items-center border-0" style="background:#e2e8f0;" onclick="window.toggleAccordion(this)">
                        <h3 class="mb-0 fw-bold" style="font-size: 1.5rem;">Details & Overview</h3>
                        <i class="fa-solid fa-chevron-up opacity-50"></i>
                    </button>
                    <div class="accordion-content p-4 bg-white" style="display:block; max-height:1000px; opacity:1; border-top:1px solid #f1f5f9;">
                        <div class="description-text">${description.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            </div>

            <!-- Rating Section -->
            <div class="text-center py-5 border-top mt-5">
                <p class="mb-2 fw-bold small text-muted text-uppercase" style="letter-spacing: 1px;">Rate this product:</p>
                <div class="d-flex justify-content-center">${renderStarsHtml(0, true, pid)}</div>
                <p class="small text-muted mt-2">Click a star to submit your review</p>
            </div>
        `;

        const breadcrumbHtml = `
            <li class="breadcrumb-item"><a href="../../index.html">Home</a></li>
            <li class="breadcrumb-item"><i class="fa-solid fa-chevron-right mx-2 opacity-50 small"></i></li>
            <li class="breadcrumb-item"><a href="../../machineries.html">Machineries</a></li>
            <li class="breadcrumb-item active ms-2" style="color: #ff6b35 !important;">${name}</li>
        `;

        let content = template
            .replace(/{{TITLE}}/g, name)
            .replace(/{{DESCRIPTION}}/g, description.substring(0, 160))
            .replace(/{{IMAGE_URL}}/g, localImages[0])
            .replace(/<!-- BREADCRUMB_INJECTION -->/g, breadcrumbHtml)
            .replace(/<!-- DATA_INJECTION -->/g, detailsHtml);

        const injection = `<script>window.isStaticPage = true; window.machineData = ${JSON.stringify(machine)};</script>`;
        fs.writeFileSync(path.join(machineOutputDir, fileName), content.replace('</body>', `${injection}</body>`));
        urls.push(`${CONFIG.baseUrl}products/machine/${fileName}`);
    }
    return urls;
}

async function buildSpares() {
    console.log("--- Building Spares ---");
    const spareOutputDir = path.join(CONFIG.outputDir, 'products', 'spare');
    if (!fs.existsSync(spareOutputDir)) fs.mkdirSync(spareOutputDir, { recursive: true });

    const [sparesRaw, catRaw, brandRaw, reviewRaw, termsRaw] = await Promise.all([
        fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares}`),
        fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares_categories}`),
        fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares_brand}`),
        fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares_reviews}`),
        fetchAll(`https://api.airtable.com/v0/${CONFIG.baseId}/${CONFIG.tables.spares_terms}`)
    ]);

    const catMap = {}; catRaw.forEach(c => catMap[c.fields.id || c.id] = c.fields.Name || c.fields.name);
    const brandMap = {}; brandRaw.forEach(b => brandMap[b.fields.id || b.id] = b.fields.Name || b.fields.name);
    const reviewMap = {}; reviewRaw.forEach(r => {
        const pid = r.fields.product_id;
        if (!reviewMap[pid]) reviewMap[pid] = [];
        reviewMap[pid].push(r.fields.review);
    });

    const templatePath = path.join(process.cwd(), 'product-details.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Fix relative paths
    template = template.replace(/href="styles\.css"/g, 'href="../../styles.css"');
    template = template.replace(/src="main\.js"/g, 'src="../../main.js"');
    template = template.replace(/src="components\.js"/g, 'src="../../components.js"');
    template = template.replace(/src="product-details\.js"/g, 'src="../../product-details.js"');
    template = template.replace(/href="assets\/favicon\.png"/g, 'href="../../assets/favicon.png"');

    const urls = [];
    for (const record of sparesRaw) {
        const spare = { id: record.id, ...record.fields };
        const name = spare.product_name || spare.Name || 'Unnamed Spare';
        const pid = spare.product_id || spare.id;
        const slug = slugify(name);
        const fileName = `${slug}_${pid}.html`;
        const description = (spare.description || spare.Description || "Industrial material by KMG Industries.").replace(/"/g, '&quot;');

        // Image Sync
        const localImages = [];
        const rawImages = spare.image || spare.Image || spare.ImageURL || [];
        for (let i = 0; i < rawImages.length; i++) {
            const localName = `${slug}_${pid}_${i}.png`;
            const localPath = `assets/spares/${localName}`;
            await downloadImage(rawImages[i].url, path.join(CONFIG.outputDir, localPath));
            localImages.push(`../../${localPath}`);
        }
        if (localImages.length === 0) localImages.push('../../assets/placeholder-spare.jpg');

        // Ratings
        const productReviews = reviewMap[pid] || [];
        const avgRating = productReviews.length > 0 ? productReviews.reduce((a, b) => a + b, 0) / productReviews.length : 5;
        const ratingHtml = renderStarsHtml(avgRating);

        // Terms
        const termsHtml = termsRaw.map(t => `<div class="term-entry"><i class="fa-solid fa-check me-2 text-success"></i><span>${t.fields.description || t.fields.Description || ''}</span></div>`).join('');

        const detailsHtml = `
            <div class="details-grid-condensed">
                <div class="product-gallery d-flex gap-3">
                    <div class="main-viewport shadow-sm border p-3 w-100">
                        <img id="main-product-img" src="${localImages[0]}" alt="${name}" class="img-fluid">
                    </div>
                </div>
                <div class="details-content">
                    <span class="badge-mini mb-2">ID: ${pid}</span>
                    <h1 class="product-h1 mt-0">${name}</h1>
                    <div class="mb-3">${ratingHtml}</div>
                    <div class="product-details-summary mb-4">
                        <table class="specs-table-premium">
                            <tr><td class="spec-label">Category</td><td class="spec-value">${catMap[spare.category_id] || 'General'}</td></tr>
                            <tr><td class="spec-label">Brand</td><td class="spec-value">${brandMap[spare.brand] || 'KMG'}</td></tr>
                            ${spare.material ? `<tr><td class="spec-label">Material</td><td class="spec-value">${spare.material}</td></tr>` : ''}
                        </table>
                    </div>
                    <button class="btn-primary-whatsapp w-100" onclick="window.orderOnWhatsApp('${pid}', '${name}')"><i class="fa-brands fa-whatsapp me-2"></i> GET A QUOTE</button>
                </div>
            </div>
            <div class="details-accordion mt-4">
                <div class="accordion-item active shadow-sm">
                    <button class="accordion-header p-3 w-100 d-flex justify-content-between align-items-center border-0" style="background:#e2e8f0;" onclick="window.toggleAccordion(this)">
                        <h3 class="mb-0 fw-bold" style="font-size: 1.5rem;">Details & Overview</h3>
                        <i class="fa-solid fa-chevron-up opacity-50"></i>
                    </button>
                    <div class="accordion-content p-4" style="display:block; max-height:1000px; opacity:1;">
                        <p>${description.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
                <div class="accordion-item shadow-sm mt-2">
                    <button class="accordion-header p-3 w-100 d-flex justify-content-between align-items-center border-0" style="background:#f8fafc;" onclick="window.toggleAccordion(this)">
                        <h3 class="mb-0 fw-bold" style="font-size: 1.5rem;">Terms & Conditions</h3>
                        <i class="fa-solid fa-chevron-down opacity-50"></i>
                    </button>
                    <div class="accordion-content p-4" style="display:none; max-height:0; opacity:0; overflow:hidden;">
                        <div class="dynamic-terms-container">${termsHtml}</div>
                    </div>
                </div>
            </div>

            <!-- Rating Section -->
            <div class="text-center py-5 border-top mt-5">
                <p class="mb-2 fw-bold small text-muted text-uppercase" style="letter-spacing: 1px;">Rate this product:</p>
                <div class="d-flex justify-content-center">${renderStarsHtml(0, true, pid)}</div>
                <p class="small text-muted mt-2">Click a star to submit your review</p>
            </div>
        `;

        const breadcrumbHtml = `
            <li class="breadcrumb-item"><a href="../../index.html">Home</a></li>
            <li class="breadcrumb-item"><i class="fa-solid fa-chevron-right mx-1 opacity-50 small"></i></li>
            <li class="breadcrumb-item"><a href="../../spares.html">Spares</a></li>
            <li class="breadcrumb-item active ms-2" style="color: #ff6b35 !important;">${name}</li>
        `;

        let content = template
            .replace(/{{TITLE}}/g, name)
            .replace(/{{DESCRIPTION}}/g, description.substring(0, 160))
            .replace(/{{IMAGE_URL}}/g, localImages[0])
            .replace(/<!-- BREADCRUMB_INJECTION -->/g, breadcrumbHtml)
            .replace(/<!-- DATA_INJECTION -->/g, detailsHtml);

        const injection = `<script>window.isStaticPage = true; window.productData = ${JSON.stringify(spare)};</script>`;
        fs.writeFileSync(path.join(spareOutputDir, fileName), content.replace('</body>', `${injection}</body>`));
        urls.push(`${CONFIG.baseUrl}products/spare/${fileName}`);
    }
    return urls;
}

build().catch(err => console.error("Build Failed:", err));
