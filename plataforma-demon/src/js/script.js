// script.js

let characters = [];
let currentId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    showView('gallery');
    
    // Listeners para auto-calculo
    ['dex', 'for'].forEach(attr => {
        document.getElementById(`attr-${attr}`).addEventListener('input', updateCalculations);
    });
});

// --- Navegação e Animação ---
function showView(viewName) {
    document.getElementById('view-gallery').classList.add('hidden');
    document.getElementById('view-editor').classList.add('hidden');
    
    if(viewName === 'gallery') {
        const gal = document.getElementById('view-gallery');
        gal.classList.remove('hidden');
        gal.classList.add('fade-in'); // Animação de entrada
        renderGalleryList();
    } else {
        const edt = document.getElementById('view-editor');
        edt.classList.remove('hidden');
        // Remove classe para poder re-adicionar e animar de novo se quiser
        edt.classList.remove('slide-up');
        void edt.offsetWidth; // Trigger reflow
        edt.classList.add('slide-up');
    }
}

// --- Dados e Toast UX ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let icon = '<i class="fa-solid fa-info-circle"></i>';
    if(type === 'success') icon = '<i class="fa-solid fa-check-circle" style="color:#00e676"></i>';
    if(type === 'error') icon = '<i class="fa-solid fa-exclamation-triangle" style="color:#ff3333"></i>';

    toast.className = `toast ${type}`;
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Remove do DOM após animação (3s total)
    setTimeout(() => { toast.remove(); }, 3000);
}

// --- Gerenciamento de Dados ---
function loadFromStorage() {
    const data = localStorage.getItem('shiroi_yoru_chars');
    if(data) characters = JSON.parse(data);
}

function saveToStorage() {
    try {
        localStorage.setItem('shiroi_yoru_chars', JSON.stringify(characters));
    } catch(e) {
        showToast("Erro: Imagem muito grande para salvar.", "error");
    }
}

function newCharacter() {
    currentId = Date.now();
    resetForm();
    showView('editor');
    showToast("Nova ficha criada!", "success");
}

function loadCharacter(id) {
    const char = characters.find(c => c.id === id);
    if(!char) return;
    
    currentId = id;
    
    document.getElementById('char-name').value = char.name;
    document.getElementById('char-jpname').value = char.jpname;
    document.getElementById('char-race').value = char.race;
    document.getElementById('char-rank').value = char.rank;
    document.getElementById('char-age').value = char.age;
    document.getElementById('char-player').value = char.player;
    document.getElementById('char-concept').value = char.concept;
    document.getElementById('avatar-preview').src = char.avatar || "https://via.placeholder.com/150";

    ['dex', 'fdv', 'vit', 'sab', 'for', 'int', 'car'].forEach(attr => {
        document.getElementById(`attr-${attr}`).value = char.attributes[attr] || 1;
    });

    document.getElementById('hp-curr').value = char.stats.hp[0];
    document.getElementById('hp-max').value = char.stats.hp[1];
    document.getElementById('en-curr').value = char.stats.en[0];
    document.getElementById('en-max').value = char.stats.en[1];
    document.getElementById('char-speed').value = char.stats.speed;

    document.getElementById('weapon-name').value = char.combat.w_name;
    document.getElementById('weapon-hit').value = char.combat.w_hit;
    document.getElementById('weapon-dmg').value = char.combat.w_dmg;
    document.getElementById('weapon-crit').value = char.combat.w_crit;
    document.getElementById('weapon-desc').value = char.combat.w_desc;

    document.getElementById('char-skills').value = char.skills;
    document.getElementById('char-inventory').value = char.inventory;
    document.getElementById('char-lore').value = char.lore;

    renderInternalGallery(char.gallery || []);
    toggleEnergy();
    updateCalculations();
    showView('editor');
}

function saveCharacter() {
    const charData = {
        id: currentId || Date.now(),
        name: document.getElementById('char-name').value || "Sem Nome",
        jpname: document.getElementById('char-jpname').value,
        race: document.getElementById('char-race').value,
        rank: document.getElementById('char-rank').value,
        age: document.getElementById('char-age').value,
        player: document.getElementById('char-player').value,
        concept: document.getElementById('char-concept').value,
        avatar: document.getElementById('avatar-preview').src,
        attributes: {
            dex: getVal('attr-dex'), fdv: getVal('attr-fdv'), vit: getVal('attr-vit'),
            sab: getVal('attr-sab'), for: getVal('attr-for'), int: getVal('attr-int'), car: getVal('attr-car')
        },
        stats: {
            hp: [getVal('hp-curr'), getVal('hp-max')],
            en: [getVal('en-curr'), getVal('en-max')],
            speed: document.getElementById('char-speed').value
        },
        combat: {
            w_name: document.getElementById('weapon-name').value,
            w_hit: document.getElementById('weapon-hit').value,
            w_dmg: document.getElementById('weapon-dmg').value,
            w_crit: document.getElementById('weapon-crit').value,
            w_desc: document.getElementById('weapon-desc').value
        },
        skills: document.getElementById('char-skills').value,
        inventory: document.getElementById('char-inventory').value,
        lore: document.getElementById('char-lore').value,
        gallery: getCurrentGalleryImages()
    };

    const idx = characters.findIndex(c => c.id === currentId);
    if(idx >= 0) characters[idx] = charData;
    else characters.push(charData);

    saveToStorage();
    showToast("Personagem Salvo com Sucesso!", "success");
    showView('gallery');
}

