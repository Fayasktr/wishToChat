// PIN Logic
let currentPin = "";
const PIN_LENGTH = 4;

function appendNumber(num, event) {
    if (currentPin.length < PIN_LENGTH) {
        currentPin += num;
        updatePinDisplay();

        // Haptic feedback feel
        if (event && event.target && typeof gsap !== 'undefined') {
            gsap.to(event.target, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
        }

        if (currentPin.length === PIN_LENGTH) {
            submitPin();
        }
    }
}

function deleteNumber() {
    if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDisplay();
    }
}

function updatePinDisplay() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < currentPin.length) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function submitPin() {
    const input = document.getElementById('secretCodeInput');
    const form = document.getElementById('loginForm');
    input.value = currentPin;

    // Slight delay for visual satisfaction
    setTimeout(() => {
        form.submit();
    }, 300);
}

// Heart Particle System
function createHeart() {
    const container = document.getElementById('heart-container');
    if (!container) return;

    const heart = document.createElement('div');
    heart.className = 'heart-particle';
    heart.innerHTML = '❤';

    const size = Math.random() * 20 + 10;
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.top = '110vh';
    heart.style.fontSize = size + 'px';
    heart.style.color = `hsl(${Math.random() * 30 + 330}, 100%, 75%)`;

    container.appendChild(heart);

    gsap.to(heart, {
        y: '-120vh',
        x: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 360,
        duration: Math.random() * 5 + 5,
        ease: "none",
        onComplete: () => heart.remove()
    });
}

// Initial Animations
document.addEventListener('DOMContentLoaded', () => {
    // Start hearts
    setInterval(createHeart, 400);

    const loginCard = document.getElementById('loginCard');
    const keys = document.querySelectorAll('.key');

    // Ensure elements are at least partially ready
    if (typeof gsap !== 'undefined') {
        // Entry animation for the card
        gsap.fromTo(loginCard,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
        );

        // Stagger keypad entry
        gsap.fromTo(keys,
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                stagger: 0.05,
                ease: "back.out(1.7)",
                delay: 0.5,
                // Fallback: ensure visible even if interrupted
                onComplete: () => {
                    keys.forEach(k => { k.style.opacity = "1"; k.style.transform = "scale(1)"; });
                }
            }
        );
    } else {
        // Fallback if GSAP is not loaded
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
        keys.forEach(k => {
            k.style.opacity = '1';
            k.style.transform = 'scale(1)';
        });
    }

    // Check for error state from server
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg && typeof gsap !== 'undefined') {
        gsap.to("#loginCard", {
            x: 10,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            ease: "power1.inOut",
            onComplete: () => gsap.to("#loginCard", { x: 0 })
        });

        // Shake the dots too
        gsap.to(".pin-dot", {
            borderColor: "#ff4d4d",
            duration: 0.1,
            repeat: 5,
            yoyo: true
        });
    }
});
