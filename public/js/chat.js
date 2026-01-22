let socket;
let currentUser = JSON.parse(localStorage.getItem('chatUser'));
let token = localStorage.getItem('chatToken');
let mediaRecorder;
let audioChunks = [];
let selectionMode = false;
let selectedMessages = new Set();
let replyingToId = null;
let lastAppendedDate = null;

const API_BASE = '/chat-api';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token && currentUser) {
        initChat();
    } else {
        document.getElementById('auth-modal').style.display = 'flex';
    }

    // Menu Toggle
    const menuTrigger = document.getElementById('menu-trigger');
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (menuTrigger) {
        menuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.remove('show');
    });
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('auth-error');

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.error) {
            errorEl.innerText = data.error;
        } else {
            localStorage.setItem('chatToken', data.token);
            localStorage.setItem('chatUser', JSON.stringify(data.user));
            token = data.token;
            currentUser = data.user;
            initChat();
        }
    } catch (err) {
        errorEl.innerText = 'Login failed';
    }
});

async function initChat() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('chat-app').style.display = 'flex';

    // Fetch partner info
    const pRes = await fetch(`${API_BASE}/partner`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const partner = await pRes.json();
    localStorage.setItem('partnerId', partner._id);

    // Set Partner Info
    document.getElementById('partner-name').innerText = partner.name;
    const avatarEl = document.getElementById('partner-avatar');
    if (partner.name.toLowerCase() === 'safeena') {
        avatarEl.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Safeena&backgroundColor=FF69B4&mood[]=happy';
    } else {
        avatarEl.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fayas&backgroundColor=4A90E2&mood[]=happy';
    }

    socket = io({ auth: { token } });

    socket.on('connect', () => {
        fetchHistory();
        requestNotificationPermission();
    });

    socket.on('message', (msg) => {
        appendMessage(msg);
        if (document.hidden) {
            showNotification(msg);
        }
        if (!document.hidden && msg.senderId !== currentUser._id) {
            socket.emit('markSeen', { senderId: msg.senderId });
        }
    });

    socket.on('statusUpdate', (data) => {
        fetchHistory();
    });

    socket.on('typing', (data) => {
        document.getElementById('typing-indicator').style.display = data.isTyping ? 'block' : 'none';
    });

    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    let typingTimeout;
    input.addEventListener('input', function () {
        // Auto-resize
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';

        socket.emit('typing', { isTyping: true });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing', { isTyping: false });
        }, 2000);
    });

    document.getElementById('send-btn').addEventListener('click', sendMessage);
}

