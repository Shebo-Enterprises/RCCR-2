import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, serverTimestamp, orderBy, arrayUnion, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDa-q7h7VTuHxffftGK44NhKKfLt0w8qjM",
    authDomain: "rccr-main.firebaseapp.com",
    projectId: "rccr-main",
    storageBucket: "rccr-main.firebasestorage.app",
    messagingSenderId: "221328154434",
    appId: "1:221328154434:web:a6000a45f5d4ba964532db"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let currentCampaignId = null;
let donationsUnsubscribe = null;

// --- AUTHENTICATION ---

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        document.getElementById('btn-logout').classList.remove('hidden');
        document.getElementById('user-email-display').innerText = user.email;
        loadCampaigns();
        loadWalletData();
    } else {
        document.getElementById('auth-view').classList.remove('hidden');
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('btn-logout').classList.add('hidden');
        document.getElementById('user-email-display').innerText = '';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        // If user not found, try to create account (Simplified flow)
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
            } catch (createErr) {
                alert("Login/Signup failed: " + createErr.message);
            }
        } else {
            alert("Error: " + error.message);
        }
    }
});

document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

// --- CAMPAIGN MANAGEMENT ---

function loadCampaigns() {
    if (!currentUser) return;

    const q = query(collection(db, "campaigns"), where("ownerId", "==", currentUser.uid));
    
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('campaigns-list');
        list.innerHTML = '';
        
        let totalRaised = 0;
        let totalDonors = 0;
        let activeCount = 0;

        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align:center; color:#777;">You haven\'t created any campaigns yet.</p>';
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Only count active/paused for stats, or all? Let's count all.
            totalRaised += data.raised || 0;
            totalDonors += data.donorCount || 0;
            activeCount++;

            const div = document.createElement('div');
            div.className = 'campaign-item';
            div.innerHTML = `
                <div class="campaign-info">
                    <h4>${data.title}</h4>
                    <div class="campaign-meta">
                        <span class="status-badge status-${data.status || 'active'}" style="margin-left:0; margin-right:10px; font-size:0.7rem; padding:2px 6px;">${data.status || 'Active'}</span>
                        Goal: $${data.goal.toLocaleString()} &bull; Raised: <strong>$${(data.raised || 0).toLocaleString()}</strong>
                    </div>
                    <div style="margin-top:5px;">
                        <div style="background:#eee; height:4px; width:150px; border-radius:2px; display:inline-block; vertical-align:middle;">
                            <div style="background:var(--primary); height:100%; width:${Math.min(((data.raised||0)/data.goal)*100, 100)}%"></div>
                        </div>
                        <span style="font-size:0.8rem; margin-left:5px;">${Math.round(((data.raised||0)/data.goal)*100)}%</span>
                    </div>
                </div>
                <div class="campaign-actions">
                    <button onclick="window.manageCampaign('${id}')" class="btn-outline">Manage</button>
                </div>
            `;
            list.appendChild(div);
        });

        // Update Stats
        document.getElementById('total-raised-display').innerText = '$' + totalRaised.toLocaleString();
        document.getElementById('active-campaigns-display').innerText = activeCount;
        document.getElementById('total-donors-display').innerText = totalDonors;
    });
}

// --- CAMPAIGN DETAILS & MANAGEMENT ---

window.manageCampaign = async (id) => {
    currentCampaignId = id;
    document.getElementById('campaigns-list-view').classList.add('hidden');
    document.getElementById('campaign-detail-view').classList.remove('hidden');
    
    // Reset tabs
    document.querySelector('.tab-btn.active').classList.remove('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.detail-tab-content').forEach(d => d.classList.add('hidden'));
    document.getElementById('detail-content-overview').classList.remove('hidden');

    // Fetch Campaign Data
    const docRef = doc(db, "campaigns", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Header
        document.getElementById('detail-title').innerText = data.title;
        const statusEl = document.getElementById('detail-status');
        statusEl.innerText = data.status || 'Active';
        statusEl.className = `status-badge status-${data.status || 'active'}`;
        
        document.getElementById('view-live-btn').href = `index.html?id=${id}`;

        // Overview Stats
        document.getElementById('detail-raised').innerText = '$' + (data.raised || 0).toLocaleString();
        document.getElementById('detail-goal').innerText = '$' + data.goal.toLocaleString();
        document.getElementById('detail-donors').innerText = data.donorCount || 0;
        
        const pct = Math.min(((data.raised||0)/data.goal)*100, 100);
        document.getElementById('detail-progress-bar').style.width = pct + '%';
        document.getElementById('detail-percent').innerText = Math.round(pct) + '% Funded';

        // Populate Settings Form
        document.getElementById('set-title').value = data.title;
        document.getElementById('set-short-desc').value = data.shortDesc || '';
        document.getElementById('set-goal').value = data.goal;
        document.getElementById('set-status').value = data.status || 'active';
        document.getElementById('set-image').value = data.imageUrl;
        document.getElementById('set-story').value = data.story;

        // Populate Methods
        const methods = data.allowedMethods || ['card'];
        document.getElementById('set-method-card').checked = methods.includes('card');
        document.getElementById('set-method-cash').checked = methods.includes('cash');
        document.getElementById('set-method-custom').checked = methods.includes('custom');
        document.getElementById('set-custom-label').value = data.customMethodLabel || '';

        // Load Donations
        loadDonations(id);
    }
};

