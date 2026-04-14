/**
 * Talk with Dhyan - Refined Airtable Integration
 * Supports both URL strings and Airtable Attachment objects
 * Added Case-Insensitive Field Handling for User Ease
 */

const AIRTABLE_CONFIG = {
    apiKey: 'patzUZXi4xbEcJBtZ.b612407e01e31156ccba38758a352318eae8a69ad628fa26230186c4b30b36a7',
    baseId: 'appkw4hlOEoVJZ7cn',
    tables: {
        events: 'Events',
        videos: 'Videos',
        incommingSessions: 'Incomming_Event'
    }
};

// Helper to get image URL from Airtable (String or Attachment Array)
function getImageUrl(record) {
    // Check various common field names for images
    const fieldData = record.Image || record.image || record.ImageURL || record.imageurl;
    console.log(fieldData);
    if (!fieldData) return 'assets/images/placeholder-event.jpg';
    if (Array.isArray(fieldData) && fieldData.length > 0) {
        return fieldData[0].url; // Airtable Attachment format
    }
    return fieldData; // String URL format
}

async function fetchAirtableData(tableName, options = {}) {
    const { sortField, sortOrder = 'asc', maxRecords = 100, filterByFormula = '' } = options;
    let url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${tableName}?maxRecords=${maxRecords}`;

    if (sortField) {
        url += `&sort[0][field]=${sortField}&sort[0][direction]=${sortOrder}`;
    }
    if (filterByFormula) {
        url += `&filterByFormula=${encodeURIComponent(filterByFormula)}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_CONFIG.apiKey}`
            }
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("Airtable API Error Detail:", errorBody);
            throw new Error(`Airtable error: ${response.status} - ${errorBody.error?.type || response.statusText}`);
        }
        const data = await response.json();
        return data.records.map(record => ({ id: record.id, ...record.fields }));
    } catch (error) {
        console.error("Full Error Context:", error);
        return [];
    }
}

// Section 1: Featured Next Event
async function renderFeaturedEvent() {
    const container = document.getElementById('featured-event-container');
    if (!container) return;

    const events = await fetchAirtableData(AIRTABLE_CONFIG.tables.events, {
        maxRecords: 1,
        sortField: 'Date',
        sortOrder: 'asc',
        filterByFormula: 'IS_AFTER({Date}, TODAY())'
    });

    if (events.length === 0) {
        container.innerHTML = '<div class="text-center p-5"><h2>Stay tuned for the next session!</h2></div>';
        return;
    }

    const event = events[0];
    const imageUrl = getImageUrl(event);
    const description = event.Description || event.description || event.Details || event.details || '';

    const eventDate = new Date(event.Date || event.date);
    const formattedDate = eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = event.Time || event.time || eventDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

    const topic = event.Topic || event.topic || event.Title || event.title;
    const meetingCode = event.MeetingCode || event.meetingcode || 'N/A';
    const meetingLink = event.MeetingLink || event.meetinglink || '#';

    container.innerHTML = `
        <div class="event-card featured-card animate-up">
            <div class="event-image">
                <img src="${imageUrl}" alt="${event.Title || 'Session'}">
            </div>
            <div class="event-content">
                <span class="badge">Next Session</span>
                <h2 class="topic-title">${topic}</h2>
                <div class="event-description">${description}</div>
                
                <div class="event-meta-grid">
                    <div class="meta-item">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-regular fa-clock"></i>
                        <span>${formattedTime}</span>
                    </div>
                </div>

                <div class="meeting-box mt-4">
                    <div class="meeting-details">
                        <p><strong>Meeting Code:</strong> <code>${meetingCode}</code></p>
                    </div>
                    <div class="d-flex gap-2 mt-2 flex-wrap">
                        <a href="${meetingLink}" class="btn btn-primary" target="_blank">
                            Join Meeting <i class="fa-solid fa-video ms-2"></i>
                        </a>
                        <a href="https://chat.whatsapp.com/CDC7gfHrYcrHq8VMxa0vLD" class="btn btn-whatsapp" target="_blank">
                            Business Tips Group <i class="fa-brands fa-whatsapp ms-2"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Section 2: Incoming Sessions List (Slider)
