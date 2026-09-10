const CRYPTO_MARKET = {
    BTC: { id: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 60000, change: 0, cap: "€1.2T", network: "Bitcoin Mainnet", icon: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
    ETH: { id: "ethereum", name: "Ethereum", symbol: "ETH", price: 3000, change: 0, cap: "€350B", network: "Ethereum Mainnet", icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
    BAT: { id: "basic-attention-token", name: "Basic Attention Token", symbol: "BAT", price: 0.20, change: 0, cap: "€300M", network: "Ethereum Mainnet", icon: "https://assets.coingecko.com/coins/images/677/small/basic-attention-token.png" },
    SOL: { id: "solana", name: "Solana", symbol: "SOL", price: 100, change: 0, cap: "€45B", network: "Solana + SVM", icon: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
    USDT: { id: "tether", name: "Tether", symbol: "USDT", price: 0.92, change: 0, cap: "€100B", network: "Ethereum Mainnet", icon: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
    XRP: { id: "ripple", name: "XRP", symbol: "XRP", price: 0.50, change: 0, cap: "€25B", network: "XRP Ledger", icon: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
    DOGE: { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", price: 0.14, change: 0, cap: "€20B", network: "Dogecoin Network", icon: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
    LINK: { id: "chainlink", name: "Chainlink", symbol: "LINK", price: 15.00, change: 0, cap: "€8B", network: "Ethereum Mainnet", icon: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
    MATIC: { id: "matic-network", name: "Polygon", symbol: "MATIC", price: 0.80, change: 0, cap: "€7B", network: "Polygon Mainnet", icon: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png" },
    AVAX: { id: "avalanche-2", name: "Avalanche", symbol: "AVAX", price: 40.00, change: 0, cap: "€15B", network: "Avalanche C-Chain", icon: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
    ADA: { id: "cardano", name: "Cardano", symbol: "ADA", price: 0.45, change: 0, cap: "€16B", network: "Cardano Network", icon: "https://assets.coingecko.com/coins/images/975/small/cardano.png" },
    DOT: { id: "polkadot", name: "Polkadot", symbol: "DOT", price: 6.50, change: 0, cap: "€9B", network: "Polkadot Relay Chain", icon: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png" },
    LTC: { id: "litecoin", name: "Litecoin", symbol: "LTC", price: 80.00, change: 0, cap: "€6B", network: "Litecoin Network", icon: "https://assets.coingecko.com/coins/images/2/small/litecoin.png" },
    TRX: { id: "tron", name: "TRON", symbol: "TRX", price: 0.12, change: 0, cap: "€11B", network: "TRON Network", icon: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png" },
    SHIB: { id: "shiba-inu", name: "Shiba Inu", symbol: "SHIB", price: 0.00002, change: 0, cap: "€12B", network: "Ethereum Mainnet", icon: "https://assets.coingecko.com/coins/images/11939/small/shiba.png" },
    TON: { id: "the-open-network", name: "Toncoin", symbol: "TON", price: 5.50, change: 0, cap: "€13B", network: "TON Network", icon: "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png" }
};

const priceHistory = {};
for (let sym in CRYPTO_MARKET) { priceHistory[sym] = [CRYPTO_MARKET[sym].price]; }

const SERVER_URL = 'https://crypto-sim1-1.onrender.com';
const APP_VERSION = '20260910-22';
const MINING_REWARD_EUR_PER_HOUR = 100;
const RIG_COST_USD = 100;
let currentUser = null;
let isMining = false;
let minerInterval = null;
let sessionMined = 0.0;
let currentDetailSym = null;
let targetMineCoin = 'BAT'; // Default target
let shouldResumeMining = false;
const previousAccountTotals = new Map();
const previousAccountBalances = new Map();

async function checkForAppUpdate() {
    try {
        const response = await fetch(`app-version.json?check=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const release = await response.json();
        if (release.version && release.version !== APP_VERSION) document.getElementById('update-banner').hidden = false;
    } catch (error) {
        console.debug('Update check unavailable');
    }
}

setInterval(checkForAppUpdate, 30000);
setTimeout(checkForAppUpdate, 3000);
document.getElementById('apply-update-btn').addEventListener('click', () => {
    window.location.href = `${window.location.pathname}?updated=${Date.now()}`;
});
function generateChartSVG(sym) {
    const history = priceHistory[sym];
    if (history.length < 2) return '';
    const min = Math.min(...history) * 0.99;
    const max = Math.max(...history) * 1.01;
    const range = max - min || 1;
    let path = `M 0 ${100 - ((history[0] - min) / range) * 100}`;
    for (let i = 1; i < history.length; i++) {
        path += ` L ${(i / (history.length - 1)) * 500} ${100 - ((history[i] - min) / range) * 100}`;
    }
    const color = history[history.length - 1] >= history[history.length - 2] ? '#10b981' : '#ef4444';
    const finalY = 100 - ((history[history.length - 1] - min) / range) * 100;
    return `<svg width="100%" height="100" viewBox="0 0 500 100" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="500" cy="${finalY}" r="5" fill="${color}"/></svg>`;
}

setInterval(() => {
    for (let sym in CRYPTO_MARKET) {
        if (sym === 'USDT') continue;
        const delta = (Math.random() * 0.3 - 0.15) / 100;
        CRYPTO_MARKET[sym].price += CRYPTO_MARKET[sym].price * delta;
        CRYPTO_MARKET[sym].change = delta * 100;
        priceHistory[sym].push(CRYPTO_MARKET[sym].price);
        if (priceHistory[sym].length > 15) priceHistory[sym].shift();
    }
    if (currentUser && document.getElementById('view-miner').style.display === 'block') updateMinerRate();
}, 3000);

document.getElementById('show-signup').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
});
document.getElementById('show-login').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});
document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    try {
        const res = await fetch(`${SERVER_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.toLowerCase(), password: pass }) });
        if (res.ok) unlockWallet(user, await res.json()); else alert('Wrong username or password!');
    } catch (err) { alert('Cannot connect to server. Is node server.js running?'); }
});
document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault(); 
    const user = document.getElementById('signup-username').value.trim();
    const pass = document.getElementById('signup-password').value.trim();
    try {
        const res = await fetch(`${SERVER_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.toLowerCase(), password: pass })
        });
        if (res.ok) {
            alert("Wallet created successfully!");
            unlockWallet(user, await res.json());
        } else alert(await res.text());
    } catch (err) { alert("Cannot connect to server. Is node server.js running?"); }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    stopMiner();
    currentUser = null;
    currentDetailSym = null;
    sessionStorage.removeItem('cryptosim-session');
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
});

document.getElementById('delete-account-btn').addEventListener('click', async () => {
    if(!confirm("Are you SURE you want to delete your account? All simulated crypto will be lost forever.")) return;
    try {
        const res = await fetch(`${SERVER_URL}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username })
        });
        if(res.ok) {
            alert("Account deleted permanently.");
            document.getElementById('logout-btn').click(); 
        } else alert(await res.text());
    } catch(e) { alert("Server error."); }
});

function unlockWallet(username, data) {
    currentUser = {
        username: String(username).trim().toLowerCase(),
        ...data,
        balances: { ...CRYPTO_MARKET_KEYS(), ...(data.balances || {}) },
        miners: Number(data.miners) > 0 ? Number(data.miners) : 1
    };
    persistSession();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    populateDropdowns();
    updateUI();
    void refreshCurrentUser();
}

function renderGifts() {
    const list = document.getElementById('gifts-list');
    if (!list) return;
    const gifts = currentUser?.gifts || [];
    list.innerHTML = gifts.length ? gifts.map(gift => `
        <article class="incoming-gift" data-gift-id="${gift.id}">
            <div class="gift-card-icon">🎁</div>
            <div>
                <h3>Gift from ${gift.sender}</h3>
                <p>${Number(gift.amount).toFixed(8)} ${gift.asset}</p>
            </div>
            <button type="button" class="btn-primary open-incoming-gift">Open Gift</button>
        </article>
    `).join('') : '<div class="form-panel center-text"><h2>No gifts yet</h2><p class="sub-text">Incoming gifts will appear here.</p></div>';
    list.querySelectorAll('.open-incoming-gift').forEach(button => {
        button.addEventListener('click', () => claimGift(button.closest('.incoming-gift')));
    });
}

async function claimGift(card) {
    const giftId = card.dataset.giftId;
    card.classList.add('gift-opening');
    const button = card.querySelector('button');
    button.disabled = true;
    button.innerText = 'Opening...';
    try {
        const response = await fetch(`${SERVER_URL}/gifts/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, giftId })
        });
        if (!response.ok) throw new Error(await response.text());
        const updatedUser = await response.json();
        currentUser = { ...currentUser, ...updatedUser, balances: { ...currentUser.balances, ...updatedUser.balances } };
        persistSession();
        button.innerText = 'Opened!';
        card.classList.add('gift-opened');
        setTimeout(() => { renderGifts(); updateUI(); }, 700);
    } catch (error) {
        card.classList.remove('gift-opening');
        button.disabled = false;
        button.innerText = 'Open Gift';
        alert(error.message || 'Could not open gift.');
    }
}

function loadProfileForm() {
    document.getElementById('profile-name').value = currentUser?.displayName || currentUser?.username || '';
    const preview = document.getElementById('profile-avatar-preview');
    preview.src = currentUser?.avatar || '';
    preview.style.display = currentUser?.avatar ? 'block' : 'none';
}

document.getElementById('profile-avatar-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const image = new Image();
        image.onload = () => {
            const size = 256;
            const scale = Math.min(size / image.width, size / image.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            document.getElementById('profile-avatar-preview').src = compressed;
            document.getElementById('profile-avatar-preview').dataset.value = compressed;
        };
        image.src = reader.result;
        document.getElementById('profile-avatar-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
});

document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const preview = document.getElementById('profile-avatar-preview');
    const response = await fetch(`${SERVER_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: currentUser.username,
            displayName: document.getElementById('profile-name').value,
            avatar: preview.dataset.value || currentUser.avatar || ''
        })
    });
    if (!response.ok) return alert(await response.text());
    currentUser = { ...currentUser, ...(await response.json()) };
    persistSession();
    alert('Profile saved.');
    loadClassmates();
});

try {
    const savedSession = JSON.parse(sessionStorage.getItem('cryptosim-session') || 'null');
    if (savedSession && savedSession.username && savedSession.address) {
        shouldResumeMining = savedSession.mining === true;
        unlockWallet(savedSession.username, savedSession);
    }
} catch (error) {
    sessionStorage.removeItem('cryptosim-session');
}

function CRYPTO_MARKET_KEYS() {
    return Object.fromEntries(Object.keys(CRYPTO_MARKET).map(sym => [sym, 0]));
}

function persistSession() {
    if (!currentUser) return;
    sessionStorage.setItem('cryptosim-session', JSON.stringify({
        username: currentUser.username,
        address: currentUser.address,
        balances: currentUser.balances,
        miners: currentUser.miners,
        mining: currentUser.mining === true,
        targetMineCoin
    }));
}

async function syncDB() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${SERVER_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, balances: currentUser.balances, miners: currentUser.miners, mining: currentUser.mining === true })
        });
        if (!res.ok) console.error('Could not save wallet:', await res.text());
    } catch (error) {
        console.error('Could not connect to wallet server:', error);
    }
}