async function fetchHistory() {
    const res = await fetch(`${API_BASE}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await res.json();
    document.getElementById('message-container').innerHTML = '';
    lastAppendedDate = null; // Reset
    messages.forEach(appendMessage);
    scrollToBottom();

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && (lastMsg.senderId._id || lastMsg.senderId) !== currentUser._id) {
        socket.emit('markSeen', { senderId: lastMsg.senderId._id || lastMsg.senderId });
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;

    socket.emit('sendMessage', {
        receiverId: localStorage.getItem('partnerId'),
        content,
        type: 'text',
        replyTo: replyingToId
    });

    input.value = '';
    input.style.height = 'auto'; // Reset height
    cancelReply();
}

function setReply(messageId, content, senderName) {
    replyingToId = messageId;
    const replyBox = document.getElementById('reply-box');
    const replyText = document.getElementById('reply-text');
    const replyContent = document.getElementById('reply-content');

    replyText.innerText = `Replying to ${senderName}`;
    replyContent.innerText = content.length > 50 ? content.substring(0, 50) + '...' : content;
    replyBox.style.display = 'block';
    document.getElementById('chat-input').focus();
}

function cancelReply() {
    replyingToId = null;
    document.getElementById('reply-box').style.display = 'none';
}

function appendMessage(msg) {
    const container = document.getElementById('message-container');
    const msgDate = new Date(msg.timestamp).toDateString();

    // Insert date separator if day changed
    if (msgDate !== lastAppendedDate) {
        const separator = document.createElement('div');
        separator.className = 'date-separator';
        separator.innerHTML = `<span>${getDisplayDate(msg.timestamp)}</span>`;
        container.appendChild(separator);
        lastAppendedDate = msgDate;
    }

    const senderId = msg.senderId._id || msg.senderId;
    const side = senderId === currentUser._id ? 'sent' : 'received';
    const senderName = msg.senderId.name || (side === 'sent' ? currentUser.name : document.getElementById('partner-name').innerText);

    const div = document.createElement('div');
    div.className = `message ${side}`;
    div.dataset.id = msg._id;

    if (msg.deletedGlobally) {
        div.innerHTML = '<span class="deleted-msg">This message was deleted</span>';
    } else {
        // Render Reply UI if exists
        if (msg.replyTo) {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'quoted-message';
            const replyContent = msg.replyTo.type === 'audio' ? '🎤 Audio Message' : msg.replyTo.content;
            replyDiv.innerText = replyContent.length > 40 ? replyContent.substring(0, 40) + '...' : replyContent;
            replyDiv.onclick = (e) => {
                e.stopPropagation();
                const target = document.querySelector(`.message[data-id="${msg.replyTo._id}"]`);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
            div.appendChild(replyDiv);
        }

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        if (msg.type === 'text') {
            messageText.innerText = msg.content;
        } else if (msg.type === 'audio') {
            messageText.innerHTML = `<audio controls src="${msg.mediaUrl}"></audio>`;
        }
        div.appendChild(messageText);

        // Reply Action Button
        const replyBtn = document.createElement('div');
        replyBtn.className = 'reply-action';
        replyBtn.innerHTML = '↩️';
        replyBtn.onclick = (e) => {
            e.stopPropagation();
            setReply(msg._id, msg.type === 'audio' ? 'Audio Message' : msg.content, senderName);
        };
        div.appendChild(replyBtn);

        const info = document.createElement('div');
        info.className = 'message-info';
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let ticks = '';
        if (side === 'sent') {
            if (msg.status === 'sent') ticks = '✓';
            else if (msg.status === 'delivered') ticks = '✓✓';
            else if (msg.status === 'seen') ticks = '<span class="status-tick seen">✓✓</span>';
        }

        info.innerHTML = `<span>${time}</span>${ticks ? `<span class="status-tick">${ticks}</span>` : ''}`;
        div.appendChild(info);

        div.onclick = () => {
            if (selectionMode) {
                toggleMessageSelection(div, msg._id);
            }
        };

        div.oncontextmenu = (e) => {
            e.preventDefault();
            if (!selectionMode) {
                toggleSelectionMode();
                toggleMessageSelection(div, msg._id);
            }
        };
    }

    container.appendChild(div);
}

// Selection Functions
function toggleSelectionMode() {
    selectionMode = !selectionMode;
    const bar = document.getElementById('selection-bar');
    const inputArea = document.getElementById('chat-input-area');

    if (selectionMode) {
        bar.classList.add('show');
        inputArea.style.opacity = '0.5';
        inputArea.style.pointerEvents = 'none';
        document.querySelectorAll('.message').forEach(m => m.classList.add('selecting'));
    } else {
        cancelSelection();
    }
}

function toggleMessageSelection(el, id) {
    if (selectedMessages.has(id)) {
        selectedMessages.delete(id);
        el.classList.remove('selected');
    } else {
        selectedMessages.add(id);
        el.classList.add('selected');
    }
    document.getElementById('selected-count').innerText = `${selectedMessages.size} messages selected`;
}

function cancelSelection() {
    selectionMode = false;
    selectedMessages.clear();
    document.getElementById('selection-bar').classList.remove('show');
    const inputArea = document.getElementById('chat-input-area');
    inputArea.style.opacity = '1';
    inputArea.style.pointerEvents = 'auto';
    document.querySelectorAll('.message').forEach(m => {
        m.classList.remove('selecting', 'selected');
    });
}

// Objective 3 & 4: Selection and Delete with Custom Popup
function deleteSelected() {
    if (selectedMessages.size === 0) return;

    showModal(
        'Delete Messages',
        `Are you sure you want to delete ${selectedMessages.size} messages?`,
        async () => {
            for (const id of selectedMessages) {
                // Determine if we can delete for both (only if SENT by current user)
                const msgEl = document.querySelector(`.message[data-id="${id}"]`);
                const type = msgEl.classList.contains('sent') ? 'both' : 'self';

                await fetch(`${API_BASE}/delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ messageId: id, type })
                });
            }
            closeModal();
            cancelSelection();
            fetchHistory();
        }
    );
}

// Objective 2: Fayas "Delete All" for Both
function confirmClearChat(type) {
    const title = type === 'both' ? 'Wipe Chat for Both?' : 'Clear Chat for Me?';
    const text = type === 'both' ? 'This will delete ALL messages for both of you. This cannot be undone.' : 'This will hide all messages from your view.';

    showModal(title, text, async () => {
        const res = await fetch(`${API_BASE}/delete-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type })
        });
        if (res.ok) {
            closeModal();
            fetchHistory();
        }
    });
}

// Modal Helper
function showModal(title, text, onConfirm) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = text;
    const confirmBtn = document.getElementById('modal-confirm-btn');

    // Remote old listeners
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.onclick = onConfirm;
    document.getElementById('custom-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
}

function scrollToBottom() {
    const container = document.getElementById('message-container');
    container.scrollTop = container.scrollHeight;
}

// Audio Recording
const recordBtn = document.getElementById('record-btn');
if (recordBtn) {
    recordBtn.addEventListener('click', async () => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob);

                const res = await fetch(`${API_BASE}/upload-audio`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();

                socket.emit('sendMessage', {
                    receiverId: localStorage.getItem('partnerId'),
                    type: 'audio',
                    mediaUrl: data.url
                });
            };

            mediaRecorder.start();
            recordBtn.classList.add('recording');
            recordBtn.innerText = '🛑';
        } else {
            mediaRecorder.stop();
            recordBtn.classList.remove('recording');
            recordBtn.innerText = '🎤';
        }
    });
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function showNotification(msg) {
    if (Notification.permission === 'granted' && (msg.senderId._id || msg.senderId) !== currentUser._id) {
        new Notification('New Whisper ❤️', {
            body: msg.type === 'text' ? msg.content : 'Sent an audio message'
        });
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function getDisplayDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

window.addEventListener('focus', () => {
    if (socket && localStorage.getItem('partnerId')) {
        socket.emit('markSeen', { senderId: localStorage.getItem('partnerId') });
    }
});
