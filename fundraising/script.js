// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, getDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
// TODO: Replace the following config with your own from the Firebase Console
const firebaseConfig = {
        apiKey: "AIzaSyDa-q7h7VTuHxffftGK44NhKKfLt0w8qjM",
        authDomain: "rccr-main.firebaseapp.com",
        projectId: "rccr-main",
        storageBucket: "rccr-main.firebasestorage.app",
        messagingSenderId: "221328154434",
        appId: "1:221328154434:web:a6000a45f5d4ba964532db",
        measurementId: "G-97BBMTGDR0"
};

// Initialize Firebase
// Note: If config is invalid, this will throw errors in console.
// For demo purposes, we will wrap logic to handle missing config gracefully.
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase not configured correctly. Using local simulation mode.");
}

// --- DOM ELEMENTS ---
const form = document.getElementById('donation-form');
const amountBtns = document.querySelectorAll('.amt-btn');
const customInput = document.getElementById('custom-amount');
const progressBar = document.getElementById('progress-bar');
const raisedDisplay = document.getElementById('raised-display');
const goalDisplay = document.getElementById('goal-display');
const donorCountDisplay = document.getElementById('donor-count-display');
const donationList = document.getElementById('donation-list');

// Campaign Elements
const campaignTitle = document.getElementById('campaign-title');
const campaignImage = document.getElementById('campaign-image');
const campaignOrganizer = document.getElementById('campaign-organizer');
const campaignMeta = document.getElementById('campaign-meta');
const campaignStory = document.getElementById('campaign-story');

let currentGoal = 10000; 
let campaignId = new URLSearchParams(window.location.search).get('id');

// --- INITIALIZATION ---

async function init() {
    if (!db) return;

    // If no ID provided, fetch the most recent campaign
    if (!campaignId) {
        const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"), limit(1));
        const snapshot = await onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const doc = snap.docs[0];
                campaignId = doc.id;
                // Update URL without reload
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + campaignId;
                window.history.pushState({path:newUrl},'',newUrl);
                setupListeners(campaignId);
            } else {
                campaignTitle.innerText = "No campaigns found.";
                campaignStory.innerHTML = "<p>Please create a campaign in the <a href='admin.html'>Dashboard</a>.</p>";
                document.querySelector('.donation-card').style.display = 'none';
            }
        });
    } else {
        setupListeners(campaignId);
    }
}

function setupListeners(id) {
    // Listen to Campaign Document (for totals and details)
    onSnapshot(doc(db, "campaigns", id), (doc) => {
        if (doc.exists()) {
            renderCampaign(doc.data());
        }
    });

    // Listen to Donations Sub-collection (or filtered list)
    const q = query(collection(db, "donations"), where("campaignId", "==", id), orderBy("timestamp", "desc"), limit(20));
    onSnapshot(q, (snapshot) => {
        const donations = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'approved') donations.push(data);
        });
        renderDonationsList(donations);
    });
}

function renderCampaign(data) {
    campaignTitle.innerText = data.title;
    campaignOrganizer.innerText = data.organizer;
    
    if (data.imageUrl) {
        campaignImage.src = data.imageUrl;
        campaignImage.style.display = 'block';
    }

    // Format Date
    let dateStr = "Recently";
    if (data.createdAt) {
        dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
    }
    campaignMeta.innerHTML = `Created ${dateStr} &bull; <i class="fas fa-tag"></i> Community`;

    // Story (simple newline to paragraph conversion)
    campaignStory.innerHTML = data.story.split('\n').map(p => `<p>${p}</p>`).join('');

    // Stats
    currentGoal = data.goal;
    goalDisplay.innerText = '$' + currentGoal.toLocaleString();
    
    const raised = data.raised || 0;
    raisedDisplay.innerText = '$' + raised.toLocaleString();
    
    const count = data.donorCount || 0;
    donorCountDisplay.innerText = count;

    const percentage = Math.min((raised / currentGoal) * 100, 100);
    progressBar.style.width = percentage + '%';

    // Render Payment Methods
    const select = document.getElementById('payment-method-select');
    select.innerHTML = '';
    const methods = data.allowedMethods || ['card'];
    const labels = { card: 'Credit/Debit Card', cash: 'Cash', custom: data.customMethodLabel || 'Custom / Other' };
    methods.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = labels[m] || m;
        select.appendChild(opt);
    });
}

