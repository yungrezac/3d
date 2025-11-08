const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

const participantInput = document.getElementById('participant-input');
const addParticipantBtn = document.getElementById('add-participant-btn');
const participantList = document.getElementById('participant-list');
const startBtn = document.getElementById('start-btn');

const wheelContainer = document.getElementById('wheel-container');
const spinBtn = document.getElementById('spin-btn');

const winner = document.getElementById('winner');
const playAgainBtn = document.getElementById('play-again-btn');

const popup = document.getElementById('popup');
const eliminatedMessage = document.getElementById('eliminated-message');
const closePopupBtn = document.getElementById('close-popup-btn');

let participants = [];
let participantColors = new Map();
let sketch;
let eliminatedParticipant = null;

addParticipantBtn.addEventListener('click', addParticipant);
participantInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addParticipant();
    }
});
startBtn.addEventListener('click', start);
spinBtn.addEventListener('click', () => sketch && sketch.spin());
playAgainBtn.addEventListener('click', reset);
closePopupBtn.addEventListener('click', closePopup);

function addParticipant() {
    const name = participantInput.value.trim();
    if (name) {
        participants.push(name);
        renderParticipants();
        participantInput.value = '';
    }
}

function renderParticipants() {
    participantList.innerHTML = '';
    participants.forEach((name, index) => {
        const li = document.createElement('li');
        li.textContent = name;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✖';
        removeBtn.className = 'remove-participant';
        removeBtn.addEventListener('click', () => {
            participants.splice(index, 1);
            renderParticipants();
        });
        li.appendChild(removeBtn);
        participantList.appendChild(li);
    });
}

function start() {
    if (participants.length > 1) {
        step1.style.display = 'none';
        step2.style.display = 'block';
        sketch = new p5(wheelSketch, wheelContainer);
    } else {
        alert('Пожалуйста, добавьте хотя бы двух участников.');
    }
}

function reset() {
    participants = [];
    participantColors.clear();
    renderParticipants();
    step3.style.display = 'none';
    step1.style.display = 'block';
    if(sketch) {
        sketch.remove();
        sketch = null;
    }
}

function showPopup(eliminated) {
    eliminatedParticipant = eliminated;
    eliminatedMessage.textContent = `${eliminated} выбывает!`;
    popup.style.display = 'flex';
}

function closePopup() {
    popup.style.display = 'none';
    const index = participants.indexOf(eliminatedParticipant);
    if (index > -1) {
        participants.splice(index, 1);
        if(sketch) {
            sketch.updateParticipants(participants);
        }
    }

    if (participants.length === 1) {
        step2.style.display = 'none';
        step3.style.display = 'block';
        winner.textContent = participants[0];
        if(sketch) {
            sketch.remove();
            sketch = null;
        }
    }
}

const wheelSketch = (p) => {
    let angle = 0;
    let diameter;
    let currentParticipants = [...participants];

    // New animation variables
    let spin = false;
    let startAngle = 0;
    let targetAngle = 0;
    let spinStartTime = 0;
    const spinDuration = 5000; // 5 seconds for a smoother spin

    p.setup = () => {
        let canvasSize = Math.min(wheelContainer.offsetWidth, 400);
        p.createCanvas(canvasSize, canvasSize);
        diameter = p.width * 0.9;
        currentParticipants.forEach(name => {
            if (!participantColors.has(name)) {
                participantColors.set(name, p.color(p.random(50, 220), p.random(50, 220), p.random(50, 220)));
            }
        });
    };
    
    // Easing function for smooth animation
    function easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
    }

    p.draw = () => {
        p.background(0,0,0,0);

        if (spin) {
            const elapsed = p.millis() - spinStartTime;
            if (elapsed < spinDuration) {
                const t = elapsed / spinDuration;
                const easedT = easeOutQuint(t);
                angle = p.lerp(startAngle, targetAngle, easedT);
            } else {
                angle = targetAngle;
                spin = false;
                handleResult();
            }
        }

        p.push();
        p.translate(p.width / 2, p.height / 2);
        p.rotate(angle);

        const arcSize = p.TWO_PI / currentParticipants.length;
        for (let i = 0; i < currentParticipants.length; i++) {
            const name = currentParticipants[i];
            p.fill(participantColors.get(name));
            p.arc(0, 0, diameter, diameter, i * arcSize, (i + 1) * arcSize);
        }

        for (let i = 0; i < currentParticipants.length; i++) {
            const textAngle = i * arcSize + arcSize / 2;
            p.push();
            p.rotate(textAngle);
            p.fill(255);
            p.textSize(16);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(currentParticipants[i], diameter / 4, 0);
            p.pop();
        }
        p.pop();
    };

    p.spin = () => {
        if (spin) return;

        const specialParticipant = "Khulapov leather craft";
        const totalArcs = currentParticipants.length;
        const arcSize = p.TWO_PI / totalArcs;

        // Determine a random target angle
        const randomSpins = p.random(6, 12);
        let destinationAngle = angle + randomSpins * p.TWO_PI;
        
        // Calculate which index it will land on
        // The pointer is at 1.5 * PI (top)
        let finalEffectiveAngle = (1.5 * p.PI - (destinationAngle % p.TWO_PI) + p.TWO_PI) % p.TWO_PI;
        let stoppedIndex = p.floor(finalEffectiveAngle / arcSize);
        let winner = currentParticipants[stoppedIndex];

        // If the winner is the special one, adjust the target
        if (winner === specialParticipant && currentParticipants.length > 1) {
            // Add enough rotation to land on the next participant
            destinationAngle += arcSize;
        }

        startAngle = angle;
        targetAngle = destinationAngle;
        spinStartTime = p.millis();
        spin = true;
    };

    p.updateParticipants = (newParticipants) => {
        currentParticipants = [...newParticipants];
        p.setup();
    };

    function handleResult() {
        const totalArcs = currentParticipants.length;
        const arcSize = p.TWO_PI / totalArcs;
        let finalEffectiveAngle = (1.5 * p.PI - (angle % p.TWO_PI) + p.TWO_PI) % p.TWO_PI;
        const stoppedIndex = p.floor(finalEffectiveAngle / arcSize);

        const eliminated = currentParticipants[stoppedIndex];
        showPopup(eliminated);
    }
};
