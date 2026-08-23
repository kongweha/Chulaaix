// ==UserScript==
// @name         Gatekeeper (Chula AIX)
// @namespace    http://tampermonkey.net/
// @version      13.0
// @description  Chula AIX universal top bar + AI gatekeeper + auto-close registration + CSP-safe Facebook iframe + Robust AI Usage Tracker & Firebase Analytics Sync
// @author       Kongweha
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        window.close
// @noframes
// @connect      chula-aix-default-rtdb.asia-southeast1.firebasedatabase.app
// @connect      firebaseio.com
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @connect      www.facebook.com
// @connect      facebook.com
// ==/UserScript==

(function() {
    'use strict';

    var REGISTRATION_URL  = "https://kongweha.github.io/Chulaaix/registration/";
    var FB_PAGE           = "https://www.facebook.com/chulaaix";
    var DEAD_TIMEOUT      = 300000;         // 5 นาที (heartbeat timeout หากปิดทุกแท็บ)
    var IDLE_TIMEOUT_MS   = 15 * 60 * 1000; // 15 นาที Inactivity alert
    var COUNTDOWN_SECONDS = 60;              // 60 วินาที countdown ใน popup ก่อน auto-logout

    var KEY_STATUS        = "gf_unlock_status";
    var KEY_HEARTBEAT     = "gf_last_heartbeat";
    var KEY_LAST_ACTIVITY = "gf_last_user_activity";
    var KEY_CLOSE         = "gf_close_signal";
    var KEY_EMAIL         = "gf_user_email";
    var KEY_SESS_ID       = "aix_session_id";
    var KEY_SESS_ST       = "aix_session_start_time";
    var KEY_PENDING_LOGS  = "aix_pending_logs";

    // ═══════════════════════════════════════════════════════════════
    // FIREBASE & GITHUB CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    var FIREBASE_CONFIG = {
        enabled: true,
        databaseURL: "https://chula-aix-default-rtdb.asia-southeast1.firebasedatabase.app"
    };

    var GITHUB_CONFIG = {
        enabled: false,
        owner: "kongweha",
        repo: "Chulaaix",
        branch: "main",
        filePath: "data/usage_logs.json",
        token: ""
    };

    var CHAR_SRC = "data:image/webp;base64,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";
    var LOGO_SRC = "data:image/webp;base64,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";

    // ═══════════════════════════════════════════════════════════════
    // AI TOOLS / CHULA AIX DROP-DOWN MENU
    // ═══════════════════════════════════════════════════════════
    var TOOL_MENU = [
        {name:'ChatGPT', url:'https://chatgpt.com/', icon:'https://chatgpt.com/favicon.ico', gateHosts:['chatgpt.com','openai.com']},
        {name:'Claude', url:'https://claude.ai/', icon:'https://cdn.simpleicons.org/claude/D97757', gateHosts:['claude.ai']},
        {name:'Grammarly', url:'https://app.grammarly.com/', icon:'https://cdn.simpleicons.org/grammarly/15C39A', gateHosts:['grammarly.com']},
        {name:'Connected Papers', url:'https://www.connectedpapers.com/', icon:'https://www.connectedpapers.com/favicon.ico', gateHosts:['connectedpapers.com']},
        {name:'Runway', url:'https://app.runwayml.com/', icon:'https://app.runwayml.com/favicon.ico', gateHosts:['runwayml.com']},
        {name:'Consensus', url:'https://consensus.app/', icon:'https://consensus.app/favicon.ico', gateHosts:['consensus.app']},
        {name:'SciSpace', url:'https://scispace.com/', icon:'https://scispace.com/favicon.ico', gateHosts:['scispace.com']},
        {name:'Perplexity', url:'https://www.perplexity.ai/', icon:'https://www.perplexity.ai/favicon.ico', gateHosts:['perplexity.ai']},
        {name:'QuillBot', url:'https://quillbot.com/', icon:'https://quillbot.com/favicon.ico', gateHosts:['quillbot.com']},
        {name:'Gemini', url:'https://gemini.google.com/', icon:'https://gemini.google.com/favicon.ico', gateHosts:['gemini.google.com']}
    ];

    var LOGIN_HOSTS = [
        'accounts.google.com',
        'login.microsoftonline.com',
        'login.live.com',
        'account.live.com',
        'appleid.apple.com',
        'auth.openai.com',
        'auth0.openai.com'
    ];

    function hostMatches(curHost, domain) {
        curHost = (curHost || '').toLowerCase();
        domain  = (domain  || '').toLowerCase();
        return curHost === domain || curHost.endsWith('.' + domain);
    }

    var AI_TOOLS_MAP = {};
    var AI_TOOLS = [];
    TOOL_MENU.forEach(function(tool) {
        (tool.gateHosts || []).forEach(function(domain) {
            AI_TOOLS_MAP[domain] = tool.name;
            if (AI_TOOLS.indexOf(domain) === -1) AI_TOOLS.push(domain);
        });
    });

    var host   = window.location.hostname.toLowerCase();
    var href   = window.location.href;
    var isRegPage = href.includes('/registration') || href.includes('registration/index.html');

    function getCurrentToolName() {
        for (var domain in AI_TOOLS_MAP) {
            if (hostMatches(host, domain)) return AI_TOOLS_MAP[domain];
        }
        return null;
    }

    var currentTool = getCurrentToolName();
    var isAITool    = currentTool !== null;

    // ============================================================
    // ซ่อน Top Bar ใน iframe, Registration popup และ popup/login
    // ============================================================
    function shouldHideTopBar() {
        if (window.top !== window.self) return true;
        if (isRegPage || (window.name || '').toLowerCase() === 'gatekeeperform') return true;

        try {
            if (window.opener && !window.opener.closed) return true;
        } catch (e) {
            return true;
        }

        var winName = (window.name || '').toLowerCase();
        if (winName.includes('popup') || winName.includes('oauth') || winName.includes('signin') || winName.includes('login') || winName.includes('auth')) {
            return true;
        }

        if (LOGIN_HOSTS.some(function(d) { return hostMatches(host, d); })) return true;
        return false;
    }

    function checkAccess() {
        if (GM_getValue(KEY_STATUS, 'locked') !== 'active') return false;
        if (Date.now() - GM_getValue(KEY_HEARTBEAT, 0) > DEAD_TIMEOUT) {
            GM_setValue(KEY_STATUS, 'locked');
            return false;
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════
    // USER ACTIVITY TRACKER (FOR 15-MIN IDLE POPUP)
    // ═══════════════════════════════════════════════════════════
    function recordUserActivity() {
        var now = Date.now();
        GM_setValue(KEY_LAST_ACTIVITY, now);
        GM_setValue(KEY_HEARTBEAT, now);
    }

    if (isAITool) {
        ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function(evt) {
            window.addEventListener(evt, function() {
                if (checkAccess()) recordUserActivity();
            }, { passive: true });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // UTF-8 HELPER FUNCTIONS FOR GITHUB BASE64
    // ═══════════════════════════════════════════════════════════
    function utf8ToBase64(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            return btoa(str);
        }
    }

    function base64ToUtf8(b64) {
        try {
            return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
        } catch (e) {
            return atob(b64.replace(/\s/g, ''));
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MULTI-TAB AI USAGE TRACKER & GITHUB SYNC
    // ═══════════════════════════════════════════════════════════
    function runTracker() {
        if (!isAITool) return;

        setInterval(function() {
            if (!checkAccess()) return;
            var now = Date.now();

            if (!GM_getValue(KEY_SESS_ID, null)) {
                GM_setValue(KEY_SESS_ID, 'session_' + now + '_' + Math.random().toString(36).substring(2, 7));
                GM_setValue(KEY_SESS_ST, now);
                GM_setValue(KEY_LAST_ACTIVITY, now);
            }

            var keyTick = 'aix_tool_tick_' + currentTool;
            var keySec  = 'aix_tool_sec_' + currentTool;

            var lastTick = GM_getValue(keyTick, 0);
            var elapsed = now - lastTick;

            if (elapsed >= 2500) {
                var curSec = GM_getValue(keySec, 0);
                var addSec = (lastTick === 0 || elapsed > 10000) ? 3 : Math.round(elapsed / 1000);
                GM_setValue(keySec, curSec + addSec);
                GM_setValue(keyTick, now);
            }
        }, 3000);
    }

    // Push pending logs queue to GitHub with retry mechanism
    function syncPendingLogsToGitHub(retryCount) {
        retryCount = retryCount || 0;
        if (!GITHUB_CONFIG.enabled || !GITHUB_CONFIG.token) return;

        var pendingLogs = GM_getValue(KEY_PENDING_LOGS, []);
        if (!Array.isArray(pendingLogs) || pendingLogs.length === 0) return;

        var url = 'https://api.github.com/repos/' + GITHUB_CONFIG.owner + '/' + GITHUB_CONFIG.repo + '/contents/' + GITHUB_CONFIG.filePath;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': 'token ' + GITHUB_CONFIG.token,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Chula-AIX-Tracker'
            },
            onload: function(res) {
                var currentLogs = [];
                var sha = null;

                if (res.status === 200) {
                    try {
                        var fileData = JSON.parse(res.responseText);
                        sha = fileData.sha;
                        var contentStr = base64ToUtf8(fileData.content);
                        currentLogs = JSON.parse(contentStr);
                        if (!Array.isArray(currentLogs)) currentLogs = [];
                    } catch (e) {
                        currentLogs = [];
                    }
                }

                // Append all pending logs avoiding duplicates by sessionId
                var existingSessionIds = {};
                currentLogs.forEach(function(l) { if (l && l.sessionId) existingSessionIds[l.sessionId] = true; });

                var addedCount = 0;
                pendingLogs.forEach(function(pLog) {
                    if (pLog && pLog.sessionId && !existingSessionIds[pLog.sessionId]) {
                        currentLogs.push(pLog);
                        existingSessionIds[pLog.sessionId] = true;
                        addedCount++;
                    }
                });

                var b64Content = utf8ToBase64(JSON.stringify(currentLogs, null, 2));
                var commitBody = {
                    message: 'Sync ' + addedCount + ' session(s) from Chula AIX (' + new Date().toLocaleTimeString('th-TH') + ')',
                    content: b64Content,
                    branch: GITHUB_CONFIG.branch
                };
                if (sha) commitBody.sha = sha;

                GM_xmlhttpRequest({
                    method: 'PUT',
                    url: url,
                    headers: {
                        'Authorization': 'token ' + GITHUB_CONFIG.token,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'Chula-AIX-Tracker'
                    },
                    data: JSON.stringify(commitBody),
                    onload: function(putRes) {
                        if (putRes.status === 200 || putRes.status === 201) {
                            console.log('✅ [Chula AIX] Synced ' + addedCount + ' session(s) to GitHub successfully!');
                            GM_setValue(KEY_PENDING_LOGS, []); // Clear queue
                        } else if (putRes.status === 409 && retryCount < 3) {
                            console.warn('⚠️ [Chula AIX] SHA conflict, retrying sync (' + (retryCount + 1) + ')...');
                            setTimeout(function() { syncPendingLogsToGitHub(retryCount + 1); }, 1500);
                        } else {
                            console.error('❌ [Chula AIX] Failed to push logs to GitHub:', putRes.status, putRes.responseText);
                        }
                    },
                    onerror: function(err) {
                        console.error('❌ [Chula AIX] Network error pushing logs to GitHub:', err);
                    }
                });
            },
            onerror: function(err) {
                console.error('❌ [Chula AIX] Network error fetching logs from GitHub:', err);
            }
        });
    }

    function finalizeAndSync() {
        var sessId = GM_getValue(KEY_SESS_ID, null);
        var stTime = GM_getValue(KEY_SESS_ST, null);
        var email  = GM_getValue(KEY_EMAIL, 'Anonymous');

        if (!sessId || !stTime) {
            syncPendingLogsToGitHub();
            return;
        }

        var now = Date.now();
        var totalSec = Math.max(1, Math.round((now - stTime) / 1000));

        var toolsUsage = {};
        var activeSum = 0;

        for (var d in AI_TOOLS_MAP) {
            var tName = AI_TOOLS_MAP[d];
            var keySec = 'aix_tool_sec_' + tName;
            var sec = GM_getValue(keySec, 0);
            if (sec > 0) {
                toolsUsage[tName] = sec;
                activeSum += sec;
                GM_setValue(keySec, 0);
                GM_setValue('aix_tool_tick_' + tName, 0);
            }
        }

        var logData = {
            sessionId: sessId,
            email: email,
            startTime: new Date(stTime).toISOString(),
            endTime: new Date(now).toISOString(),
            totalSessionSeconds: totalSec,
            activeToolsTotalSeconds: activeSum,
            tools: toolsUsage,
            createdAt: new Date().toISOString()
        };

        console.log('[Chula AIX] Finalizing Session:', logData);

        // Reset current session
        GM_setValue(KEY_SESS_ID, null);
        GM_setValue(KEY_SESS_ST, null);

        // Add to persistent pending queue
        var pendingLogs = GM_getValue(KEY_PENDING_LOGS, []);
        if (!Array.isArray(pendingLogs)) pendingLogs = [];
        pendingLogs.push(logData);
        GM_setValue(KEY_PENDING_LOGS, pendingLogs);

        // Trigger sync to Firebase Realtime Database
        if (FIREBASE_CONFIG.enabled && FIREBASE_CONFIG.databaseURL) {
            GM_xmlhttpRequest({
                method: 'POST',
                url: FIREBASE_CONFIG.databaseURL + '/usage_logs.json',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(logData),
                onload: function(res) {
                    if (res.status === 200 || res.status === 201) {
                        console.log('✅ [Chula AIX] Log pushed to Firebase Realtime DB successfully!');
                        var curLogs = GM_getValue(KEY_PENDING_LOGS, []);
                        curLogs = curLogs.filter(function(l) { return l.sessionId !== logData.sessionId; });
                        GM_setValue(KEY_PENDING_LOGS, curLogs);
                    }
                }
            });
        }

        // Secondary backup sync to GitHub
        syncPendingLogsToGitHub();
    }

    // ═══════════════════════════════════════════════════════════
    // 15-MIN INACTIVITY WARNING POPUP (ENGLISH MODAL)
    // ═══════════════════════════════════════════════════════════
    var countdownTimer = null;

    function showInactivityModal() {
        if (document.getElementById('gf-idle-modal') || shouldHideTopBar()) return;

        var backdrop = document.createElement('div');
        backdrop.id = 'gf-idle-modal';
        Object.assign(backdrop.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            zIndex: '2147483647', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Segoe UI', Arial, sans-serif", padding: '20px', boxSizing: 'border-box'
        });

        var modal = document.createElement('div');
        Object.assign(modal.style, {
            backgroundColor: '#ffffff', width: '100%', maxWidth: '440px',
            borderRadius: '20px', padding: '32px 28px', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', borderTop: '6px solid #7b2fa0',
            boxSizing: 'border-box'
        });

        var iconWrap = document.createElement('div');
        iconWrap.style.cssText = 'width:64px;height:64px;background:#f5e8fb;color:#7b2fa0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;';
        iconWrap.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7b2fa0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

        var title = document.createElement('h3');
        title.textContent = 'Session Inactivity Warning';
        title.style.cssText = 'font-size:20px;font-weight:800;color:#1e293b;margin:0 0 8px;';

        var desc = document.createElement('p');
        desc.innerHTML = 'You have been inactive on AI tools for <strong>15 minutes</strong>.<br>Would you like to continue your session or log out?';
        desc.style.cssText = 'font-size:14px;color:#64748b;line-height:1.6;margin:0 0 20px;';

        var timerBadge = document.createElement('div');
        timerBadge.id = 'gf-countdown-badge';
        timerBadge.style.cssText = 'display:inline-block;background:#fef2f2;color:#dc2626;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:24px;border:1px solid #fecaca;';
        timerBadge.textContent = 'Auto log out in ' + COUNTDOWN_SECONDS + 's';

        var btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display:flex;gap:12px;';

        var btnLogout = document.createElement('button');
        btnLogout.textContent = 'Log Out';
        btnLogout.style.cssText = 'flex:1;padding:12px 0;background:#fff;border:1.5px solid #ef4444;color:#ef4444;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;';
        btnLogout.onmouseover = function() { btnLogout.style.background = '#fef2f2'; };
        btnLogout.onmouseout  = function() { btnLogout.style.background = '#fff'; };
        btnLogout.onclick = function() {
            closeInactivityModal();
            finalizeAndSync();
            GM_setValue(KEY_STATUS, 'locked');
            GM_setValue(KEY_HEARTBEAT, 0);
            removeTopBar();
            if (isAITool) showOverlay();
        };

        var btnContinue = document.createElement('button');
        btnContinue.textContent = 'Continue Session';
        btnContinue.style.cssText = 'flex:1.5;padding:12px 0;background:linear-gradient(to right,#ae5be0,#7b2fa0);border:none;color:#fff;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(123,47,160,0.35);transition:all 0.2s;';
        btnContinue.onmouseover = function() { btnContinue.style.opacity = '0.9'; };
        btnContinue.onmouseout  = function() { btnContinue.style.opacity = '1'; };
        btnContinue.onclick = function() {
            closeInactivityModal();
            recordUserActivity();
        };

        btnGroup.appendChild(btnLogout);
        btnGroup.appendChild(btnContinue);

        modal.appendChild(iconWrap);
        modal.appendChild(title);
        modal.appendChild(desc);
        modal.appendChild(timerBadge);
        modal.appendChild(btnGroup);
        backdrop.appendChild(modal);
        document.documentElement.appendChild(backdrop);

        var remaining = COUNTDOWN_SECONDS;
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = setInterval(function() {
            remaining--;
            var b = document.getElementById('gf-countdown-badge');
            if (b) b.textContent = 'Auto log out in ' + remaining + 's';

            if (remaining <= 0) {
                clearInterval(countdownTimer);
                closeInactivityModal();
                finalizeAndSync();
                GM_setValue(KEY_STATUS, 'locked');
                GM_setValue(KEY_HEARTBEAT, 0);
                removeTopBar();
                if (isAITool) showOverlay();
            }
        }, 1000);
    }

    function closeInactivityModal() {
        var m = document.getElementById('gf-idle-modal');
        if (m) m.remove();
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    }

    // ═══════════════════════════════════════════════════════════
    // SECTION 1 — Custom Registration Web Page Hook
    // ═══════════════════════════════════════════════════════════
    if (isRegPage) {

        setInterval(function() {
            var unlock = localStorage.getItem('gf_unlock_status');
            var email = localStorage.getItem('gf_user_email');
            if (unlock === 'active' && email) {
                // Consume token immediately so it cannot trigger again on future page opens
                localStorage.removeItem('gf_unlock_status');

                var now = Date.now();
                GM_setValue(KEY_STATUS, 'active');
                GM_setValue(KEY_EMAIL, email);
                GM_setValue(KEY_HEARTBEAT, now);
                GM_setValue(KEY_LAST_ACTIVITY, now);
                GM_setValue(KEY_SESS_ID, 'session_' + now + '_' + Math.random().toString(36).substring(2, 7));
                GM_setValue(KEY_SESS_ST, now);
                GM_setValue(KEY_CLOSE, true);
            }
        }, 500);

    } else {

        var popupWin = null;

        // ── Top Bar ──────────────────────────────────────────────
        function buildToolMenu(brandButton) {
            var existing = document.getElementById('gf-tool-menu');
            if (existing) { existing.remove(); return; }

            var menu = document.createElement('div');
            menu.id = 'gf-tool-menu';
            Object.assign(menu.style, {
                position:'fixed',top:'50px',left:'14px',width:'330px',
                maxHeight:'70vh',overflowY:'auto',background:'white',borderRadius:'12px',padding:'8px',
                boxSizing:'border-box',boxShadow:'0 10px 30px rgba(0,0,0,0.28)',zIndex:'2147483647',
                fontFamily:"'Segoe UI',Arial,sans-serif",border:'1px solid rgba(0,0,0,0.08)'
            });

            var title = document.createElement('div');
            title.textContent = 'AI Tools';
            Object.assign(title.style, { fontSize:'12px', fontWeight:'700', color:'#777', padding:'8px 10px 6px' });
            menu.appendChild(title);

            TOOL_MENU.forEach(function(tool) {
                var item = document.createElement('button');
                Object.assign(item.style, {
                    width:'100%',display:'flex',alignItems:'center',gap:'10px',
                    border:'none',background:'transparent',padding:'9px 10px',borderRadius:'8px',
                    cursor:'pointer',textAlign:'left',color:'#222',fontSize:'14px'
                });

                var img = document.createElement('img');
                img.src = tool.icon;
                img.alt = '';
                img.width = 24; img.height = 24;
                img.decoding = 'async';
                Object.assign(img.style, { width:'24px', height:'24px', objectFit:'contain', borderRadius:'5px', flexShrink:'0' });
                img.onerror = function() { this.style.display = 'none'; };

                var label = document.createElement('span');
                label.textContent = tool.name;
                item.appendChild(img); item.appendChild(label);
                item.onmouseover = function() { item.style.background = '#f5ecfa'; };
                item.onmouseout  = function() { item.style.background = 'transparent'; };
                item.onclick = function() { window.location.href = tool.url; };
                menu.appendChild(item);
            });

            document.documentElement.appendChild(menu);

            setTimeout(function() {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && !brandButton.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu, true);
                    }
                }, true);
            }, 0);
        }

        function showTopBar() {
            if (!checkAccess() || shouldHideTopBar()) return;
            if (document.getElementById('gf-topbar')) return;
            var email = GM_getValue(KEY_EMAIL, 'Registered User');
            var bar = document.createElement('div');
            bar.id = 'gf-topbar';
            Object.assign(bar.style, {
                position:'fixed',top:'0',left:'0',width:'100%',height:'44px',
                background:'linear-gradient(to right,#b04fd4,#7b2fa0)',zIndex:'2147483647',
                display:'flex',alignItems:'center',padding:'0 20px',boxSizing:'border-box',
                boxShadow:'0 2px 8px rgba(0,0,0,0.25)',fontFamily:"'Segoe UI',Arial,sans-serif"
            });

            var brand = document.createElement('button');
            brand.type = 'button';
            brand.title = 'เลือก AI Tool';
            brand.style.cssText = 'display:flex;align-items:center;gap:8px;color:white;font-weight:700;font-size:15px;flex-shrink:0;background:transparent;border:none;cursor:pointer;padding:7px 10px;border-radius:8px;';
            brand.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg><span>Chula AIX</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
            brand.onmouseover = function() { brand.style.background = 'rgba(255,255,255,0.12)'; };
            brand.onmouseout  = function() { brand.style.background = 'transparent'; };
            brand.onclick = function(e) { e.stopPropagation(); buildToolMenu(brand); };

            var mid = document.createElement('div');
            mid.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;';
            mid.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
            var es = document.createElement('span');
            es.textContent = email;
            es.style.cssText = 'color:rgba(255,255,255,0.92);font-size:14px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            mid.appendChild(es);

            var lbtn = document.createElement('button');
            lbtn.style.cssText = 'background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:6px;flex-shrink:0;';
            lbtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span style="color:#ff9999;font-size:13px;font-weight:600;">Logout</span>';
            lbtn.onmouseover = function() { lbtn.style.background = 'rgba(255,255,255,0.12)'; };
            lbtn.onmouseout  = function() { lbtn.style.background = 'none'; };
            lbtn.onclick = function() {
                closeInactivityModal();
                finalizeAndSync();
                GM_setValue(KEY_STATUS, 'locked');
                GM_setValue(KEY_EMAIL, '');
                GM_setValue(KEY_HEARTBEAT, 0);
                removeTopBar();
                if (isAITool) showOverlay();
            };

            bar.appendChild(brand); bar.appendChild(mid); bar.appendChild(lbtn);
            document.documentElement.appendChild(bar);

            if (document.body && !document.body.hasAttribute('data-gf-padding-applied')) {
                document.body.setAttribute('data-gf-padding-applied', '1');
                document.body.setAttribute('data-gf-original-padding-top', document.body.style.paddingTop || '');
                var computedPadding = parseFloat(window.getComputedStyle(document.body).paddingTop) || 0;
                document.body.style.paddingTop = (computedPadding + 44) + 'px';
            }
        }

        function removeTopBar() {
            var b = document.getElementById('gf-topbar'); if (b) b.remove();
            var m = document.getElementById('gf-tool-menu'); if (m) m.remove();
            if (document.body && document.body.hasAttribute('data-gf-padding-applied')) {
                var oldPadding = document.body.getAttribute('data-gf-original-padding-top') || '';
                document.body.style.paddingTop = oldPadding;
                document.body.removeAttribute('data-gf-padding-applied');
                document.body.removeAttribute('data-gf-original-padding-top');
            }
        }

        // ── Overlay (Facebook Iframe: Gate 2 Structure + CSP Safe) ──
        function buildFBCard(container) {
            var fbFrame = document.createElement('iframe');
            var fbSrc = 'https://www.facebook.com/plugins/page.php' +
                '?href=' + encodeURIComponent(FB_PAGE) +
                '&tabs=timeline&width=500&height=300' +
                '&small_header=true&adapt_container_width=false' +
                '&hide_cover=true&show_facepile=false';

            fbFrame.loading = 'lazy';
            Object.assign(fbFrame.style, {
                width:'500px',height:'300px',maxWidth:'100%',border:'none',
                borderRadius:'12px',overflow:'hidden',display:'block',
                background:'white',boxShadow:'0 8px 24px rgba(0,0,0,0.18)'
            });
            fbFrame.setAttribute('scrolling', 'no');
            fbFrame.setAttribute('frameborder', '0');
            fbFrame.setAttribute('allowfullscreen', 'true');
            fbFrame.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');

            // Detect sites with restrictive CSP (Claude, ChatGPT, Runway)
            var CSP_BLOCKED = ['chatgpt.com', 'openai.com', 'claude.ai', 'runwayml.com'];
            var isBlocked = CSP_BLOCKED.some(function(d){ return hostMatches(host, d); });

            if (isBlocked) {
                // Fetch real Facebook plugin HTML via GM_xmlhttpRequest to bypass page CSP
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: fbSrc,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    onload: function(response) {
                        if (response.status === 200 && response.responseText) {
                            fbFrame.srcdoc = response.responseText;
                        } else {
                            fbFrame.src = fbSrc;
                        }
                    },
                    onerror: function() {
                        fbFrame.src = fbSrc;
                    }
                });
            } else {
                fbFrame.src = fbSrc;
            }

            // Fallback link below
            var link = document.createElement('a');
            link.href = FB_PAGE;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = '📄 ดูโพสต์ทั้งหมดบน Facebook';
            Object.assign(link.style, {
                display:'block',marginTop:'8px',color:'rgba(255,255,255,0.92)',
                fontSize:'12px',textDecoration:'none',textAlign:'center'
            });

            container.appendChild(fbFrame);
            container.appendChild(link);
        }

        function showOverlay() {
            if (!isAITool || shouldHideTopBar() || document.getElementById('gf-overlay')) return;

            var ov = document.createElement('div');
            ov.id = 'gf-overlay';
            Object.assign(ov.style, {
                position:'fixed',top:'0',left:'0',width:'100vw',height:'100vh',
                zIndex:'2147483646',display:'flex',flexDirection:'row',
                fontFamily:"'Segoe UI',Arial,sans-serif",overflow:'hidden'
            });

            // ── LEFT: Purple Gradient ──
            var left = document.createElement('div');
            Object.assign(left.style, {
                flex:'1.4',width:'60%',height:'100%',position:'relative',
                background:'linear-gradient(145deg,#c060e0 0%,#8b28b8 50%,#6a1fa0 100%)',
                overflow:'hidden',display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'space-between',boxSizing:'border-box'
            });

            // Logo: top center
            var logoWrap = document.createElement('div');
            logoWrap.style.cssText = 'width:100%;display:flex;justify-content:center;padding:clamp(16px, 3vh, 32px) 0 4px;flex-shrink:0;';
            var logoImg = document.createElement('img');
            logoImg.src = LOGO_SRC;
            logoImg.decoding = 'async';
            logoImg.style.cssText = 'width:clamp(280px, 18vw, 380px);max-width:85%;object-fit:contain;';
            logoWrap.appendChild(logoImg);
            left.appendChild(logoWrap);

            // Content row: FB card (left) + Character (right)
            var contentRow = document.createElement('div');
            Object.assign(contentRow.style, {
                flex:'1',width:'100%',display:'flex',
                alignItems:'flex-end',justifyContent:'center',margin:'0 auto',
                padding:'0 24px',boxSizing:'border-box',
                gap:'24px',height:'calc(100% - 65px)'
            });

            // FB Card container (bottom-left)
            var fbWrap = document.createElement('div');
            Object.assign(fbWrap.style, {
                width:'500px',maxWidth:'100%',flexShrink:'0',
                display:'flex',flexDirection:'column',alignItems:'flex-start',
                paddingBottom:'16px'
            });
            buildFBCard(fbWrap);

            // Character container (bottom-right) with height 120% and minHeight 560px
            var charWrap = document.createElement('div');
            Object.assign(charWrap.style, {
                flex:'1',display:'flex',alignItems:'flex-end',
                justifyContent:'center',height:'100%',minHeight:'560px',overflow:'hidden'
            });
            var charImg = document.createElement('img');
            charImg.src = CHAR_SRC;
            charImg.decoding = 'async';
            Object.assign(charImg.style, {
                height:'120%',maxHeight:'120%',minHeight:'560px',maxWidth:'100%',
                objectFit:'contain',objectPosition:'bottom center',
                display:'block'
            });
            charWrap.appendChild(charImg);

            contentRow.appendChild(fbWrap);
            contentRow.appendChild(charWrap);
            left.appendChild(contentRow);

            // ── RIGHT: Clean White Registration Panel (Base Min Scale + Fluid Scale Up) ──
            var right = document.createElement('div');
            Object.assign(right.style, {
                flex:'1',width:'clamp(380px, 35vw, 750px)',height:'100%',background:'white',
                display:'flex',flexDirection:'column',justifyContent:'center',
                alignItems:'center',padding:'clamp(32px, 5vw, 64px) clamp(24px, 3vw, 48px)',
                boxSizing:'border-box',textAlign:'center'
            });

            var title = document.createElement('div');
            title.innerHTML = 'WELCOME<br>TO CHULA AIX';
            Object.assign(title.style, {
                color:'#9b3db8',fontSize:'clamp(32px, 2.5vw, 56px)',fontWeight:'900',
                letterSpacing:'clamp(2.5px, 0.25vw, 5px)',lineHeight:'1.22',marginBottom:'clamp(18px, 2.2vh, 36px)',
                textTransform:'uppercase'
            });

            var sub = document.createElement('p');
            sub.innerHTML = 'Please register to start<br>using AI tools';
            Object.assign(sub.style, {
                color:'#666',fontSize:'clamp(15px, 1.2vw, 24px)',
                lineHeight:'1.6',margin:'0 0 clamp(28px, 3.5vh, 52px) 0'
            });

            var btn = document.createElement('button');
            btn.textContent = 'REGISTER HERE';
            Object.assign(btn.style, {
                background:'linear-gradient(to right,#b04fd4,#7b2fa0)',
                color:'white',border:'none',borderRadius:'9999px',
                padding:'clamp(16px, 1.8vh, 26px) 0',fontSize:'clamp(15px, 1.1vw, 22px)',fontWeight:'900',
                letterSpacing:'2px',cursor:'pointer',textTransform:'uppercase',
                boxShadow:'0 clamp(4px, 0.8vh, 12px) clamp(18px, 2vh, 36px) rgba(123,47,160,0.4)',
                width:'100%',maxWidth:'clamp(260px, 18vw, 400px)'
            });
            var popupWin = null;
            function openRegistrationPopup() {
                var w = 680, h = 840;
                var left = (window.screen.width / 2) - (w / 2);
                var top = (window.screen.height / 2) - (h / 2);
                var targetUrl = REGISTRATION_URL + (REGISTRATION_URL.indexOf('?') === -1 ? '?' : '&') + 'v=' + Date.now();
                popupWin = window.open(
                    targetUrl,
                    'ChulaAIX_Register',
                    'popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=' + w + ',height=' + h + ',top=' + top + ',left=' + left
                );
                if (popupWin && popupWin.focus) popupWin.focus();
            }

            btn.onclick = function() {
                openRegistrationPopup();
            };

            right.appendChild(title); right.appendChild(sub); right.appendChild(btn);
            ov.appendChild(left); ov.appendChild(right);
            document.documentElement.appendChild(ov);
            if (document.body) document.body.style.overflow = 'hidden';
        }

        function hideOverlay() {
            var e = document.getElementById('gf-overlay');
            if (e) { e.remove(); if (document.body) document.body.style.overflow = 'auto'; }
        }

        window.addEventListener('message', function(e) {
            if (e.data && (e.data.type === 'AIX_UNLOCKED' || e.data.type === 'AIX_CLOSE_MODAL')) {
                if (popupWin && !popupWin.closed) popupWin.close();
                if (e.data.email) {
                    var now = Date.now();
                    GM_setValue(KEY_STATUS, 'active');
                    GM_setValue(KEY_EMAIL, e.data.email);
                    GM_setValue(KEY_HEARTBEAT, now);
                    GM_setValue(KEY_LAST_ACTIVITY, now);
                    var sessId = 'session_' + now + '_' + Math.random().toString(36).substring(2, 7);
                    GM_setValue(KEY_SESS_ID, sessId);
                    GM_setValue(KEY_SESS_ST, now);

                    // Push initial live log to Firebase Realtime Database
                    if (FIREBASE_CONFIG.enabled && FIREBASE_CONFIG.databaseURL) {
                        var initToolObj = {};
                        initToolObj[currentTool] = 1;
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: FIREBASE_CONFIG.databaseURL + '/usage_logs.json',
                            headers: { 'Content-Type': 'application/json' },
                            data: JSON.stringify({
                                sessionId: sessId,
                                email: e.data.email,
                                startTime: new Date(now).toISOString(),
                                createdAt: new Date(now).toISOString(),
                                tool: currentTool,
                                tools: initToolObj,
                                totalSessionSeconds: 1,
                                activeToolsTotalSeconds: 1
                            })
                        });
                    }
                }
                hideOverlay();
                if (!shouldHideTopBar()) showTopBar();
            }
        });

        setInterval(function() {
            // Check cross-tab unlock from popup localStorage
            if (localStorage.getItem('gf_unlock_status') === 'active') {
                var storedEmail = localStorage.getItem('gf_user_email') || 'Anonymous';
                GM_setValue(KEY_STATUS, 'active');
                GM_setValue(KEY_EMAIL, storedEmail);
                GM_setValue(KEY_HEARTBEAT, Date.now());
                GM_setValue(KEY_LAST_ACTIVITY, Date.now());
                localStorage.removeItem('gf_unlock_status');
                if (popupWin && !popupWin.closed) popupWin.close();
                hideOverlay();
                if (!shouldHideTopBar()) showTopBar();
            }

            if (GM_getValue(KEY_CLOSE, false) === true) {
                if (popupWin && !popupWin.closed) popupWin.close();
                GM_setValue(KEY_CLOSE, false);
            }

            var hiddenContext = shouldHideTopBar();

            if (checkAccess()) {
                if (popupWin && !popupWin.closed) popupWin.close();
                hideOverlay();

                if (hiddenContext) {
                    removeTopBar();
                } else {
                    if (!document.getElementById('gf-topbar')) showTopBar();

                    // Inactivity Check 15 นาที
                    var lastAct = GM_getValue(KEY_LAST_ACTIVITY, Date.now());
                    if (Date.now() - lastAct >= IDLE_TIMEOUT_MS) {
                        showInactivityModal();
                    } else {
                        closeInactivityModal();
                    }

                    GM_setValue(KEY_HEARTBEAT, Date.now());
                }
            } else {
                closeInactivityModal();
                removeTopBar();
                if (isAITool && !hiddenContext && !document.getElementById('gf-overlay')) showOverlay();
            }
        }, 1000);

        if (isAITool) {
            runTracker();
        }

        var init = function() {
            if (shouldHideTopBar()) {
                removeTopBar();
                return;
            }
            if (checkAccess()) showTopBar();
            else if (isAITool) showOverlay();
        };
        if (document.body) { init(); }
        else { document.addEventListener('DOMContentLoaded', init); }
    }

})();