async function renderIncomingSessions() {
    const container = document.getElementById('incoming-sessions-list');
    if (!container) return;

    // Fetch all records from the dedicated 'Incomming_Event' table
    const events = await fetchAirtableData(AIRTABLE_CONFIG.tables.incommingSessions, {
        maxRecords: 100
    });

    if (events.length === 0) {
        container.closest('section').style.display = 'none';
        return;
    }

    container.innerHTML = events.map(event => {
        const imageUrl = getImageUrl(event);
        console.log(imageUrl);
        const title = event.Name || event.title || event.Topic || event.topic || 'Upcoming Session';
        return `
            <div class="swiper-slide">
                <div class="session-thumb-card no-animate">
                    <div class="thumb-img">
                        <img src="${imageUrl}" alt="${title}">
                    </div>
                    <h4>${title}</h4>
                </div>
            </div>
        `;
    }).join('');

    // Initialize Swiper after rendering slides
    new Swiper('.incoming-swiper', {
        grabCursor: true,
        centeredSlides: false,
        slidesPerView: 4,
        spaceBetween: 30,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            320: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 30 },
            1024: { slidesPerView: 4, spaceBetween: 30 }
        }
    });
}

/// Section 3: Past Session Videos (Combined Gallery)
async function renderPastVideos() {
    const container = document.getElementById('past-videos-gallery');
    if (!container) return;

    // Fetch records without a default sort to avoid "Unknown field" errors
    const videos = await fetchAirtableData(AIRTABLE_CONFIG.tables.videos);

    if (videos.length === 0) {
        container.innerHTML = '<p class="text-center w-100">No session recordings available yet.</p>';
        return;
    }

    container.innerHTML = videos.map(video => {
        // Use the new field names 'name' and 'video' as requested
        const videoTitle = video.name || video.Name || video.Title || video.title || 'Past Session';
        let videoUrl = video.video || video.Video || video.URL || video.url || '';

        // Handle Airtable Attachment (if user uploaded a file instead of a link)
        if (Array.isArray(videoUrl) && videoUrl.length > 0) {
            videoUrl = videoUrl[0].url;
        }

        if (!videoUrl || typeof videoUrl !== 'string') return '';

        // Robust YouTube Embed Formatter
        let embedUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
            embedUrl = videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
        } else if (videoUrl.includes('youtu.be/')) {
            embedUrl = videoUrl.replace('youtu.be/', 'youtube.com/embed/');
        } else if (videoUrl.includes('youtube.com/shorts/')) {
            embedUrl = videoUrl.replace('youtube.com/shorts/', 'youtube.com/embed/');
        }

        return `
            <div class="video-card animate-up" onclick="openVideoModal('${embedUrl}')">
                <div class="video-wrapper">
                    <div class="video-overlay"><i class="fa-solid fa-play"></i></div>
                    <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                </div>
                <div class="video-info">
                    <h3>${videoTitle}</h3>
                </div>
            </div>
        `;
    }).join('');
}

// Video Modal Logic
function openVideoModal(url) {
    let overlay = document.getElementById('video-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'video-modal-overlay';
        overlay.className = 'video-modal-overlay';
        overlay.innerHTML = `
            <div class="video-modal-content">
                <span class="close-video-modal" onclick="closeVideoModal()">&times;</span>
                <iframe id="modal-video-iframe" src="" allow="autoplay; fullscreen"></iframe>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeVideoModal();
        });
    }
    const iframe = document.getElementById('modal-video-iframe');
    iframe.src = url + (url.includes('?') ? '&' : '?') + "autoplay=1";
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const overlay = document.getElementById('video-modal-overlay');
    const iframe = document.getElementById('modal-video-iframe');
    if (overlay) {
        overlay.style.display = 'none';
        iframe.src = '';
        document.body.style.overflow = 'auto';
    }
}

// Initialize components for talkwithdhyan.html
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('featured-event-container')) {
        renderFeaturedEvent();
        renderIncomingSessions();
        renderPastVideos();
    }
});
