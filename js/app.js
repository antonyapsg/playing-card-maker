// Playing Card Maker JS
const suits = [
    { symbol: '♠', name: 'Spades' },
    { symbol: '♥', name: 'Hearts' },
    { symbol: '♦', name: 'Diamonds' },
    { symbol: '♣', name: 'Clubs' }
];
const numbers = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let cards = [];
let cardsId = null;
let cardsName = null;

// Initialize 52 empty cards
function initCards() {
    cards = [];
    for (let n = 0; n < numbers.length; n++) {
        for (let s = 0; s < suits.length; s++) {
            cards.push({
                suit: suits[s].symbol,
                number: numbers[n],
                bg: null
            });
        }
    }
    cardsId = null;
    cardsName = null;
}

// Render cards grid
function renderCards() {
    const $grid = $('#cardsGrid');
    $grid.empty();
    for (let n = 0; n < numbers.length; n++) {
        for (let s = 0; s < suits.length; s++) {
            const idx = n * suits.length + s;
            const card = cards[idx];
            const colorClass = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';

            const $col = $(`
                <div class="col">
                    <div class="card-cell" data-idx="${idx}">
                        <div class="card-corner top">
                            <span class="corner-number ${colorClass}">${card.number}</span>
                            <span class="corner-symbol ${colorClass}">${card.suit}</span>
                        </div>
                        <div class="card-corner bottom">
                            <span class="corner-number ${colorClass}">${card.number}</span>
                            <span class="corner-symbol ${colorClass}">${card.suit}</span>
                        </div>
                        ${card.bg ? `<img src="${card.bg}" class="card-bg" />` : ''}
                    </div>
                </div>
            `);
            $grid.append($col);
        }
    }
    $('#deckNameFooter').text(cardsName ? `Deck: ${cardsName}` : 'No deck loaded');
}

// Prompt modal utility
function promptInput(title, value, callback) {
    $('#promptModalLabel').text(title);
    $('#promptInput').val(value || '');
    $('#promptModal').modal('show');
    $('#promptOk').off('click').on('click', function() {
        $('#promptModal').modal('hide');
        callback($('#promptInput').val());
    });
}

// Card click: set background
$(document).on('click', '.card-cell', function() {
    const idx = $(this).data('idx');

    // Create a hidden file input
    const $fileInput = $('<input type="file" accept="image/*" style="display:none" />');
    $('body').append($fileInput);

    $fileInput.on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                // Store base64 string in bg property
                cards[idx].bg = ev.target.result; // Data URL (base64)
                renderCards();
            };
            reader.readAsDataURL(file);
        }
        $fileInput.remove();
    });

    $fileInput.click();
});

// File menu actions
$('#createNew').on('click', function() {
    if (confirm('Are you sure you want to create a new deck? This will reset all cards.')) {
        initCards();
        renderCards();
    }
});

$('#saveAsCards').on('click', function() {
    promptInput('Enter name for this deck:', cardsName, name => {
        if (name) {
            cardsName = name;
            cardsId = generateId();
            saveCards();
            alert('Saved as new deck!');
        }
    });
});

$('#saveCards').on('click', function() {
    if (!cardsId) {
        $('#saveAsCards').click();
    } else {
        saveCards();
        alert('Deck updated!');
    }
});