async function refreshCurrentUser() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${SERVER_URL}/account/${encodeURIComponent(currentUser.username)}`);
        if (!res.ok) return;
        const serverUser = await res.json();
        currentUser = { ...currentUser, ...serverUser, balances: { ...currentUser.balances, ...serverUser.balances } };
        persistSession();
        updateUI();
        if (document.getElementById('view-gifts')?.style.display === 'block') renderGifts();
    } catch (error) {
        console.error('Could not refresh wallet:', error);
    }
}

window.switchTab = function(viewKey) {
    document.querySelectorAll('.view-section').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    document.getElementById(`view-${viewKey}`).style.display = 'block';
    
    if(viewKey !== 'asset-detail') currentDetailSym = null; 
    
    if(viewKey === 'miner') {
        document.getElementById('miner-count-display').innerText = currentUser.miners;
    }
    
    const link = document.querySelector(`[data-view="${viewKey}"]`);
    if(link) link.classList.add('active');
    if(viewKey === 'portfolio' || viewKey === 'explore') updateUI();
    if(viewKey === 'portfolio') void refreshCurrentUser();
    if(viewKey === 'send') {
        populateSendAssets();
        populateRecipients();
        updateSendAvailable();
    }
    if(viewKey === 'gifts') void refreshCurrentUser();
    if(viewKey === 'settings') loadProfileForm();
    if(viewKey === 'trading') renderTradingChart();
    document.body.classList.toggle('trading-active', viewKey === 'trading');
    if(viewKey === 'accounts') loadClassmates();
};
document.querySelectorAll('.nav-item[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(link.getAttribute('data-view'));
    });
});

function populateDropdowns() {
    const selects = [
        document.getElementById('swap-from-coin'), 
        document.getElementById('swap-to-coin'),
        document.getElementById('miner-target-coin'),
        document.getElementById('trading-market-select')
    ];
    selects.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = '';
        for (let sym in CRYPTO_MARKET) {
            sel.innerHTML += `<option value="${sym}">${sym} - ${CRYPTO_MARKET[sym].name}</option>`;
        }
    });
    updateRigCostLabel();
    populateSendAssets();
}

function populateSendAssets() {
    const select = document.getElementById('send-asset-select');
    if (!select || !currentUser) return;
    const available = Object.keys(CRYPTO_MARKET).filter(sym => (currentUser.balances[sym] || 0) > 0);
    select.innerHTML = available.length
        ? available.map(sym => `<option value="${sym}">${sym} - Available: ${(currentUser.balances[sym] || 0).toFixed(8)}</option>`).join('')
        : '<option value="" disabled selected>No crypto available</option>';
}

async function populateRecipients() {
    const select = document.getElementById('send-recipient');
    if (!select || !currentUser) return;
    try {
        const response = await fetch(`${SERVER_URL}/users`);
        const users = await response.json();
        const recipients = users.filter(user => user.username !== currentUser.username);
        select.innerHTML = recipients.length
            ? recipients.map(user => `<option value="${user.username}">${user.displayName || user.username} (@${user.username})</option>`).join('')
            : '<option value="" disabled selected>No other users yet</option>';
    } catch (error) {
        select.innerHTML = '<option value="" disabled selected>Could not load users</option>';
    }
}

function updateSendAvailable() {
    const select = document.getElementById('send-asset-select');
    const available = document.getElementById('send-available');
    if (!select || !available) return;
    const balance = currentUser?.balances[select.value] || 0;
    available.innerText = `Available: ${balance.toFixed(8)} ${select.value || ''}`;
}

window.openAssetDetail = function(sym) {
    currentDetailSym = sym;
    const coin = CRYPTO_MARKET[sym];
    const bal = currentUser.balances[sym] || 0;
    
    document.getElementById('detail-icon').src = coin.icon;
    document.getElementById('detail-name').innerText = coin.name;
    document.getElementById('detail-network').innerText = coin.network;
    document.getElementById('detail-price').innerText = "€" + coin.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    const changeEl = document.getElementById('detail-change');
    const isUp = coin.change >= 0;
    changeEl.innerText = (isUp ? "+" : "") + coin.change.toFixed(2) + "%";
    changeEl.className = isUp ? "trend-up" : "trend-down";
    document.getElementById('live-chart-container').innerHTML = generateChartSVG(sym);
    document.getElementById('detail-account-balance').innerHTML = `<h2 style="color: white; margin-bottom: 8px;">${bal.toFixed(4)} ${sym}</h2><p>Available balance on this network</p>`;
    switchTab('asset-detail');
}

function updateUI() {
    if (!currentUser) return;
    let totalFiat = 0;
    const portfolioVisible = getComputedStyle(document.getElementById('view-portfolio')).display !== 'none';
    const exploreVisible = getComputedStyle(document.getElementById('view-explore')).display !== 'none';
    const assetList = document.getElementById('portfolio-asset-list');
    if (portfolioVisible) assetList.innerHTML = '';

    for (let sym in CRYPTO_MARKET) {
        const coin = CRYPTO_MARKET[sym];
        const bal = currentUser.balances[sym] || 0;
        const val = bal * coin.price;
        totalFiat += val;
        
        if (portfolioVisible) assetList.innerHTML += `
            <div class="asset-row" data-search="${coin.name.toLowerCase()} ${sym.toLowerCase()}" onclick="openAssetDetail('${sym}')">
                <div class="ar-left">
                    <img src="${coin.icon}" class="ar-icon" onerror="this.src='https://assets.coingecko.com/coins/images/1/small/bitcoin.png'">
                    <div class="ar-info">
                        <h4>${coin.name}</h4>
                        <p>${coin.network}</p>
                    </div>
                </div>
                <div class="ar-right">
                    <div>
                        <h4>${bal.toFixed(4)} ${sym}</h4>
                        <p>€${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (portfolioVisible) {
        document.getElementById('portfolio-total').innerText = totalFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('get-started-text').innerText = totalFiat === 0 ? "Let's get started" : "Total balance across simulated networks";
    }

    const expTable = document.getElementById('explore-table-body');
    if (exploreVisible) expTable.innerHTML = '';
    for (let sym in CRYPTO_MARKET) {
        const coin = CRYPTO_MARKET[sym];
        const isUp = coin.change >= 0;
        if (exploreVisible) expTable.innerHTML += `
            <tr>
                <td>
                    <div class="ar-left" style="cursor:pointer;" onclick="openAssetDetail('${sym}')">
                        <img src="${coin.icon}" class="ar-icon" style="width:28px; height:28px;">
                        <div class="ar-info" style="line-height: 1.2;">
                            <h4 style="font-size: 0.9rem;">${coin.name}</h4>
                            <p style="font-size: 0.75rem;">${sym}</p>
                        </div>
                    </div>
                </td>
                <td>€${coin.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="${isUp ? 'trend-up' : 'trend-down'}">${isUp ? '▲' : '▼'} ${Math.abs(coin.change).toFixed(2)}%</td>
                <td><div class="market-chart">${generateChartSVG(sym)}</div></td>
                <td class="right-align trade-actions">
                    <button class="pill-btn" onclick="prepareTrade('${sym}', 'buy')">Buy</button>
                    <button class="pill-btn sell-btn" onclick="prepareTrade('${sym}', 'sell')">Sell</button>
                </td>
            </tr>
        `;
    }
}