function deleteCharacter() {
    if(confirm("Tem certeza que deseja excluir?")) {
        characters = characters.filter(c => c.id !== currentId);
        saveToStorage();
        showToast("Personagem Excluído", "error");
        showView('gallery');
    }
}

// --- Helpers ---
function getVal(id) { return parseInt(document.getElementById(id).value) || 0; }

function resetForm() {
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    document.getElementById('avatar-preview').src = "https://via.placeholder.com/150";
    document.getElementById('char-gallery-grid').innerHTML = "";
    document.getElementById('attr-dex').value = 1;
    document.getElementById('hp-curr').value = 12; 
    document.getElementById('hp-max').value = 12;
}

function renderGalleryList() {
    const grid = document.getElementById('gallery-list');
    grid.innerHTML = "";
    
    // Animação Cascata (Stagger)
    characters.forEach((c, index) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
        card.style.opacity = '0'; // Começa invisível para o fade funcionar
        
        card.onclick = () => loadCharacter(c.id);
        card.innerHTML = `
            <img src="${c.avatar}" alt="${c.name}">
            <div class="info">
                <h3>${c.name}</h3>
                <p>${c.race} - ${c.rank}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateCalculations() {
    document.getElementById('disp-dex').innerText = getVal('attr-dex');
    document.getElementById('disp-for').innerText = getVal('attr-for');
}

function toggleEnergy() {
    const race = document.getElementById('char-race').value;
    document.getElementById('lbl-energy').innerText = race === 'Oni' ? "KEKKIJUTSU (PDK)" : "RESPIRAÇÃO (PDR)";
}

// --- Imagens ---
function handleAvatarUpload(input) {
    if(input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('avatar-preview').src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}

function addGalleryImage(input) {
    if(input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `<img src="${e.target.result}"><button class="btn-delete-img" onclick="this.parentElement.remove()">X</button>`;
            document.getElementById('char-gallery-grid').appendChild(div);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function getCurrentGalleryImages() {
    return Array.from(document.querySelectorAll('#char-gallery-grid img')).map(img => img.src);
}

function renderInternalGallery(images) {
    const grid = document.getElementById('char-gallery-grid');
    grid.innerHTML = "";
    images.forEach(src => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `<img src="${src}"><button class="btn-delete-img" onclick="this.parentElement.remove()">X</button>`;
        grid.appendChild(div);
    });
}

// --- Rolagem Animada ---
function rollAttr(attr) {
    rollDice(20, getVal('attr-' + attr), `Teste de ${attr.toUpperCase()}`);
}

function rollDice(sides, mod, title) {
    const modal = document.getElementById('diceModal');
    const res = document.getElementById('roll-result');
    document.getElementById('roll-title').innerText = title || "Rolagem";
    modal.style.display = 'flex';

    // Efeito de "Embaralhar" números
    let counter = 0;
    const interval = setInterval(() => {
        res.innerText = Math.floor(Math.random() * sides) + 1;
        res.style.color = "#fff"; // Cor neutra enquanto roda
        counter++;
        if(counter > 10) {
            clearInterval(interval);
            const roll = Math.floor(Math.random() * sides) + 1;
            const total = roll + mod;
            
            res.innerText = total;
            document.getElementById('roll-calc').innerText = `(d${sides}: ${roll}) + ${mod}`;
            
            // Cor final
            if(roll === 20) res.style.color = "#fcd34d"; // Crit
            else if(roll === 1) res.style.color = "#ff3333"; // Falha
            else res.style.color = "#c31432";
        }
    }, 50); // Velocidade da troca
}

function closeModal(e) {
    if(e.target.id === 'diceModal') document.getElementById('diceModal').style.display = 'none';
}

// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- INÍCIO DA NOVA LÓGICA DE INTRO ---
    playIntroAnimation();
    // --- FIM DA NOVA LÓGICA DE INTRO ---

    loadFromStorage();
    showView('gallery');
    
    // ... resto do seu código de listeners ...
});

// Função da Animação
function playIntroAnimation() {
    const intro = document.getElementById('intro-overlay');
    
    // Tempo total da animação (2.8 segundos)
    // Ajustado para sincronizar com a barra de loading CSS
    setTimeout(() => {
        intro.classList.add('hidden');
        
        // Opcional: Remover do DOM após o fade-out para liberar memória
        setTimeout(() => {
            intro.remove();
        }, 800); // Tempo da transição CSS (.8s)
        
    }, 2800); 
}

// ... resto das suas funções (loadFromStorage, showView, etc) ...