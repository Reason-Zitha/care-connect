// ========================================
// CARECONNECT - Firebase Integration
// ========================================

// Firebase configuration - Replace with your own config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ========================================
    // AUTHENTICATION - DOM Elements
    // ========================================
    const authPage = document.getElementById('auth-page');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const formSubtitle = document.getElementById('form-subtitle');

    // ========================================
    // TOGGLE BETWEEN LOGIN & REGISTER
    // ========================================
    if (showRegister) {
        showRegister.addEventListener('click', function() {
            loginForm.style.display = 'none';
            registerForm.classList.remove('hidden');
            formSubtitle.textContent = 'Create Account';
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function() {
            registerForm.classList.add('hidden');
            loginForm.style.display = 'flex';
            formSubtitle.textContent = 'Admin Login';
        });
    }

    // ========================================
    // HANDLE LOGIN
    // ========================================
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const loginBtn = this.querySelector('.auth-btn');
            const originalText = loginBtn.textContent;

            if (!email || !password) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }

            // Disable button and show loading
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("Logged in user:", user.email);
                    
                    loginBtn.textContent = '✓ Success!';
                    loginBtn.style.background = '#07835f';
                    
                    showNotification('Welcome back!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                })
                .catch((error) => {
                    console.error("Login error:", error);
                    let message = 'Invalid email or password.';
                    if (error.code === 'auth/user-not-found') {
                        message = 'No account found with this email.';
                    } else if (error.code === 'auth/wrong-password') {
                        message = 'Incorrect password.';
                    } else if (error.code === 'auth/too-many-requests') {
                        message = 'Too many failed attempts. Please try again later.';
                    }
                    showNotification(message, 'error');
                    
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                    loginBtn.style.background = '';
                });
        });
    }

    // ========================================
    // HANDLE REGISTER
    // ========================================
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const regBtn = this.querySelector('.auth-btn');
            const originalText = regBtn.textContent;

            if (!name || !email || !password) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('Password must be at least 6 characters.', 'error');
                return;
            }

            // Disable button and show loading
            regBtn.textContent = 'Creating account...';
            regBtn.disabled = true;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log("Created user:", user.email);

                    // Save user profile to Firestore
                    return db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    regBtn.textContent = '✓ Account Created!';
                    regBtn.style.background = '#07835f';
                    
                    showNotification('Account created successfully!', 'success');

                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                })
                .catch((error) => {
                    console.error("Signup error:", error);
                    let message = 'Error creating account.';
                    if (error.code === 'auth/email-already-in-use') {
                        message = 'This email is already registered.';
                    } else if (error.code === 'auth/invalid-email') {
                        message = 'Please enter a valid email address.';
                    } else if (error.code === 'auth/weak-password') {
                        message = 'Password is too weak. Use at least 6 characters.';
                    }
                    showNotification(message, 'error');
                    
                    regBtn.textContent = originalText;
                    regBtn.disabled = false;
                    regBtn.style.background = '';
                });
        });
    }

    // ========================================
    // CHECK AUTH STATE
    // ========================================
    function checkAuth() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Skip auth check for login page
        if (currentPage === 'index.html' || currentPage === '') {
            return;
        }

        auth.onAuthStateChanged(function(user) {
            if (!user) {
                // Redirect to login if not authenticated
                window.location.href = 'index.html';
            }
        });
    }

    // ========================================
    // HANDLE LOGOUT
    // ========================================
    function handleLogout() {
        auth.signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error("Logout error:", error);
                showNotification('Error logging out. Please try again.', 'error');
            });
    }

    // ========================================
    // ADD LOGOUT BUTTON TO SIDEBAR
    // ========================================
    function addLogoutButton() {
        const sidebarUser = document.querySelector('.sidebar-user');
        if (sidebarUser) {
            // Check if logout button already exists
            if (sidebarUser.querySelector('.logout-btn')) return;
            
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn btn-outline btn-sm logout-btn';
            logoutBtn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> Logout';
            logoutBtn.addEventListener('click', handleLogout);
            
            const userInfo = sidebarUser.querySelector('div');
            if (userInfo) {
                userInfo.appendChild(logoutBtn);
            }
        }
    }

    // ========================================
    // SHOW NOTIFICATION
    // ========================================
    function showNotification(message, type = 'success') {
        // Remove any existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    // ========================================
    // LOAD PATIENTS FROM FIREBASE
    // ========================================
    function loadPatients() {
        const tableBody = document.querySelector('#patientTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #77736e;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Loading patients...
                </td>
            </tr>
        `;

        db.collection('patients')
            .orderBy('createdAt', 'desc')
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: #77736e;">
                                No patients found. Click "Add New Patient" to register one.
                            </td>
                        </tr>
                    `;
                    updateStats([]);
                    return;
                }

                const patients = [];
                querySnapshot.forEach((doc) => {
                    patients.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                renderPatients(patients);
                updateStats(patients);
                updateAlerts(patients);
            })
            .catch((error) => {
                console.error("Error loading patients:", error);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #c91442;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Error loading patients. Please refresh.
                        </td>
                    </tr>
                `;
            });
    }

    // ========================================
    // RENDER PATIENTS TABLE
    // ========================================
    function renderPatients(patients) {
        const tableBody = document.querySelector('#patientTable tbody');
        if (!tableBody) return;

        if (!patients || patients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #77736e;">
                        No patients found. Click "Add New Patient" to register one.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = patients.map(patient => {
            const statusClass = patient.status ? patient.status.replace(' ', '-') : 'on-track';
            const statusDisplay = patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'On Track';
            const adherenceColor = patient.adherence >= 80 ? 'text-success' : 
                                   patient.adherence >= 50 ? 'text-warning' : 'text-danger';
            const btnColor = patient.adherence >= 80 ? 'btn-primary' : 
                             patient.adherence >= 50 ? 'btn-warning' : 'btn-danger';

            return `
                <tr>
                    <td><strong>${patient.name}</strong></td>
                    <td>${patient.age}</td>
                    <td>${patient.medications || 0}</td>
                    <td><strong class="${adherenceColor}">${patient.adherence || 0}%</strong></td>
                    <td><span class="status-badge ${statusClass}"><span class="dot"></span> ${statusDisplay}</span></td>
                    <td><a href="profile.html?id=${patient.id}" class="btn ${btnColor} btn-sm">View</a></td>
                </tr>
            `;
        }).join('');
    }

    // ========================================
    // UPDATE DASHBOARD STATS
    // ========================================
    function updateStats(patients) {
        if (!patients) return;
        
        const totalPatients = patients.length;
        const activeSchedules = patients.filter(p => p.medications > 0).length;
        const confirmedToday = patients.filter(p => p.adherence >= 80).length;
        const missedToday = patients.filter(p => p.adherence < 50).length;

        const statsElements = document.querySelectorAll('.stat-number');
        const statValues = [totalPatients, activeSchedules, confirmedToday, missedToday];
        
        statsElements.forEach((stat, index) => {
            if (index < statValues.length) {
                animateNumber(stat, statValues[index]);
            }
        });
    }

    function animateNumber(element, finalValue) {
        let current = 0;
        const increment = Math.max(1, Math.ceil(finalValue / 20));
        const interval = setInterval(() => {
            current += increment;
            if (current >= finalValue) {
                current = finalValue;
                clearInterval(interval);
            }
            element.textContent = current;
        }, 50);
    }

    // ========================================
    // UPDATE ALERTS
    // ========================================
    function updateAlerts(patients) {
        const alertsContainer = document.querySelector('.alerts-container');
        if (!alertsContainer) return;

        const missedPatients = patients.filter(p => p.adherence < 80);

        if (missedPatients.length === 0) {
            alertsContainer.innerHTML = `
                <div class="alerts-empty">
                    <div class="empty-bell"><i class="fa-solid fa-bell"></i></div>
                    <h2>No alerts</h2>
                    <p>Alerts appear here automatically when patients miss their medication</p>
                </div>
            `;
            return;
        }

        alertsContainer.innerHTML = missedPatients.map(p => `
            <div class="alert-item ${p.adherence < 50 ? 'priority-high' : 'priority-followup'}">
                <div class="alert-content">
                    <strong>${p.name}</strong>
                    <span class="alert-detail">Missed medication dose(s) - ${p.adherence}% adherence</span>
                </div>
                <div class="alert-actions">
                    <span class="status-badge ${p.adherence < 50 ? 'high-risk' : 'needs-followup'}">
                        <span class="dot"></span> ${p.adherence < 50 ? 'Urgent' : 'Follow-up'}
                    </span>
                    <a href="profile.html?id=${p.id}" class="btn btn-primary btn-sm">View</a>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // SAVE PATIENT TO FIREBASE
    // ========================================
    function savePatientToFirebase(patientData) {
        const submitBtn = document.querySelector('#patientForm .btn-primary');
        const originalText = submitBtn ? submitBtn.textContent : 'Save Patient';
        
        if (submitBtn) {
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;
        }

        const medicationsCount = patientData.medications ? patientData.medications.length : 0;
        
        const data = {
            name: patientData.fullName,
            age: parseInt(patientData.age),
            phone: patientData.phone,
            language: patientData.language || 'en',
            medications: medicationsCount,
            adherence: 100,
            status: 'on track',
            caregiver: patientData.caregiverName,
            caregiverPhone: patientData.caregiverPhone,
            caregiverRelation: patientData.caregiverRelation,
            backupCaregiver: patientData.backupCaregiver || '',
            medicationsList: patientData.medications || [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('patients').add(data)
            .then((docRef) => {
                console.log("Patient added with ID: ", docRef.id);
                
                if (submitBtn) {
                    submitBtn.textContent = '✓ Saved!';
                    submitBtn.classList.add('btn-success');
                }

                showNotification('Patient registered successfully!', 'success');
                
                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('btn-success');
                    }
                    document.getElementById('patientForm').reset();
                    const container = document.getElementById('medications-container');
                    if (container) {
                        container.innerHTML = `
                            <div class="medication-entry">
                                <div class="form-group">
                                    <label>Medication Name</label>
                                    <input type="text" placeholder="e.g. Blood Pressure Medication">
                                </div>
                                <div class="form-group">
                                    <label>Dosage</label>
                                    <input type="text" placeholder="e.g. 1 tablet">
                                </div>
                                <div class="form-group">
                                    <label>Time</label>
                                    <input type="time" value="08:00">
                                </div>
                                <button type="button" class="btn-remove-med" data-remove-med>Remove</button>
                            </div>
                        `;
                        const removeBtn = container.querySelector('[data-remove-med]');
                        if (removeBtn) {
                            removeBtn.addEventListener('click', function() {
                                removeMedication(this);
                            });
                        }
                    }
                    
                    setTimeout(() => {
                        window.location.href = 'patients.html';
                    }, 2000);
                    
                }, 1500);
            })
            .catch((error) => {
                console.error("Error adding patient: ", error);
                showNotification('Error saving patient. Please try again.', 'error');
                
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
    }

    // ========================================
    // GET PATIENT BY ID FROM FIREBASE
    // ========================================
    function getPatientById(id) {
        const profileContainer = document.querySelector('.profile-content');
        
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i> Loading patient...
                </div>
            `;
        }

        db.collection('patients').doc(id).get()
            .then((doc) => {
                if (!doc.exists) {
                    if (profileContainer) {
                        profileContainer.innerHTML = `
                            <div class="error-state">
                                <i class="fa-solid fa-triangle-exclamation"></i> Patient not found.
                                <br><br>
                                <a href="patients.html" class="btn btn-primary">Back to Patients</a>
                            </div>
                        `;
                    }
                    return;
                }

                const patient = { id: doc.id, ...doc.data() };
                loadPatientProfile(patient);
            })
            .catch((error) => {
                console.error("Error loading patient: ", error);
                if (profileContainer) {
                    profileContainer.innerHTML = `
                        <div class="error-state">
                            <i class="fa-solid fa-triangle-exclamation"></i> Error loading patient.
                            <br><br>
                            <a href="patients.html" class="btn btn-primary">Back to Patients</a>
                        </div>
                    `;
                }
            });
    }

    // ========================================
    // LOAD PATIENT PROFILE
    // ========================================
    function loadPatientProfile(patient) {
        const avatarElement = document.querySelector('.profile-avatar');
        const nameElement = document.querySelector('.profile-info h2');
        const detailsElement = document.querySelector('.profile-details');
        const adherenceNumber = document.querySelector('.adherence-number');
        const statusBadge = document.querySelector('.adherence-card .status-badge');

        if (avatarElement) {
            avatarElement.textContent = patient.name.split(' ').map(n => n[0]).join('');
        }
        if (nameElement) {
            nameElement.textContent = patient.name;
        }
        if (detailsElement) {
            detailsElement.innerHTML = `
                <span>Age: ${patient.age}</span>
                <span>Phone: ${patient.phone}</span>
                <span>Primary Caregiver: ${patient.caregiver}</span>
            `;
        }
        if (adherenceNumber) {
            adherenceNumber.textContent = (patient.adherence || 0) + '%';
        }
        if (statusBadge) {
            const statusClass = (patient.status || 'on-track').replace(' ', '-');
            const statusDisplay = (patient.status || 'On Track').charAt(0).toUpperCase() + (patient.status || 'on track').slice(1);
            statusBadge.className = `status-badge ${statusClass}`;
            statusBadge.innerHTML = `<span class="dot"></span> ${statusDisplay}`;
        }

        const medicationsContainer = document.getElementById('tab-medications');
        if (medicationsContainer && patient.medicationsList) {
            if (patient.medicationsList.length === 0) {
                medicationsContainer.innerHTML = `
                    <div class="empty-state">No medications prescribed yet.</div>
                `;
            } else {
                medicationsContainer.innerHTML = patient.medicationsList.map(med => `
                    <div class="medication-item">
                        <div class="med-info">
                            <span class="med-icon">M</span>
                            <div>
                                <div class="med-name">${med.name}</div>
                                <div class="med-time">${med.time} - ${med.dosage}</div>
                            </div>
                        </div>
                        <span class="med-status ${med.status || 'pending'}">${(med.status || 'Pending').charAt(0).toUpperCase() + (med.status || 'pending').slice(1)}</span>
                    </div>
                `).join('');
            }
        }

        const caregiverContainer = document.getElementById('tab-caregivers');
        if (caregiverContainer) {
            caregiverContainer.innerHTML = `
                <div class="caregiver-grid">
                    <div class="caregiver-card">
                        <div class="caregiver-icon">${patient.caregiver ? patient.caregiver.charAt(0) : '?'}</div>
                        <div class="caregiver-name">${patient.caregiver || 'Not assigned'}</div>
                        <div class="caregiver-role">${patient.caregiverRelation || 'Primary Caregiver'}</div>
                        <div class="caregiver-phone">Phone: ${patient.caregiverPhone || 'N/A'}</div>
                    </div>
                    ${patient.backupCaregiver ? `
                        <div class="caregiver-card">
                            <div class="caregiver-icon" style="background: #f59e0b;">${patient.backupCaregiver.charAt(0)}</div>
                            <div class="caregiver-name">${patient.backupCaregiver}</div>
                            <div class="caregiver-role">Backup Caregiver</div>
                        </div>
                    ` : `
                        <div class="caregiver-card add-caregiver">
                            <div class="caregiver-icon">+</div>
                            <div class="caregiver-name">Add Backup Caregiver</div>
                            <div class="caregiver-role">Assign a neighbour or friend</div>
                        </div>
                    `}
                </div>
            `;
        }

        const alertBanner = document.querySelector('.alert-banner-text');
        if (alertBanner) {
            const missed = patient.medicationsList ? patient.medicationsList.filter(m => m.status === 'missed').length : 0;
            if (missed > 0) {
                alertBanner.textContent = `Missed ${missed} dose(s) this week`;
                alertBanner.parentElement.style.display = 'block';
            } else {
                alertBanner.parentElement.style.display = 'none';
            }
        }

        const profileContainer = document.querySelector('.profile-content');
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
    }

    // ========================================
    // ADD PATIENT PAGE - Form Submission
    // ========================================
    var patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const age = document.getElementById('age').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const language = document.getElementById('language').value;
            const caregiverName = document.getElementById('caregiverName').value.trim();
            const caregiverPhone = document.getElementById('caregiverPhone').value.trim();
            const caregiverRelation = document.getElementById('caregiverRelation').value;
            const backupCaregiver = document.getElementById('backupCaregiver').value.trim();

            if (!fullName || !age || !phone || !caregiverName || !caregiverPhone) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            const medicationEntries = document.querySelectorAll('.medication-entry');
            const medications = [];
            medicationEntries.forEach(entry => {
                const nameInput = entry.querySelector('input[placeholder*="Medication"]');
                const dosageInput = entry.querySelector('input[placeholder*="dosage"]');
                const timeInput = entry.querySelector('input[type="time"]');
                
                if (nameInput && dosageInput && timeInput) {
                    const name = nameInput.value.trim();
                    const dosage = dosageInput.value.trim();
                    const time = timeInput.value;
                    
                    if (name && dosage && time) {
                        medications.push({
                            name: name,
                            dosage: dosage,
                            time: time,
                            status: 'pending'
                        });
                    }
                }
            });

            if (medications.length === 0) {
                showNotification('Please add at least one medication.', 'error');
                return;
            }

            const patientData = {
                fullName: fullName,
                age: age,
                phone: phone,
                language: language,
                caregiverName: caregiverName,
                caregiverPhone: caregiverPhone,
                caregiverRelation: caregiverRelation,
                backupCaregiver: backupCaregiver,
                medications: medications
            };

            savePatientToFirebase(patientData);
        });
    }

    // ========================================
    // ADD PATIENT PAGE - Medication Management
    // ========================================
    var medicationsContainer = document.getElementById('medications-container');
    var addMedBtn = document.getElementById('addMedicationBtn');

    function addMedication() {
        if (!medicationsContainer) return;

        var entry = document.createElement('div');
        entry.className = 'medication-entry';

        entry.innerHTML = `
            <div class="form-group">
                <label>Medication Name</label>
                <input type="text" placeholder="e.g. Blood Pressure Medication">
            </div>
            <div class="form-group">
                <label>Dosage</label>
                <input type="text" placeholder="e.g. 1 tablet">
            </div>
            <div class="form-group">
                <label>Time</label>
                <input type="time" value="08:00">
            </div>
            <button type="button" class="btn-remove-med" data-remove-med>Remove</button>
        `;

        medicationsContainer.appendChild(entry);

        var removeBtn = entry.querySelector('[data-remove-med]');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeMedication(this);
            });
        }
    }

    function removeMedication(button) {
        var entries = document.querySelectorAll('.medication-entry');
        if (entries.length > 1) {
            var entry = button.closest('.medication-entry');
            if (entry) {
                entry.remove();
            }
        } else {
            showNotification('At least one medication is required.', 'error');
        }
    }

    if (addMedBtn) {
        addMedBtn.addEventListener('click', addMedication);
    }

    var removeButtons = document.querySelectorAll('[data-remove-med]');
    removeButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeMedication(this);
        });
    });

    // ========================================
    // PROFILE PAGE - Tab Switcher
    // ========================================
    var tabs = document.querySelectorAll('.tab');
    var tabContents = document.querySelectorAll('.tab-content');

    if (tabs.length > 0) {
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                var tabId = this.getAttribute('data-tab');

                tabs.forEach(function(t) { t.classList.remove('active'); });
                tabContents.forEach(function(c) { c.classList.remove('active'); });

                this.classList.add('active');

                var targetContent = document.getElementById('tab-' + tabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // ========================================
    // PAGE INITIALIZATION
    // ========================================
    const currentPage = window.location.pathname.split('/').pop();

    // Check authentication for protected pages
    checkAuth();

    // Add logout button to sidebar
    if (currentPage !== 'index.html' && currentPage !== '') {
        addLogoutButton();
    }

    if (currentPage === 'patients.html') {
        loadPatients();
        
        const searchInput = document.getElementById('searchPatients');
        if (searchInput) {
            searchInput.addEventListener('keyup', function() {
                const query = this.value.toLowerCase().trim();
                const rows = document.querySelectorAll('#patientTable tbody tr');
                
                rows.forEach(row => {
                    const name = row.querySelector('td:first-child');
                    if (name) {
                        const text = name.textContent.toLowerCase();
                        row.style.display = text.indexOf(query) > -1 ? '' : 'none';
                    }
                });
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                const value = this.value;
                const rows = document.querySelectorAll('#patientTable tbody tr');
                
                rows.forEach(row => {
                    const statusCell = row.querySelector('td:nth-child(5)');
                    if (statusCell) {
                        const statusText = statusCell.textContent.toLowerCase().trim();
                        if (value === '' || statusText.indexOf(value) > -1) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    }
                });
            });
        }
    }

    if (currentPage === 'dashboard.html') {
        db.collection('patients').get()
            .then((querySnapshot) => {
                const patients = [];
                querySnapshot.forEach((doc) => {
                    patients.push(doc.data());
                });
                updateStats(patients);
                renderTodaySchedule(patients);
                renderRecentActivity(patients);
            })
            .catch((error) => {
                console.error("Error loading stats:", error);
            });
    }

    if (currentPage === 'profile.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('id');
        
        if (patientId) {
            getPatientById(patientId);
        } else {
            window.location.href = 'patients.html';
        }
    }

    if (currentPage === 'alerts.html') {
        db.collection('patients')
            .where('adherence', '<', 80)
            .get()
            .then((querySnapshot) => {
                const patients = [];
                querySnapshot.forEach((doc) => {
                    patients.push({ id: doc.id, ...doc.data() });
                });
                updateAlerts(patients);
            })
            .catch((error) => {
                console.error("Error loading alerts:", error);
            });
    }

    // ========================================
    // DASHBOARD - Today's Schedule
    // ========================================
    function renderTodaySchedule(patients) {
        const schedulePanel = document.querySelector('.schedule-panel .empty-panel');
        if (!schedulePanel) return;

        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const dateChip = document.querySelector('.date-chip');
        if (dateChip) {
            dateChip.textContent = dateString;
        }

        const todayPatients = patients.filter(p => p.medications > 0);
        
        if (todayPatients.length === 0) {
            schedulePanel.innerHTML = `
                <div class="empty-schedule">
                    <i class="fa-regular fa-calendar"></i>
                    <p>No medication schedules for today</p>
                </div>
            `;
            return;
        }

        schedulePanel.innerHTML = todayPatients.slice(0, 5).map(p => `
            <div class="schedule-item">
                <div>
                    <strong>${p.name}</strong>
                    <span class="schedule-med-count">${p.medications} medication(s)</span>
                </div>
                <span class="status-badge ${(p.status || 'on-track').replace(' ', '-')}">
                    <span class="dot"></span> ${p.status || 'On Track'}
                </span>
            </div>
        `).join('');
    }

    // ========================================
    // DASHBOARD - Recent Activity
    // ========================================
    function renderRecentActivity(patients) {
        const activityPanel = document.querySelector('.activity-panel');
        if (!activityPanel) return;

        const activityList = document.createElement('div');
        activityList.className = 'activity-list';

        const activities = patients.slice(0, 5).map(p => ({
            text: `${p.name} ${p.adherence >= 80 ? 'confirmed' : 'missed'} medication`,
            time: 'Today',
            type: p.adherence >= 80 ? 'success' : 'warning'
        }));

        if (activities.length === 0) {
            activityList.innerHTML = `<p class="no-activity">No activity yet</p>`;
        } else {
            activityList.innerHTML = activities.map(a => `
                <div class="activity-item ${a.type}">
                    <span>
                        <i class="fa-solid ${a.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
                        ${a.text}
                    </span>
                    <span class="activity-time">${a.time}</span>
                </div>
            `).join('');
        }

        const existingContent = activityPanel.querySelector('.no-activity');
        if (existingContent) {
            existingContent.replaceWith(activityList);
        } else {
            const oldContent = activityPanel.querySelector('div');
            if (oldContent) {
                oldContent.replaceWith(activityList);
            } else {
                activityPanel.appendChild(activityList);
            }
        }
    }
});