function updatePortfolioSummary() {
    if (!currentUser || getComputedStyle(document.getElementById('view-portfolio')).display === 'none') return;
    const totalFiat = Object.keys(CRYPTO_MARKET).reduce((total, sym) =>
        total + (currentUser.balances[sym] || 0) * CRYPTO_MARKET[sym].price, 0
    );
    document.getElementById('portfolio-total').innerText = totalFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('get-started-text').innerText = totalFiat === 0 ? "Let's get started" : "Total balance across simulated networks";
}

document.getElementById('portfolio-search').addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll('#portfolio-asset-list .asset-row').forEach(row => {
        row.style.display = row.dataset.search.includes(query) ? '' : 'none';
    });
});

async function loadClassmates() {
    try {
        const res = await fetch(`${SERVER_URL}/users`);
        const allUsers = await res.json();
        const list = document.getElementById('accounts-list');
        list.innerHTML = '';
        allUsers.forEach(u => {
            let userTotal = 0;
            for (let sym in CRYPTO_MARKET) { userTotal += (u.balances[sym] || 0) * CRYPTO_MARKET[sym].price; }
            const isMe = u.username === currentUser.username ? "(You)" : "";
            const previousBalances = previousAccountBalances.get(u.username);
            const hasIncreased = previousBalances !== undefined && Object.keys(CRYPTO_MARKET).some(sym =>
                (u.balances[sym] || 0) > (previousBalances[sym] || 0)
            );
            previousAccountTotals.set(u.username, userTotal);
            previousAccountBalances.set(u.username, { ...u.balances });
            const miningClass = u.mining ? ' mining-active' : '';
            const avatar = u.avatar
                ? `<img class="acc-avatar" src="${u.avatar}" alt="">`
                : `<div class="acc-avatar avatar-initial">${(u.displayName || u.username).charAt(0).toUpperCase()}</div>`;
            list.innerHTML += `
                <div class="acc-card${hasIncreased && !isMe ? ' balance-rise' : ''}${miningClass}" style="margin-bottom: 12px;">
                    <div class="ar-left">
                        ${avatar}
                        <div class="ar-info">
                            <h4>${u.displayName || u.username} <span style="color:var(--accent-orange);">${isMe}</span></h4>
                            <p>@${u.username}</p>
                            <p>${u.address}</p>
                        </div>
                    </div>
                    <h4>€${userTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
                </div>
            `;
        });
    } catch(e) { console.log("Could not load users"); }
}