// IndexedDB helpers
function getDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('PlayingCardMakerDB', 1);
        req.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('decks')) {
                db.createObjectStore('decks', { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function saveDeckToDB(deck) {
    getDB().then(db => {
        const tx = db.transaction('decks', 'readwrite');
        tx.objectStore('decks').put(deck);
        tx.oncomplete = () => db.close();
    });
}

function getAllDecksFromDB() {
    return getDB().then(db => {
        return new Promise(resolve => {
            const tx = db.transaction('decks', 'readonly');
            const store = tx.objectStore('decks');
            const req = store.getAll();
            req.onsuccess = () => {
                db.close();
                resolve(req.result);
            };
        });
    });
}

function getDeckFromDB(id) {
    return getDB().then(db => {
        return new Promise(resolve => {
            const tx = db.transaction('decks', 'readonly');
            const store = tx.objectStore('decks');
            const req = store.get(id);
            req.onsuccess = () => {
                db.close();
                resolve(req.result);
            };
        });
    });
}

// Override saveCards to also save to IndexedDB
function saveCards() {
    try {
        const deck = {
            id: cardsId,
            name: cardsName,
            cards: cards
        };
        saveDeckToDB(deck);
    } catch (e) {
        alert('Failed to save deck: ' + e.message);
    }
}

// Load dialog
$('#loadCards').off('click').on('click', function() {
    getAllDecksFromDB().then(decks => {
        if (!decks.length) {
            alert('No saved decks found.');
            return;
        }
        // Build dialog
        let html = '<div class="list-group">';
        decks.forEach(deck => {
            html += `
                <div class="d-flex align-items-center list-group-item list-group-item-action" style="justify-content:space-between;">
                    <button type="button" class="btn btn-link p-0 deck-load-btn" data-id="${deck.id}" style="text-align:left;flex:1;">
                        ${deck.name || deck.id}
                    </button>
                    <button type="button" class="btn btn-sm btn-danger ms-2 deck-delete-btn" data-id="${deck.id}" title="Delete">
                        <span class="bi bi-trash"></span>
                        🗑️
                    </button>
                </div>
            `;
        });
        html += '</div>';
        $('#promptModalLabel').text('Select a deck to load');
        $('#promptInput').hide();
        $('#promptModal .modal-body').html(html);
        $('#promptModal').modal('show');

        // Load deck on name click
        $('.deck-load-btn').off('click').on('click', function() {
            const id = $(this).data('id');
            getDeckFromDB(id).then(deck => {
                if (deck && Array.isArray(deck.cards) && deck.cards.length === 52) {
                    cards = deck.cards;
                    cardsId = deck.id;
                    cardsName = deck.name;
                    renderCards();
                    $('#promptModal').modal('hide');
                } else {
                    alert('Invalid deck data.');
                }
            });
        });

        // Delete deck on trash click
        $('.deck-delete-btn').off('click').on('click', function(e) {
            e.stopPropagation();
            const id = $(this).data('id');
            if (confirm('Are you sure you want to delete this deck?')) {
                getDB().then(db => {
                    const tx = db.transaction('decks', 'readwrite');
                    tx.objectStore('decks').delete(id);
                    tx.oncomplete = () => {
                        db.close();
                        // Refresh dialog
                        $('#loadCards').click();
                    };
                });
            }
        });

        // Restore input after modal closes
        $('#promptModal').off('hidden.bs.modal').on('hidden.bs.modal', function() {
            $('#promptInput').show();
            $('#promptModal .modal-body').html('<input type="text" class="form-control" id="promptInput">');
        });
    });
});

$('#exportCards').on('click', function() {
    exportAllCardsAsOneImage();
});

// Generate unique ID
function generateId() {
    return 'deck_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// Export cards as images
function exportAllCardsAsOneImage() {
    const cardW = 744, cardH = 1040; // 63mm x 88mm at 300 DPI
    const cols = 4, rows = 13;
    const gap = 10; // gap between cards
    const canvas = document.createElement('canvas');
    canvas.width = cols * cardW + (cols + 2) * gap;
    canvas.height = rows * cardH + (rows + 2) * gap;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    let loadedCount = 0;
    const totalCards = cards.length;

    // Show progress modal
    $('#exportProgressModal').modal({backdrop: 'static', keyboard: false});
    updateExportProgress(0, totalCards);

    function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawCorner(ctx, number, symbol, x, y, rotate) {
        const color = (symbol === '♥' || symbol === '♦') ? '#e53935' : '#222';
        ctx.save();
        ctx.translate(x, y);
        if (rotate) ctx.rotate(Math.PI);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Font sizes proportional to card size
        const numberFontSize = Math.round(cardW * 0.12); 
        const symbolFontSize = Math.round(cardW * 0.2); 
        const outlineWidth = 2;

        // Number
        ctx.font = `bold ${numberFontSize}px Arial`;
        ctx.lineWidth = outlineWidth;
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = color;
        ctx.strokeText(number, 0.1 * cardW, 0.04 * cardH);
        ctx.fillText(number, 0.1 * cardW, 0.04 * cardH);

        // Symbol
        ctx.font = `bold ${symbolFontSize}px Arial`;
        ctx.lineWidth = outlineWidth;
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = color;
        ctx.strokeText(symbol, 0.1 * cardW, 0.1 * cardH);
        ctx.fillText(symbol, 0.1 * cardW, 0.1 * cardH);

        ctx.restore();
    }

    function drawCard(idx) {
        const n = Math.floor(idx / cols);
        const s = idx % cols;
        const card = cards[idx];
        const x = (s * cardW) + (s * gap) + gap;
        const y = (n * cardH) + (n * gap) + gap;

        // Draw rounded card background
        drawRoundedRect(ctx, x, y, cardW, cardH, 20, '#fff', '#000');

        function drawCardCorners() {
            drawCorner(ctx, card.number, card.suit, x, y, false);
            drawCorner(ctx, card.number, card.suit, x + cardW, y + cardH, true);

            loadedCount++;
            updateExportProgress(loadedCount, totalCards);
            if (loadedCount === totalCards) {
                saveBigImage(canvas);
            }
        }

        // Card image 
        if (card.bg) {
            const img = new window.Image();
            img.onload = function() {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x + 20, y);
                ctx.lineTo(x + cardW - 20, y);
                ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + 20);
                ctx.lineTo(x + cardW, y + cardH - 20);
                ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - 20, y + cardH);
                ctx.lineTo(x + 20, y + cardH);
                ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - 20);
                ctx.lineTo(x, y + 20);
                ctx.quadraticCurveTo(x, y, x + 20, y);
                ctx.closePath();
                ctx.clip();

                const scale = Math.max(cardW / img.naturalWidth, cardH / img.naturalHeight);
                const w = img.naturalWidth * scale;
                const h = img.naturalHeight * scale;
                const dx = x + (cardW - w) / 2;
                const dy = y + (cardH - h) / 2;
                ctx.drawImage(img, dx, dy, w, h);
                ctx.restore();

                // Draw corners after image
                drawCardCorners();
            };
            img.src = card.bg;

        } else {
            // Draw corners
            drawCardCorners();
        }
    }

    // Draw all cards synchronously (no need to wait for images)
    for (let idx = 0; idx < cards.length; idx++) {
        drawCard(idx);
    }
}

function saveBigImage(canvas) {
    $('#exportProgressModal').modal('hide');
    const link = document.createElement('a');
    link.download = 'playing_cards_grid.png';
    link.href = canvas.toDataURL('image/jpg', 0.9);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
}

function updateExportProgress(done, total) {
    const percent = Math.round((done / total) * 100);
    $('#exportProgressBar').css('width', percent + '%');
    $('#exportProgressText').text(`${done} / ${total}`);
}

// Initial load
$(function() {
    getAllDecksFromDB().then(decks => {
        if (decks.length) {
            // Sort by timestamp in ID (deck_<timestamp>_<random>)
            decks.sort((a, b) => {
                const ta = parseInt((a.id || '').split('_')[1] || '0', 10);
                const tb = parseInt((b.id || '').split('_')[1] || '0', 10);
                return tb - ta;
            });
            const latest = decks[0];
            if (latest && Array.isArray(latest.cards) && latest.cards.length === 52) {
                cards = latest.cards;
                cardsId = latest.id;
                cardsName = latest.name;
            } else {
                initCards();
            }
        } else {
            initCards();
        }
        renderCards();
    });
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
