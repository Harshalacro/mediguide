document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       1. SUPABASE INITIALIZATION
       ========================================================= */
    // REPLACE THESE WITH REAL PROJECT URL AND ANON KEY
    const SUPABASE_URL = 'https://mxrxrqkufmuokfusgbfw.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_gi2O4gAQfWoBW_7ydXLREQ_dP0KS45q';
    
    // We intentionally ignore initialization failure in case keys are placeholders
    let supabase = null;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch(e) {
        console.warn("Supabase configuration is a placeholder. Authentication mocked.");
    }

    /* =========================================================
       2. AUTHENTICATION LOGIC
       ========================================================= */
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authSubmit = document.getElementById('auth-submit-btn');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authTitle = document.getElementById('auth-title');
    const authError = document.getElementById('auth-error');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');

    let isLoginMode = true;
    let currentUser = null;

    authToggleLink.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = "Sign In to MediGuide";
            authToggleLink.textContent = "Sign Up";
            authSubmit.textContent = "Sign In";
            authToggleLink.previousSibling.textContent = "Don't have an account? ";
        } else {
            authTitle.textContent = "Create an Account";
            authToggleLink.textContent = "Sign In";
            authSubmit.textContent = "Sign Up";
            authToggleLink.previousSibling.textContent = "Already have an account? ";
        }
    });

    authSubmit.addEventListener('click', async () => {
        const email = authEmail.value;
        const password = authPassword.value;
        if (!email || !password) return;

        authSubmit.disabled = true;
        authError.classList.add('hidden');

        try {
            if (supabaseUrlIsPlaceholder()) {
                // Mock Authentication if keys not provided
                setTimeout(() => {
                    handleAuthSuccess({ email: email });
                }, 1000);
                return;
            }

            if (isLoginMode) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                handleAuthSuccess(data.user);
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("Account created successfully. Please check your email to verify (if enabled) or sign in directly.");
                if (data.user) handleAuthSuccess(data.user);
            }
        } catch (error) {
            authError.textContent = error.message;
            authError.classList.remove('hidden');
            authSubmit.disabled = false;
        }
    });

    function supabaseUrlIsPlaceholder() {
        return SUPABASE_URL.includes("YOUR_PROJECT_ID");
    }

    function handleAuthSuccess(user) {
        currentUser = user;
        userEmailDisplay.textContent = user.email;
        if(user.email) {
            document.getElementById('user-avatar-initial').textContent = user.email.charAt(0).toUpperCase();
        }
        authContainer.style.display = 'none';
        appContainer.classList.remove('hidden');
        authSubmit.disabled = false;
    }

    logoutBtn.addEventListener('click', async () => {
        if (!supabaseUrlIsPlaceholder()) {
            await supabase.auth.signOut();
        }
        currentUser = null;
        appContainer.classList.add('hidden');
        authContainer.style.display = 'flex';
        authEmail.value = '';
        authPassword.value = '';
    });

    // Check existing session
    if (!supabaseUrlIsPlaceholder() && supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) handleAuthSuccess(session.user);
        });
    }

    /* =========================================================
       3. APP & UPLOAD LOGIC
       ========================================================= */
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const uploadSection = document.getElementById('upload-section');
    const loadingState = document.getElementById('loading-state');
    const resultsWrapper = document.getElementById('results-wrapper');
    const resetBtn = document.getElementById('reset-btn');
    const tabs = document.querySelectorAll('.tab');
    
    let selectedFile = null;
    let analysisResult = null;
    let currentLang = 'en';
    let chartInstance = null;

    function getReportType() {
        return document.querySelector('input[name="report_type"]:checked').value;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('active'), false));
    ['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'), false));

    dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            dropZone.querySelector('h3').innerHTML = `Selected Document`;
            dropZone.querySelector('p').innerHTML = `<strong>${selectedFile.name}</strong>`;
            analyzeBtn.disabled = false;
        }
    }

    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        uploadSection.classList.add('hidden');
        loadingState.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('report_type', getReportType());

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('API request failed. Processing took too long or model failed.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            analysisResult = data.simplified_text;
            
            // Save to Supabase DB (silently run in background)
            saveReportToDatabase(analysisResult);

            displayResults();

            loadingState.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during analysis: ' + error.message);
            loadingState.classList.add('hidden');
            uploadSection.classList.remove('hidden');
        }
    });

    async function saveReportToDatabase(result) {
        if (supabaseUrlIsPlaceholder() || !currentUser) return;
        try {
            await supabase.from('medical_reports').insert([{
                user_id: currentUser.id,
                report_type: getReportType(),
                risk_level: result.risk_level,
                summary: result.summary_en,
                results_json: result,
                created_at: new Date()
            }]);
        } catch(e) { console.error("Could not save to Supabase", e); }
    }

    function displayResults() {
        if (!analysisResult) return;

        document.getElementById('summary-text').textContent = currentLang === 'en' ? (analysisResult.summary_en || 'No summary available.') : (analysisResult.summary_hi || 'No summary available.');
        // Advanced advice/precautions
        document.getElementById('advice-text').textContent = currentLang === 'en' ? (analysisResult.advice_en || 'No precautions available at this time.') : (analysisResult.advice_hi || 'No precautions available at this time.');

        const riskLevel = analysisResult.risk_level || 'Unknown';
        const badge = document.getElementById('risk-badge');
        badge.textContent = riskLevel + ' Risk';
        badge.className = 'risk-badge';
        if (riskLevel.toLowerCase().includes('low')) badge.classList.add('low');
        else if (riskLevel.toLowerCase().includes('medium')) badge.classList.add('medium');
        else if (riskLevel.toLowerCase().includes('high')) badge.classList.add('high');

        const metricsCard = document.getElementById('metrics-card');
        const metricsList = document.getElementById('metrics-list');
        metricsList.innerHTML = '';
        
        let hasMetrics = false;

        if (analysisResult.key_values && Object.keys(analysisResult.key_values).length > 0) {
            hasMetrics = true;
            for (const [key, value] of Object.entries(analysisResult.key_values)) {
                if (key === "chart_data") continue;
                const li = document.createElement('li');
                li.innerHTML = `<strong>${formatKey(key)}</strong> <span style="text-align: right;">${value}</span>`;
                metricsList.appendChild(li);
            }
        }

        if (chartInstance) chartInstance.destroy();

        if (analysisResult.chart_data && analysisResult.chart_data.length > 0) {
            hasMetrics = true;
            renderChart(analysisResult.chart_data);
        } else {
            document.getElementById('metricsChart').style.display = 'none';
        }

        if (!hasMetrics) metricsCard.style.display = 'none';
        else metricsCard.style.display = 'block';

        const abnormalList = document.getElementById('abnormal-list');
        abnormalList.innerHTML = '';
        if (analysisResult.abnormal_findings && analysisResult.abnormal_findings.length > 0) {
            analysisResult.abnormal_findings.forEach(finding => {
                const li = document.createElement('li');
                li.innerHTML = `<span style="color: #EF4444;">• ${finding}</span>`;
                abnormalList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No significant abnormalities found.";
            abnormalList.appendChild(li);
        }
    }

    function renderChart(data) {
        document.getElementById('metricsChart').style.display = 'block';
        const ctx = document.getElementById('metricsChart').getContext('2d');
        const labels = data.map(d => d.name);
        const values = data.map(d => parseFloat(d.value) || 0);

        const bgColors = data.map(d => {
            const val = parseFloat(d.value);
            const min = parseFloat(d.min_normal);
            const max = parseFloat(d.max_normal);
            if (isNaN(val) || isNaN(min) || isNaN(max)) return '#4F46E5'; 
            if (val < min || val > max) return '#EF4444'; 
            return '#10B981'; 
        });

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Patient Value', data: values, backgroundColor: bgColors, borderRadius: 4 }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const d = data[context.dataIndex];
                                if (d.min_normal !== 0 || d.max_normal !== 0) return `Normal Range: ${d.min_normal} - ${d.max_normal} ${d.unit}`;
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    function formatKey(key) { return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentLang = tab.dataset.tab;
            displayResults();
        });
    });

    resetBtn.addEventListener('click', () => {
        selectedFile = null;
        analysisResult = null;
        fileInput.value = '';
        dropZone.querySelector('h3').innerHTML = `Drag & drop files here`;
        dropZone.querySelector('p').innerHTML = `Support for JPG, PNG, and PDF formats`;
        analyzeBtn.disabled = true;
        
        resultsWrapper.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    });

    /* =========================================================
       4. GOOGLE DRIVE AND PDF ACTIONS
       ========================================================= */
    function getPdfConfig() {
        return {
            margin:       0.5,
            filename:     'MediGuide_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
    }

    document.getElementById('download-btn').addEventListener('click', () => {
        const element = document.getElementById('results-section');
        html2pdf().set(getPdfConfig()).from(element).save();
    });

    const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';
    let tokenClient;
    let gapiInited = false;
    let gisInited = false;

    window.gapiLoaded = function() {
        gapi.load('client', async () => {
            await gapi.client.init({});
            gapiInited = true;
        });
    };

    window.gisLoaded = function() {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: '', 
        });
        gisInited = true;
    };

    document.getElementById('drive-btn').addEventListener('click', async () => {
        if (!gapiInited || !gisInited) {
            alert('Google Drive API is still loading. Please wait a second and try again.');
            return;
        }

        if (GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
            alert('Google Drive is not fully configured yet! You need to put a real Google Client ID in script.js.');
            return;
        }

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error(resp);
                return;
            }
            await uploadToDrive(resp.access_token);
        };
        
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            tokenClient.requestAccessToken({prompt: ''});
        }
    });

    async function uploadToDrive(accessToken) {
        const overlay = document.getElementById('action-loading');
        document.getElementById('action-loading-text').textContent = "Saving to Google Drive...";
        overlay.classList.remove('hidden');

        try {
            const element = document.getElementById('results-section');
            const pdfBase64 = await html2pdf().set(getPdfConfig()).from(element).output('datauristring');
            
            // Convert Base64 prefix to pure bytes
            const byteString = atob(pdfBase64.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], {type: 'application/pdf'});

            const metadata = {
                name: 'MediGuide_Report.pdf',
                mimeType: 'application/pdf'
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', blob);

            const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: form
            });
            
            const val = await res.json();
            if(val.id) {
                alert('Success! File saved directly to your Google Drive.');
            } else {
                throw new Error(JSON.stringify(val));
            }
        } catch(err) {
            console.error(err);
            alert('Failed to save to Drive. See browser console for details.');
        } finally {
            overlay.classList.add('hidden');
        }
    }
});