setInterval(() => {
    const accountsView = document.getElementById('view-accounts');
    if (currentUser && accountsView && accountsView.style.display === 'block') loadClassmates();
}, 5000);

function renderTradingChart() {
    const select = document.getElementById('trading-market-select');
    const chart = document.getElementById('trading-chart');
    const price = document.getElementById('trading-market-price');
    if (!select || !chart || !price) return;
    const sym = select.value || 'BTC';
    const coin = CRYPTO_MARKET[sym];
    chart.innerHTML = generateChartSVG(sym) || '<span class="sub-text">Collecting market data...</span>';
    const formattedPrice = `€${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    price.innerText = formattedPrice;
    document.getElementById('trading-order-price').innerText = formattedPrice;
}

window.prepareTrade = function(sym, side) {
    const tradeCoin = sym === 'USDT' ? 'BTC' : sym;
    const availableSource = Object.keys(CRYPTO_MARKET).find(source =>
        source !== tradeCoin && (currentUser.balances[source] || 0) > 0
    );
    const buySource = (currentUser.balances.USDT || 0) > 0 ? 'USDT' : availableSource;
    document.getElementById('trading-market-select').value = tradeCoin;
    renderTradingChart();
    document.getElementById('trade-buy-btn').classList.toggle('active', side === 'buy');
    document.getElementById('trade-sell-btn').classList.toggle('active', side === 'sell');
    swapFromCoin.value = side === 'buy' ? (buySource || 'USDT') : tradeCoin;
    swapToCoin.value = side === 'buy' ? tradeCoin : 'USDT';
    swapFromAmt.value = '';
    swapToAmt.value = '';
    updateTradeAvailable();
    switchTab('trading');
    swapFromAmt.focus();
};

// --- NEW MINER SYSTEM ---
const toggleMinerBtn = document.getElementById('toggle-miner-btn');
const buyMinerBtn = document.getElementById('buy-miner-btn');

function updateRigCostLabel() {
    const paymentCoin = document.getElementById('miner-target-coin');
    if (!buyMinerBtn || !paymentCoin) return;
    const coin = CRYPTO_MARKET[paymentCoin.value];
    const exactCost = RIG_COST_USD / coin.price;
    buyMinerBtn.innerText = `Buy Rig (${exactCost.toFixed(8)} ${paymentCoin.value})`;
}

document.getElementById('miner-target-coin').addEventListener('change', updateRigCostLabel);

buyMinerBtn.addEventListener('click', () => {
    const paymentCoin = document.getElementById('miner-target-coin').value;
    const exactCost = RIG_COST_USD / CRYPTO_MARKET[paymentCoin].price;
    const balance = currentUser.balances[paymentCoin] || 0;
    if (balance >= exactCost) {
        currentUser.balances[paymentCoin] -= exactCost;
        currentUser.miners += 1;
        syncDB();
        updateUI();
        document.getElementById('miner-count-display').innerText = currentUser.miners;
        alert(`Success! You paid ${exactCost.toFixed(8)} ${paymentCoin}. Total active rigs: ${currentUser.miners}`);
    } else {
        alert(`Not enough ${paymentCoin}. You need ${exactCost.toFixed(8)} ${paymentCoin} to buy a new rig.`);
    }
});

toggleMinerBtn.addEventListener('click', () => { if (!isMining) startMiner(); else stopMiner(); });

function startMiner() {
    if (!currentUser) return;
    isMining = true;
    targetMineCoin = currentUser.targetMineCoin || document.getElementById('miner-target-coin').value;
    document.getElementById('miner-target-coin').value = targetMineCoin;
    document.getElementById('miner-target-coin').disabled = true; // Lock dropdown while mining
    currentUser.mining = true;
    persistSession();
    void syncDB();
    updateMinerRate();
    
    toggleMinerBtn.innerText = `Stop Mining`;
    toggleMinerBtn.style.backgroundColor = "var(--border-color)";
    document.getElementById('miner-status').innerText = `Status: Mining ${targetMineCoin} 🟢`;
    
    // Clear the session amount when changing coins
    sessionMined = 0.0;
    
    minerInterval = setInterval(() => {
        const rigs = Number(currentUser.miners) > 0 ? Number(currentUser.miners) : 1;
        const minerVisible = document.getElementById('view-miner').style.display === 'block';
        if (minerVisible) {
            document.getElementById('miner-hashrate').innerHTML = `${(Math.random() * 20 + (40 * rigs)).toFixed(2)} <small>MH/s</small>`;
        }
        
        // Keep the simulated mining rate small and independent of market price.
        const coinPrice = CRYPTO_MARKET[targetMineCoin].price || 1;
        const reward = (MINING_REWARD_EUR_PER_HOUR / 3600 * rigs) / coinPrice;

        currentUser.balances[targetMineCoin] = (currentUser.balances[targetMineCoin] || 0) + reward;
        sessionMined += reward;
        
        if (minerVisible) {
            document.getElementById('session-mined-amount').innerText = sessionMined.toFixed(8) + " " + targetMineCoin;
        }
        updatePortfolioSummary();
        persistSession();
        void syncDB();
    }, 1000);
}

function updateMinerRate() {
    const rateElement = document.getElementById('miner-rate');
    const coin = CRYPTO_MARKET[targetMineCoin];
    if (!rateElement || !coin) return;
    const rigs = Number(currentUser?.miners) > 0 ? Number(currentUser.miners) : 1;
    const coinsPerHour = (MINING_REWARD_EUR_PER_HOUR * rigs) / coin.price;
    rateElement.innerText = `Estimated reward: ${coinsPerHour.toFixed(8)} ${targetMineCoin}/hour at €${coin.price.toFixed(2)}`;
}

function stopMiner() {
    isMining = false;
    clearInterval(minerInterval);
    if (currentUser) {
        currentUser.mining = false;
        persistSession();
        void syncDB();
    }
    toggleMinerBtn.innerText = "Start Miner";
    toggleMinerBtn.style.backgroundColor = "var(--accent-orange)";
    document.getElementById('miner-status').innerText = "Status: Offline";
    document.getElementById('miner-hashrate').innerHTML = `0.00 <small>MH/s</small>`;
    document.getElementById('miner-target-coin').disabled = false; // Unlock dropdown
}

if (shouldResumeMining) {
    switchTab('miner');
    startMiner();
    shouldResumeMining = false;
}

const sendAssetSelect = document.getElementById('send-asset-select');
const sendAmountInput = document.getElementById('send-amount');

sendAssetSelect.addEventListener('change', () => {
    sendAmountInput.value = '';
    updateSendAvailable();
});

function changeSendAmount(direction) {
    const balance = currentUser?.balances[sendAssetSelect.value] || 0;
    const step = Math.max(balance / 10, 0.00000001);
    const nextAmount = Math.max(0, Math.min(balance, (parseFloat(sendAmountInput.value) || 0) + direction * step));
    sendAmountInput.value = nextAmount ? nextAmount.toFixed(8) : '';
}

document.getElementById('send-minus').addEventListener('click', () => changeSendAmount(-1));
document.getElementById('send-plus').addEventListener('click', () => changeSendAmount(1));

// SEND & TRADING

document.getElementById('confirm-send-btn').addEventListener('click', () => {
    const asset = sendAssetSelect.value;
    const recipient = document.getElementById('send-recipient').value.trim();
    const amount = parseFloat(sendAmountInput.value);
    const available = currentUser?.balances[asset] || 0;
    if (!recipient || !asset || isNaN(amount) || amount <= 0 || amount > available) {
        alert(`Enter an amount up to ${available.toFixed(8)} ${asset || ''}.`);
        return;
    }
    void sendGift(recipient, asset, amount);
});

async function sendGift(recipient, asset, amount) {
    try {
        const res = await fetch(`${SERVER_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: currentUser.username, recipient: recipient.toLowerCase(), asset, amount })
        });
        if (res.ok) {
            const updatedUser = await res.json();
            currentUser = { ...currentUser, ...updatedUser, balances: { ...currentUser.balances, ...(updatedUser.balances || {}) } };
            updateUI(); alert("Gift sent. The recipient can open it from Gifts."); switchTab('portfolio');
            sendAmountInput.value = '';
            await populateSendAssets();
        } else alert(await res.text());
    } catch(e) { alert("Error connecting to server."); }
}

