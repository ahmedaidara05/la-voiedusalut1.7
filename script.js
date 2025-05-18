// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAljojXHODwHjStePWkhthWLRzrw3pUslQ",
    authDomain: "la-voie-du-salut-36409.firebaseapp.com",
    projectId: "la-voie-du-salut-36409",
    storageBucket: "la-voie-du-salut-36409.firebasestorage.app",
    messagingSenderId: "61439310820",
    appId: "1:61439310820:web:52bfe8b862666ac13d25f1",
    measurementId: "G-G9S1ST8K3R"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', () => {
    let currentSection = 'accueil';
    let previousSection = 'accueil';
    let currentChapter = 'preambule';
    let userPrefs = { language: 'fr', theme: 'light', textSize: 16, voice: 'female' };

    // Navigation
    function showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            previousSection = currentSection;
            currentSection = sectionId;
            document.querySelectorAll('.bottom-bar .icon').forEach(icon => {
                icon.classList.toggle('active', icon.dataset.nav === sectionId);
            });
            document.querySelector('.ai-assistant-btn').style.display = ['sommaire', 'lecture', 'favoris'].includes(sectionId) ? 'flex' : 'none';
            if (sectionId === 'lecture') {
                showChapter(currentChapter);
            }
        }
    }

    function showChapter(chapterId) {
        document.querySelectorAll('.chapter-section').forEach(section => section.classList.remove('active'));
        const targetChapter = document.getElementById(`chapter-${chapterId}`);
        if (targetChapter) {
            targetChapter.classList.add('active');
            currentChapter = chapterId;
            document.getElementById('bookmark-btn').querySelector('i').textContent = isFavorite(chapterId) ? 'favorite' : 'favorite_border';
            updateNavigationArrows();
            targetChapter.scrollIntoView();
        }
    }

    function updateNavigationArrows() {
        const chapters = ['preambule', 'avant-propos', ...Array.from({ length: 42 }, (_, i) => (i + 1).toString())];
        const currentIndex = chapters.indexOf(currentChapter);
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        prevBtn.classList.toggle('disabled', currentIndex === 0);
        nextBtn.classList.toggle('disabled', currentIndex === chapters.length - 1);
    }

    // Authentification
    auth.onAuthStateChanged(user => {
        if (!user) {
            alert('Veuillez vous connecter pour accéder au contenu.');
            return;
        }
        loadUserProfile(user);
        loadFavorites();
        loadChatHistory(user);
    });

    function loadUserProfile(user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                userPrefs = { ...userPrefs, ...doc.data() };
                applyPrefs();
                document.getElementById('userName').value = user.displayName || 'Nom Utilisateur';
                document.getElementById('userEmail').value = user.email || 'utilisateur@example.com';
                document.getElementById('userPhone').value = doc.data().phone || '+1 (123) 456-7890';
                if (doc.data().photoURL) {
                    document.getElementById('userAvatar').src = doc.data().photoURL;
                }
            }
        });
    }

    function applyPrefs() {
        document.documentElement.style.fontSize = `${userPrefs.textSize}px`;
        document.getElementById('languageSelect').value = userPrefs.language;
        document.getElementById('themeSelect').value = userPrefs.theme;
        document.getElementById('textSize').value = userPrefs.textSize;
        document.getElementById('voiceSelect').value = userPrefs.voice;
        if (userPrefs.theme === 'dark') {
            document.getElementById('lecture').classList.add('dark-mode');
        } else {
            document.getElementById('lecture').classList.remove('dark-mode');
        }
    }

    // Anti-copie
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey && (e.key === 'c' || e.key === 'p')) || e.key === 'PrintScreen') {
            e.preventDefault();
        }
    });

    // Bouton Commencer
    document.getElementById('startButton')?.addEventListener('click', () => showSection('sommaire'));

    // Barre de navigation
    document.querySelectorAll('.bottom-bar .icon').forEach(icon => {
        icon.addEventListener('click', () => showSection(icon.dataset.nav));
    });

    // Sommaire
    document.querySelectorAll('#sommaire .chapter-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease ${index * 0.1}s`;
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
        card.addEventListener('click', () => {
            currentChapter = card.dataset.chapter;
            showSection('lecture');
        });
    });

    // Favoris
    function isFavorite(chapterId) {
        return JSON.parse(localStorage.getItem('favorites') || '[]').includes(chapterId);
    }

    function loadFavorites() {
        const favoritesList = document.getElementById('favoritesList');
        favoritesList.innerHTML = '';
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).collection('favorites').get().then(snapshot => {
                snapshot.forEach(doc => {
                    const chapter = doc.data();
                    const card = document.createElement('div');
                    card.classList.add('chapter-card');
                    card.dataset.chapter = doc.id;
                    card.innerHTML = `<h2>${chapter.title}</h2>`;
                    favoritesList.appendChild(card);
                    card.addEventListener('click', () => {
                        currentChapter = doc.id;
                        showSection('lecture');
                    });
                });
            });
        }
    }

    // Lecture
    const lectureSection = document.getElementById('lecture');
    if (lectureSection) {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.querySelector('.theme-icon');
        const zoomControls = document.getElementById('zoom-controls');
        const bookContent = document.querySelector('.book-content');
        const audioReader = document.getElementById('audio-reader');
        const bookmarkBtn = document.getElementById('bookmark-btn');
        const languageSwitcher = document.getElementById('language-switcher');
        let fontSize = userPrefs.textSize;
        let isReading = false;

        themeToggle.addEventListener('click', () => {
            lectureSection.classList.toggle('dark-mode');
            themeIcon.classList.toggle('rotate-left');
            themeIcon.textContent = lectureSection.classList.contains('dark-mode') ? 'brightness_7' : 'brightness_4';
            userPrefs.theme = lectureSection.classList.contains('dark-mode') ? 'dark' : 'light';
            savePrefs();
        });

        zoomControls.addEventListener('click', () => {
            fontSize = fontSize >= 22 ? 16 : fontSize + 2;
            bookContent.style.fontSize = `${fontSize}px`;
            zoomControls.querySelector('i').textContent = fontSize >= 22 ? 'zoom_out' : 'zoom_in';
            userPrefs.textSize = fontSize;
            savePrefs();
        });

        audioReader.addEventListener('click', () => {
            isReading = !isReading;
            const text = document.querySelector(`#chapter-${currentChapter}`).textContent;
            if (isReading) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = userPrefs.language;
                utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes(userPrefs.voice)) || null;
                speechSynthesis.speak(utterance);
                audioReader.querySelector('i').textContent = 'stop';
            } else {
                speechSynthesis.cancel();
                audioReader.querySelector('i').textContent = 'headphones';
            }
        });

        bookmarkBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                const chapterRef = db.collection('users').doc(user.uid).collection('favorites').doc(currentChapter);
                const icon = bookmarkBtn.querySelector('i');
                if (icon.textContent === 'favorite_border') {
                    const title = document.querySelector(`#chapter-${currentChapter} h2`).textContent;
                    chapterRef.set({ title });
                    icon.textContent = 'favorite';
                    icon.style.color = '#e74c3c';
                } else {
                    chapterRef.delete();
                    icon.textContent = 'favorite_border';
                    icon.style.color = '';
                }
                loadFavorites();
            }
        });

        languageSwitcher.addEventListener('click', () => {
            userPrefs.language = userPrefs.language === 'fr' ? 'en' : userPrefs.language === 'en' ? 'ar' : 'fr';
            savePrefs();
            location.reload();
        });

        document.getElementById('back-btn').addEventListener('click', () => showSection('sommaire'));

        document.getElementById('prev-chapter').addEventListener('click', () => {
            const chapters = ['preambule', 'avant-propos', ...Array.from({ length: 42 }, (_, i) => (i + 1).toString())];
            const currentIndex = chapters.indexOf(currentChapter);
            if (currentIndex > 0) {
                currentChapter = chapters[currentIndex - 1];
                showChapter(currentChapter);
            }
        });

        document.getElementById('next-chapter').addEventListener('click', () => {
            const chapters = ['preambule', 'avant-propos', ...Array.from({ length: 42 }, (_, i) => (i + 1).toString())];
            const currentIndex = chapters.indexOf(currentChapter);
            if (currentIndex < chapters.length - 1) {
                currentChapter = chapters[currentIndex + 1];
                showChapter(currentChapter);
            }
        });

        bookContent.addEventListener('scroll', () => {
            const user = auth.currentUser;
            if (user) {
                const progress = (bookContent.scrollTop / (bookContent.scrollHeight - bookContent.clientHeight)) * 100;
                db.collection('users').doc(user.uid).collection('progress').doc(currentChapter).set({ progress });
            }
        });
    }

    // Paramètres
    const parametresSection = document.getElementById('parametres');
    if (parametresSection) {
        document.getElementById('backBtn').addEventListener('click', () => showSection(previousSection));
        document.getElementById('userName').addEventListener('change', () => {
            const user = auth.currentUser;
            if (user) {
                auth.currentUser.updateProfile({ displayName: document.getElementById('userName').value });
                db.collection('users').doc(user.uid).update({ name: document.getElementById('userName').value });
            }
        });
        document.getElementById('userEmail').addEventListener('change', () => {
            const user = auth.currentUser;
            if (user) {
                auth.currentUser.updateEmail(document.getElementById('userEmail').value).catch(() => alert('Erreur lors de la mise à jour de l’email.'));
                db.collection('users').doc(user.uid).update({ email: document.getElementById('userEmail').value });
            }
        });
        document.getElementById('userPhone').addEventListener('change', () => {
            const user = auth.currentUser;
            if (user) {
                db.collection('users').doc(user.uid).update({ phone: document.getElementById('userPhone').value });
            }
        });
        document.getElementById('resetPassword').addEventListener('click', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (user) {
                auth.sendPasswordResetEmail(user.email).then(() => alert('Email de réinitialisation envoyé.'));
            }
        });
        document.getElementById('languageSelect').addEventListener('change', () => {
            userPrefs.language = document.getElementById('languageSelect').value;
            savePrefs();
            location.reload();
        });
        document.getElementById('textSize').addEventListener('input', () => {
            userPrefs.textSize = parseInt(document.getElementById('textSize').value);
            applyPrefs();
            savePrefs();
        });
        document.getElementById('themeSelect').addEventListener('change', () => {
            userPrefs.theme = document.getElementById('themeSelect').value;
            applyPrefs();
            savePrefs();
        });
        document.getElementById('voiceSelect').addEventListener('change', () => {
            userPrefs.voice = document.getElementById('voiceSelect').value;
            savePrefs();
        });
        document.getElementById('userAvatar').addEventListener('click', () => document.getElementById('avatarUpload').click());
        document.getElementById('avatarUpload').addEventListener('change', () => {
            const user = auth.currentUser;
            if (user && document.getElementById('avatarUpload').files[0]) {
                const file = document.getElementById('avatarUpload').files[0];
                storage.ref(`avatars/${user.uid}`).put(file).then(snapshot => {
                    snapshot.ref.getDownloadURL().then(url => {
                        document.getElementById('userAvatar').src = url;
                        auth.currentUser.updateProfile({ photoURL: url });
                        db.collection('users').doc(user.uid).update({ photoURL: url });
                    });
                });
            }
        });
    }

    function savePrefs() {
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).set(userPrefs, { merge: true });
        }
        localStorage.setItem('prefs', JSON.stringify(userPrefs));
    }

    // Assistant IA
    const aiAssistantBtn = document.getElementById('aiAssistantBtn');
    if (aiAssistantBtn) {
        const aiChatContainer = document.getElementById('aiChatContainer');
        const aiCloseBtn = document.getElementById('aiCloseBtn');
        const aiChatMessages = document.getElementById('aiChatMessages');
        const aiUserInput = document.getElementById('aiUserInput');
        const aiSendBtn = document.getElementById('aiSendBtn');
        const aiTypingIndicator = document.getElementById('aiTypingIndicator');
        const aiClearHistoryBtn = document.getElementById('aiClearHistoryBtn');

        aiAssistantBtn.addEventListener('click', () => {
            aiChatContainer.classList.toggle('active');
            if (aiChatContainer.classList.contains('active')) {
                aiUserInput.focus();
            }
        });
        aiCloseBtn.addEventListener('click', () => {
            aiChatContainer.classList.remove('active');
        });

        function addMessage(text, sender) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', `${sender}-message`);
            messageElement.textContent = text;
            aiChatMessages.appendChild(messageElement);
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
            const user = auth.currentUser;
            if (user) {
                db.collection('users').doc(user.uid).collection('chatHistory').add({
                    text,
                    sender,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        function loadChatHistory(user) {
            db.collection('users').doc(user.uid).collection('chatHistory').orderBy('timestamp').get().then(snapshot => {
                snapshot.forEach(doc => {
                    const { text, sender } = doc.data();
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message', `${sender}-message`);
                    messageElement.textContent = text;
                    aiChatMessages.appendChild(messageElement);
                });
                aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
            });
        }

        function simulateAIReply(userMessage) {
            aiTypingIndicator.classList.add('active');
            aiUserInput.disabled = true;
            aiSendBtn.disabled = true;
            setTimeout(() => {
                aiTypingIndicator.classList.remove('active');
                const lowerMsg = userMessage.toLowerCase();
                let reply = lowerMsg.includes('bonjour') || lowerMsg.includes('salut') ?
                    'Bonjour ! Comment puis-je vous aider ?' :
                    `Je comprends votre demande concernant "${userMessage}". Voici une réponse...`;
                addMessage(reply, 'ai');
                aiUserInput.disabled = false;
                aiSendBtn.disabled = false;
                aiUserInput.focus();
            }, 1500);
        }

        aiSendBtn.addEventListener('click', () => {
            const message = aiUserInput.value.trim();
            if (message) {
                addMessage(message, 'user');
                aiUserInput.value = '';
                simulateAIReply(message);
            }
        });

        aiUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = aiUserInput.value.trim();
                if (message) {
                    addMessage(message, 'user');
                    aiUserInput.value = '';
                    simulateAIReply(message);
                }
            }
        });

        aiClearHistoryBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                db.collection('users').doc(user.uid).collection('chatHistory').get().then(snapshot => {
                    snapshot.forEach(doc => doc.ref.delete());
                });
                aiChatMessages.innerHTML = '';
            }
        });

        setTimeout(() => {
            addMessage('Bonjour ! Je suis votre Assistant Premium. Comment puis-je vous aider ?', 'ai');
        }, 1000);
    }
});
