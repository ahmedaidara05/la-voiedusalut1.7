document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    let currentSection = 'accueil';
    function showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            currentSection = sectionId;
            document.querySelectorAll('.bottom-bar .icon').forEach(icon => {
                icon.classList.toggle('active', icon.dataset.nav === sectionId);
            });
            document.querySelector('.ai-assistant-btn').style.display = ['sommaire', 'lecture', 'favoris'].includes(sectionId) ? 'flex' : 'none';
        }
    }

    // Bouton Commencer
    document.getElementById('startButton')?.addEventListener('click', () => showSection('sommaire'));

    // Barre de navigation inférieure
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
            const chapter = card.dataset.chapter;
            showSection('lecture');
            document.getElementById(`chapter${chapter}`).scrollIntoView();
        });
    });

    // Favoris
    function loadFavorites() {
        const favoritesList = document.getElementById('favoritesList');
        favoritesList.innerHTML = '';
        // Exemple statique pour démontrer
        const favorites = [
            { id: '1', title: 'Chapitre 1 : L’Aube Nouvelle' },
            { id: '3', title: 'Chapitre 3 : La Quête de Clara' }
        ];
        favorites.forEach(chapter => {
            const card = document.createElement('div');
            card.classList.add('chapter-card');
            card.dataset.chapter = chapter.id;
            card.innerHTML = `<h2>${chapter.title}</h2>`;
            favoritesList.appendChild(card);
            card.addEventListener('click', () => {
                showSection('lecture');
                document.getElementById(`chapter${chapter.id}`).scrollIntoView();
            });
        });
    }
    document.getElementById('favoris')?.addEventListener('click', loadFavorites);

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
        let fontSize = 18;
        let isReading = false;

        themeToggle.addEventListener('click', () => {
            lectureSection.classList.toggle('dark-mode');
            themeIcon.classList.toggle('rotate-left');
            themeIcon.textContent = lectureSection.classList.contains('dark-mode') ? 'brightness_7' : 'brightness_4';
        });

        zoomControls.addEventListener('click', () => {
            fontSize = fontSize >= 22 ? 16 : fontSize + 2;
            bookContent.style.fontSize = fontSize + 'px';
            zoomControls.querySelector('i').textContent = fontSize >= 22 ? 'zoom_out' : 'zoom_in';
        });

        audioReader.addEventListener('click', () => {
            isReading = !isReading;
            alert(isReading ? 'Lecture audio démarrée' : 'Lecture audio arrêtée');
            audioReader.querySelector('i').textContent = isReading ? 'stop' : 'headphones';
        });

        bookmarkBtn.addEventListener('click', () => {
            const icon = bookmarkBtn.querySelector('i');
            if (icon.textContent === 'favorite_border') {
                icon.textContent = 'favorite';
                icon.style.color = '#e74c3c';
            } else {
                icon.textContent = 'favorite_border';
                icon.style.color = '';
            }
        });

        languageSwitcher.addEventListener('click', () => {
            alert('Changement de langue');
        });

        document.getElementById('back-btn').addEventListener('click', () => showSection('sommaire'));
    }

    // Paramètres
    const parametresSection = document.getElementById('parametres');
    if (parametresSection) {
        document.getElementById('backBtn').addEventListener('click', () => showSection('accueil'));
        document.getElementById('userName').addEventListener('change', () => console.log('Nom mis à jour:', document.getElementById('userName').value));
        document.getElementById('userEmail').addEventListener('change', () => console.log('Email mis à jour:', document.getElementById('userEmail').value));
        document.getElementById('userPhone').addEventListener('change', () => console.log('Téléphone mis à jour:', document.getElementById('userPhone').value));
        document.getElementById('resetPassword').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Email de réinitialisation envoyé');
        });
        document.getElementById('languageSelect').addEventListener('change', () => console.log('Langue:', document.getElementById('languageSelect').value));
        document.getElementById('textSize').addEventListener('input', () => {
            document.documentElement.style.fontSize = `${document.getElementById('textSize').value}px`;
        });
        document.getElementById('themeSelect').addEventListener('change', () => console.log('Thème:', document.getElementById('themeSelect').value));
        document.getElementById('voiceSelect').addEventListener('change', () => console.log('Voix:', document.getElementById('voiceSelect').value));
        document.getElementById('userAvatar').addEventListener('click', () => document.getElementById('avatarUpload').click());
        document.getElementById('avatarUpload').addEventListener('change', () => {
            if (document.getElementById('avatarUpload').files[0]) {
                document.getElementById('userAvatar').src = URL.createObjectURL(document.getElementById('avatarUpload').files[0]);
            }
        });
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
            aiChatMessages.innerHTML = '';
        });
        setTimeout(() => {
            addMessage('Bonjour ! Je suis votre Assistant Premium. Comment puis-je vous aider ?', 'ai');
        }, 1000);
    }
});