document.getElementById('trading-market-select').addEventListener('change', renderTradingChart);
document.getElementById('trade-buy-btn').addEventListener('click', () => prepareTrade(document.getElementById('trading-market-select').value, 'buy'));
document.getElementById('trade-sell-btn').addEventListener('click', () => prepareTrade(document.getElementById('trading-market-select').value, 'sell'));

const swapFromAmt = document.getElementById('swap-from-amount');
const swapToAmt = document.getElementById('swap-to-amount');
const swapFromCoin = document.getElementById('swap-from-coin');
const swapToCoin = document.getElementById('swap-to-coin');

function calcSwap() {
    const amt = parseFloat(swapFromAmt.value);
    if(!isNaN(amt) && amt > 0) {
        swapToAmt.value = ((amt * CRYPTO_MARKET[swapFromCoin.value].price) / CRYPTO_MARKET[swapToCoin.value].price).toFixed(6);
    } else swapToAmt.value = '';
}

function updateTradeAvailable() {
    const available = currentUser?.balances[swapFromCoin.value] || 0;
    const amount = parseFloat(swapFromAmt.value) || 0;
    document.getElementById('trade-available').innerText = `Available: ${available.toFixed(8)} ${swapFromCoin.value}`;
    swapFromAmt.max = available;
    if (amount > available) swapFromAmt.value = available.toFixed(8);
    calcSwap();
}