function loadDonations(campaignId) {
    if (donationsUnsubscribe) donationsUnsubscribe();
    
    const q = query(collection(db, "donations"), where("campaignId", "==", campaignId), orderBy("timestamp", "desc"));
    const tbody = document.getElementById('detail-donations-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    donationsUnsubscribe = onSnapshot(q, (snapshot) => {
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5">No donations yet.</td></tr>';
            return;
        }
        snapshot.forEach(doc => {
            const d = doc.data();
            const did = doc.id;
            const date = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
            
            let statusColor = '#777';
            if(d.status === 'approved') statusColor = 'var(--primary)';
            if(d.status === 'denied') statusColor = 'var(--danger)';
            if(d.status === 'pending') statusColor = '#f0ad4e';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${d.name}</strong><br>
                    <small style="color:#666">${d.email || ''}</small>
                </td>
                <td>$${d.amount}</td>
                <td><span style="color:${statusColor}; font-weight:bold; text-transform:uppercase; font-size:0.8rem;">${d.status || 'pending'}</span></td>
                <td>${date}</td>
                <td>
                    ${d.status === 'pending' ? `
                        <button onclick="window.updateDonationStatus('${did}', '${campaignId}', ${d.amount}, 'approved')" style="padding:4px 8px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer; margin-right:5px;">Approve</button>
                        <button onclick="window.updateDonationStatus('${did}', '${campaignId}', ${d.amount}, 'denied')" style="padding:4px 8px; background:var(--danger); color:white; border:none; border-radius:4px; cursor:pointer;">Deny</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

window.updateDonationStatus = async (donationId, campaignId, amount, newStatus) => {
    try {
        if (newStatus === 'approved') {
            // Transaction: Update donation status AND increment campaign totals
            await runTransaction(db, async (transaction) => {
                const campaignRef = doc(db, "campaigns", campaignId);
                const donationRef = doc(db, "donations", donationId);
                
                const campaignDoc = await transaction.get(campaignRef);
                if (!campaignDoc.exists()) throw "Campaign does not exist!";

                const newRaised = (campaignDoc.data().raised || 0) + amount;
                const newCount = (campaignDoc.data().donorCount || 0) + 1;

                transaction.update(campaignRef, { raised: newRaised, donorCount: newCount });
                transaction.update(donationRef, { status: 'approved' });
            });
        } else {
            // Just update status (Denied)
            await updateDoc(doc(db, "donations", donationId), { status: newStatus });
        }
    } catch (err) {
        console.error(err);
        alert("Error updating status: " + err.message);
    }
};

window.showCampaignsList = () => {
    document.getElementById('campaign-detail-view').classList.add('hidden');
    document.getElementById('campaigns-list-view').classList.remove('hidden');
    if (donationsUnsubscribe) donationsUnsubscribe();
    currentCampaignId = null;
};

// --- FORM HANDLING (CREATE) ---

const campaignForm = document.getElementById('campaign-form');

campaignForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const methods = [];
    if(document.getElementById('c-method-card').checked) methods.push('card');
    if(document.getElementById('c-method-cash').checked) methods.push('cash');
    if(document.getElementById('c-method-custom').checked) methods.push('custom');

    const data = {
        title: document.getElementById('c-title').value,
        shortDesc: document.getElementById('c-short-desc').value,
        goal: parseFloat(document.getElementById('c-goal').value),
        organizer: document.getElementById('c-organizer').value,
        imageUrl: document.getElementById('c-image').value,
        story: document.getElementById('c-story').value,
        allowedMethods: methods.length > 0 ? methods : ['card'],
        customMethodLabel: document.getElementById('c-custom-label').value,
        status: 'active',
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        raised: 0,
        donorCount: 0
    };

    try {
        await addDoc(collection(db, "campaigns"), data);
        window.closeModal('campaign-modal');
        campaignForm.reset();
    } catch (err) {
        alert("Error creating: " + err.message);
    }
});

// --- FORM HANDLING (SETTINGS/UPDATE) ---

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentCampaignId) return;

    const methods = [];
    if(document.getElementById('set-method-card').checked) methods.push('card');
    if(document.getElementById('set-method-cash').checked) methods.push('cash');
    if(document.getElementById('set-method-custom').checked) methods.push('custom');

    const data = {
        title: document.getElementById('set-title').value,
        shortDesc: document.getElementById('set-short-desc').value,
        goal: parseFloat(document.getElementById('set-goal').value),
        status: document.getElementById('set-status').value,
        imageUrl: document.getElementById('set-image').value,
        story: document.getElementById('set-story').value,
        allowedMethods: methods.length > 0 ? methods : ['card'],
        customMethodLabel: document.getElementById('set-custom-label').value,
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(doc(db, "campaigns", currentCampaignId), data);
        alert("Campaign updated successfully!");
        // Refresh header
        document.getElementById('detail-title').innerText = data.title;
        const statusEl = document.getElementById('detail-status');
        statusEl.innerText = data.status;
        statusEl.className = `status-badge status-${data.status}`;
    } catch (err) {
        alert("Error updating: " + err.message);
    }
});

window.deleteCurrentCampaign = async () => {
    if (!currentCampaignId) return;
    if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) return;

    try {
        await deleteDoc(doc(db, "campaigns", currentCampaignId));
        window.showCampaignsList();
    } catch (err) {
        alert("Error deleting: " + err.message);
    }
};

// --- GLOBAL HELPERS ---

window.shareCurrentCampaign = () => {
    const id = currentCampaignId;
    if (!id) return;
    const url = window.location.origin + window.location.pathname.replace('admin.html', 'index.html') + '?id=' + id;
    const embed = `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
    
    document.getElementById('share-link').value = url;
    document.getElementById('embed-code').value = embed;
    window.openModal('embed-modal');
};

window.shareCampaign = (id) => {
    // Helper if called from list view directly (though button removed in this version)
    currentCampaignId = id;
    window.shareCurrentCampaign();
};

window.openModal = (id) => {
    document.getElementById(id).classList.add('active');
};

// --- WALLET & PROFILE LOGIC ---

async function loadWalletData() {
    if (!currentUser) return;
    
    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
        const data = snap.data();
        
        // Profile
        document.getElementById('user-display-name').value = data.displayName || '';
        
        // Billing
        if (data.billing) {
            document.getElementById('billing-name').value = data.billing.name || '';
            document.getElementById('billing-address').value = data.billing.address || '';
        }
        
        // Payment Methods
        const pmList = document.getElementById('payment-methods-list');
        pmList.innerHTML = '';
        if (data.paymentMethods && data.paymentMethods.length > 0) {
            data.paymentMethods.forEach(pm => {
                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.border = '1px solid #eee';
                div.style.marginBottom = '10px';
                div.style.borderRadius = '4px';
                div.innerHTML = `<strong>${pm.bank}</strong> ending in ****${pm.last4}`;
                pmList.appendChild(div);
            });
        } else {
            pmList.innerHTML = '<p style="color:#999; font-style:italic;">No payment methods added.</p>';
        }
    }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('user-display-name').value;
    try {
        await setDoc(doc(db, "users", currentUser.uid), { displayName: name }, { merge: true });
        alert("Profile saved.");
    } catch (err) { alert(err.message); }
});

document.getElementById('billing-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const billing = {
        name: document.getElementById('billing-name').value,
        address: document.getElementById('billing-address').value
    };
    try {
        await setDoc(doc(db, "users", currentUser.uid), { billing: billing }, { merge: true });
        alert("Billing info updated.");
    } catch (err) { alert(err.message); }
});

document.getElementById('payment-method-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pm = {
        bank: document.getElementById('pm-bank').value,
        last4: document.getElementById('pm-account').value
    };
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            paymentMethods: arrayUnion(pm)
        }, { merge: true });
        
        window.closeModal('payment-modal');
        document.getElementById('payment-method-form').reset();
        loadWalletData(); // Refresh list
    } catch (err) { alert(err.message); }
});