function renderDonationsList(donations) {
    donationList.innerHTML = '';
    if (donations.length === 0) {
        donationList.innerHTML = '<li style="padding:10px; color:#777;">No donations yet. Be the first!</li>';
        return;
    }
    donations.forEach(d => {
        const li = document.createElement('li');
        li.className = 'donation-item';
        li.innerHTML = `
            <div class="donation-icon"><i class="fas fa-heart"></i></div>
            <div>
                <strong>${d.name}</strong> donated $${d.amount}
                ${d.message ? `<br><small>"${d.message}"</small>` : ''}
            </div>
        `;
        donationList.appendChild(li);
    });
}

init();

// --- EVENT LISTENERS ---

// Handle Amount Buttons
amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected class from all
        amountBtns.forEach(b => b.classList.remove('selected'));
        // Add to clicked
        btn.classList.add('selected');
        // Clear custom input
        customInput.value = '';
    });
});

// Handle Custom Input
customInput.addEventListener('focus', () => {
    amountBtns.forEach(b => b.classList.remove('selected'));
});

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Determine amount
    let amount = 0;
    const selectedBtn = document.querySelector('.amt-btn.selected');
    if (selectedBtn) {
        amount = parseFloat(selectedBtn.dataset.val);
    } else if (customInput.value) {
        amount = parseFloat(customInput.value);
    }

    if (!amount || amount <= 0) {
        alert("Please enter a valid donation amount.");
        return;
    }

    const displayName = document.getElementById('donor-display-name').value || "Anonymous";
    const message = document.getElementById('donor-message').value || "";
    const method = document.getElementById('payment-method-select').value || "card";
    const email = document.getElementById('donor-email').value;
    const phone = document.getElementById('donor-phone').value || "";
    const billingName = document.getElementById('billing-name').value;
    const billingAddress = document.getElementById('billing-address').value;
    const billingCity = document.getElementById('billing-city').value;
    const billingZip = document.getElementById('billing-zip').value;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Processing...";
    submitBtn.disabled = true;

    try {
        if (db) {
            // Add donation with 'pending' status. 
            // Admin must approve for it to count towards totals.
            await addDoc(collection(db, "donations"), {
                campaignId: campaignId,
                name: displayName,
                email: email,
                phone: phone,
                amount: amount,
                billingName: billingName,
                billingAddress: billingAddress,
                billingCity: billingCity,
                billingZip: billingZip,
                message: message,
                method: method,
                status: 'pending',
                timestamp: serverTimestamp()
            });
        } else {
            // Simulation mode if no DB
            console.log("Simulating donation:", { name: displayName, amount, message });
            simulateLocalDonation({ name: displayName, amount, message, timestamp: new Date() });
        }

        // Reset form
        form.reset();
        amountBtns.forEach(b => b.classList.remove('selected'));
        amountBtns[2].classList.add('selected'); // Reset to default $50
        
        if (method === 'cash') {
            alert("Thank you! Please hand your cash donation to the organizer.");
        } else {
            alert("Thank you! Your donation is pending approval and will appear shortly.");
        }

    } catch (error) {
        console.error("Error adding donation: ", error);
        alert("Something went wrong. Please try again.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// Helper for simulation mode (when no Firebase config is present)
function simulateLocalDonation(data) {
    const li = document.createElement('li');
    li.className = 'donation-item';
    li.innerHTML = `
        <div class="donation-icon"><i class="fas fa-heart"></i></div>
        <div>
            <strong>${data.name}</strong> donated $${data.amount}
            ${data.message ? `<br><small>"${data.message}"</small>` : ''}
        </div>
    `;
    donationList.prepend(li);
    
    // Update totals manually for simulation
    let current = parseFloat(raisedDisplay.innerText.replace(/[^0-9.-]+/g,"")) || 0;
    current += data.amount;
    raisedDisplay.innerText = '$' + current.toLocaleString();
    
    let count = parseInt(donorCountDisplay.innerText) || 0;
    donorCountDisplay.innerText = count + 1;
    
    const percentage = Math.min((current / currentGoal) * 100, 100);
    progressBar.style.width = percentage + '%';
}