function changeTradeAmount(direction) {
    const available = currentUser?.balances[swapFromCoin.value] || 0;
    const step = Math.max(available / 10, 0.00000001);
    const nextAmount = Math.max(0, Math.min(available, (parseFloat(swapFromAmt.value) || 0) + direction * step));
    swapFromAmt.value = nextAmount ? nextAmount.toFixed(8) : '';
    calcSwap();
}

document.getElementById('trade-minus').addEventListener('click', () => changeTradeAmount(-1));
document.getElementById('trade-plus').addEventListener('click', () => changeTradeAmount(1));
swapFromAmt.addEventListener('input', calcSwap);
swapFromAmt.addEventListener('input', updateTradeAvailable);
swapFromCoin.addEventListener('change', updateTradeAvailable);
swapToCoin.addEventListener('change', calcSwap);

document.getElementById('confirm-swap-btn').addEventListener('click', () => {
    const from = swapFromCoin.value, to = swapToCoin.value, amt = parseFloat(swapFromAmt.value);
    const available = currentUser.balances[from] || 0;
    if (from === to) return alert("Choose two different assets to trade.");
    if (isNaN(amt) || amt <= 0) return alert(`Enter an amount of ${from} to trade.`);
    if (amt > available) return alert(`You only have ${available.toFixed(8)} ${from} available.`);
    currentUser.balances[from] -= amt;
    currentUser.balances[to] = (currentUser.balances[to] || 0) + parseFloat(swapToAmt.value);
    persistSession();
    syncDB(); updateUI(); alert("Trade completed!");
    swapFromAmt.value = ''; swapToAmt.value = '';
    switchTab('portfolio');
});
