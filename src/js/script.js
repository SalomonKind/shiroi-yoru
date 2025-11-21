// Status Tracker
let maxHP = 13;
let currentHP = 13;
let maxPDR = 5;
let currentPDR = 5;

function modifyStat(stat, amount) {
    if (stat === 'hp') {
        currentHP += amount;
        if (currentHP > maxHP) currentHP = maxHP;
        document.getElementById('current-hp').innerText = currentHP;
        // Visual Warning
        if (currentHP <= 0) document.getElementById('hp-display').style.color = 'red';
        else document.getElementById('hp-display').style.color = 'inherit';
    } else if (stat === 'pdr') {
        currentPDR += amount;
        if (currentPDR > maxPDR) currentPDR = maxPDR;
        if (currentPDR < 0) currentPDR = 0;
        document.getElementById('current-pdr').innerText = currentPDR;
    }
}

// Dice Roller
function rollDice(sides, modifier, title) {
    const roll = Math.floor(Math.random() * sides) + 1;
    const total = roll + modifier;
    
    // Setup Modal
    const modal = document.getElementById('diceModal');
    const resultElem = document.getElementById('roll-result');
    const calcElem = document.getElementById('roll-calc');
    const titleElem = document.getElementById('roll-title');

    titleElem.innerText = title;
    resultElem.innerText = total;
    
    // Crit check visuals
    if (roll === 20) {
        resultElem.style.color = '#ffff00'; // Gold for crit
        resultElem.style.textShadow = '0 0 10px #ffff00';
        calcElem.innerText = `CRÍTICO! (Rolou ${roll} + ${modifier})`;
    } else if (roll === 1) {
        resultElem.style.color = '#ff3333'; // Red for fail
        calcElem.innerText = `FALHA CRÍTICA! (Rolou ${roll} + ${modifier})`;
    } else {
        resultElem.style.color = '#00e676'; // Normal Green
        resultElem.style.textShadow = 'none';
        calcElem.innerText = `(Rolou ${roll} + ${modifier})`;
    }

    modal.style.display = 'flex';
}

function closeModal(event) {
    if (event.target.id === 'diceModal') {
        document.getElementById('diceModal').style.display = 'none';
    }
}