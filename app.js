import { skills, mockPosts } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjWH8uqVmOwvZxdwbT5pNzeW_gsQWqbho",
    authDomain: "business-starter-8543c.firebaseapp.com",
    projectId: "business-starter-8543c",
    storageBucket: "business-starter-8543c.firebasestorage.app",
    messagingSenderId: "647177045193",
    appId: "1:647177045193:web:9da57d0944eb36c5f4f918",
    measurementId: "G-YD3NYW2LM5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', async () => {
    // State
    let selectedSkills = new Set();
    let posts = []; // This will be populated from Firebase

    // DOM Elements
    const skillsContainer = document.getElementById('skills-container');
    const feedContainer = document.getElementById('feed-container');
    const postCountEl = document.getElementById('post-count');
    
    const navHome = document.getElementById('nav-home');
    const navAdmin = document.getElementById('nav-admin');
    const navGetStarted = document.getElementById('nav-get-started');
    const navSkills = document.getElementById('nav-skills');
    const navUserProfile = document.getElementById('nav-user-profile');
    const navUserPhoto = document.getElementById('nav-user-photo');
    const navUserName = document.getElementById('nav-user-name');
    const navDropdown = document.getElementById('nav-dropdown');
    const navBtnProfile = document.getElementById('nav-btn-profile');
    const navBtnSignOut = document.getElementById('nav-btn-sign-out');
    
    const viewHome = document.getElementById('view-home');
    const viewAdmin = document.getElementById('view-admin');
    const viewGetStarted = document.getElementById('view-get-started');
    const viewSkills = document.getElementById('view-skills');

    const adminForm = document.getElementById('admin-form');
    const adminMessage = document.getElementById('admin-message');
    
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnSignOut = document.getElementById('btn-sign-out');
    const authUnauthenticated = document.getElementById('auth-unauthenticated');
    const authAuthenticated = document.getElementById('auth-authenticated');
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userPhotoEl = document.getElementById('user-photo');

    // Seed mock data if database is empty
    await seedDatabaseIfEmpty();

    // Initialize UI
    renderSkills();

    // Listen to real-time updates from Firestore
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        posts = [];
        snapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        renderFeed();
    });

    // 1. Render Skills
    function renderSkills() {
        skillsContainer.innerHTML = '';
        skills.forEach(skill => {
            const chip = document.createElement('div');
            chip.className = 'skill-chip';
            chip.textContent = skill.name;
            chip.dataset.id = skill.id;
            
            if(selectedSkills.has(skill.id)) {
                chip.classList.add('selected');
            }

            chip.addEventListener('click', () => toggleSkill(skill.id, chip));
            skillsContainer.appendChild(chip);
        });
    }

    function toggleSkill(skillId, chipElement) {
        if (selectedSkills.has(skillId)) {
            selectedSkills.delete(skillId);
            chipElement.classList.remove('selected');
        } else {
            selectedSkills.add(skillId);
            chipElement.classList.add('selected');
        }
        renderFeed();
    }

    // 2. Render Feed
    function renderFeed() {
        feedContainer.innerHTML = '';
        
        const filteredPosts = posts.filter(post => {
            if (selectedSkills.size === 0) return true;
            if (!post.skills) return false;
            return post.skills.some(skill => selectedSkills.has(skill));
        });

        postCountEl.textContent = filteredPosts.length;

        if (filteredPosts.length === 0) {
            feedContainer.innerHTML = '<p style="color: var(--text-muted);">No case studies match your selected skills. Try selecting others!</p>';
            return;
        }

        filteredPosts.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.style.animationDelay = `${index * 0.1}s`;

            const isSuccess = post.type === 'success';
            const badgeClass = isSuccess ? 'success' : 'fail';
            const badgeText = isSuccess ? 'Success Story' : 'Failure Analysis';

            const skillsHtml = (post.skills || []).map(s => {
                const skillName = skills.find(sk => sk.id === s)?.name || s;
                return `<span class="post-skill-tag">${skillName}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="post-header">
                    <div>
                        <h4 class="post-title">${post.title}</h4>
                        <div class="post-meta">
                            <span>By ${post.author}</span>
                            <span>•</span>
                            <span>${(post.views || 0).toLocaleString()} views</span>
                        </div>
                    </div>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-skills">
                    ${skillsHtml}
                </div>
            `;
            feedContainer.appendChild(card);
        });
    }

    // 3. Navigation Logic
    function switchView(viewToShow, navToActivate) {
        // Hide all views
        viewHome.classList.add('view-hidden');
        viewAdmin.classList.add('view-hidden');
        viewGetStarted.classList.add('view-hidden');
        viewSkills.classList.add('view-hidden');
        
        // Remove active class from all navs
        navHome.classList.remove('active');
        navAdmin.classList.remove('active');
        navGetStarted.classList.remove('active');
        navSkills.classList.remove('active');
        
        // Show selected view & active nav
        viewToShow.classList.remove('view-hidden');
        navToActivate.classList.add('active');
    }

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(viewHome, navHome);
    });

    navAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(viewAdmin, navAdmin);
    });
    
    navGetStarted.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(viewGetStarted, navGetStarted);
    });

    navSkills.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(viewSkills, navSkills);
    });

    // Profile Dropdown Logic
    navUserProfile.addEventListener('click', (e) => {
        navDropdown.classList.toggle('hidden');
        e.stopPropagation();
    });

    window.addEventListener('click', (e) => {
        if (!navUserProfile.contains(e.target)) {
            navDropdown.classList.add('hidden');
        }
    });

    // 4. Admin Form Logic
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('admin-title').value;
        const type = document.getElementById('admin-type').value;
        const skillsInput = document.getElementById('admin-skills').value;
        const content = document.getElementById('admin-content').value;

        const newSkills = skillsInput.split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0);

        try {
            await addDoc(collection(db, "posts"), {
                title: title,
                type: type,
                skills: newSkills,
                content: content,
                views: 0,
                author: "Admin",
                createdAt: serverTimestamp()
            });

            adminMessage.textContent = "Case study successfully published to the live feed!";
            adminMessage.className = "success-msg";
            adminForm.reset();
        } catch (error) {
            console.error("Error adding document: ", error);
            adminMessage.textContent = "Error publishing case study. Check console.";
            adminMessage.className = "success-msg";
            adminMessage.style.borderColor = "red";
            adminMessage.style.color = "red";
            adminMessage.style.backgroundColor = "rgba(255,0,0,0.1)";
        }

        setTimeout(() => {
            adminMessage.className = "hidden";
        }, 3000);
    });

    // 5. Auth Logic
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in.
            authUnauthenticated.classList.add('hidden');
            authAuthenticated.classList.remove('hidden');
            navSkills.classList.remove('hidden');
            
            navGetStarted.classList.add('hidden');
            navUserProfile.classList.remove('hidden');
            
            navUserName.textContent = user.displayName || 'User';
            if (user.photoURL) {
                navUserPhoto.src = user.photoURL;
                navUserPhoto.style.display = 'block';
            } else {
                navUserPhoto.style.display = 'none';
            }
            
            userNameEl.textContent = `Welcome, ${user.displayName || 'User'}!`;
            userEmailEl.textContent = user.email;
            
            if (user.photoURL) {
                userPhotoEl.src = user.photoURL;
                userPhotoEl.style.display = 'block';
            } else {
                userPhotoEl.style.display = 'none';
            }
        } else {
            // User is signed out.
            authUnauthenticated.classList.remove('hidden');
            authAuthenticated.classList.add('hidden');
            navSkills.classList.add('hidden');
            
            navGetStarted.classList.remove('hidden');
            navUserProfile.classList.add('hidden');
        }
    });

    btnGoogleLogin.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Logged in successfully:", result.user);
                sessionStorage.setItem('justLoggedIn', 'true');
                window.location.reload();
            }).catch((error) => {
                console.error("Login error:", error);
                alert("Failed to sign in. See console for details.");
            });
    });

    btnSignOut.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Signed out successfully");
            window.location.reload();
        }).catch((error) => {
            console.error("Sign out error:", error);
        });
    });

    navBtnSignOut.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Signed out successfully");
            window.location.reload();
        }).catch((error) => {
            console.error("Sign out error:", error);
        });
    });

    // 5. Database Seeding Script (runs once if db is empty)
    async function seedDatabaseIfEmpty() {
        const postsCol = collection(db, "posts");
        const snapshot = await getDocs(postsCol);
        if (snapshot.empty) {
            console.log("Database is empty. Seeding with mock data...");
            for (let i = 0; i < mockPosts.length; i++) {
                const p = mockPosts[i];
                await addDoc(postsCol, {
                    title: p.title,
                    type: p.type,
                    skills: p.skills,
                    content: p.content,
                    views: p.views,
                    author: p.author,
                    createdAt: serverTimestamp() // To order them properly
                });
            }
            console.log("Seeding complete!");
        }
    }

    // Redirect to skills view if we just logged in
    if (sessionStorage.getItem('justLoggedIn') === 'true') {
        sessionStorage.removeItem('justLoggedIn');
        switchView(viewSkills, navSkills);
    }
});
