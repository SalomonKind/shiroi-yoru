// script.js

// Importa o Firebase da Internet (Não precisa baixar nada)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, doc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";



// --- 1. CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBeiaU3pJkqaTPsXFg4oZWEXdkyBBz3GjE",
    authDomain: "shiroiyoru-df869.firebaseapp.com",
    projectId: "shiroiyoru-df869",
    storageBucket: "shiroiyoru-df869.firebasestorage.app",
    messagingSenderId: "745292780356",
    appId: "1:745292780356:web:d1dc48cce3eb8a53807d11"
};

// Inicializa conexão
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const dbRef = collection(db, "personagens"); // Nome da "pasta" no banco

// Variáveis Globais
let characters = [];
let currentId = null; // ID do Firestore agora (string), não mais Date.now()

// --- 2. SISTEMA DE TEMPO REAL (Ouvinte) ---
// Isso substitui o 'loadFromStorage'. Sempre que ALGUÉM mudar algo no banco,
// essa função roda sozinha e atualiza a tela de todo mundo.
onSnapshot(dbRef, (snapshot) => {
    characters = [];
    snapshot.docs.forEach(doc => {
        characters.push({ ...doc.data(), id: doc.id });
    });
    
    // Se estiver na galeria, atualiza a lista visualmente
    if(!document.getElementById('view-gallery').classList.contains('hidden')){
        renderGalleryList();
    }
});

// Inicialização da Página
document.addEventListener('DOMContentLoaded', () => {
    playIntroAnimation();
    showView('gallery');
    
    // Listeners de cálculo automático
    ['dex', 'for'].forEach(attr => {
        document.getElementById(`attr-${attr}`).addEventListener('input', updateCalculations);
    });
});

// --- 3. FUNÇÕES PRINCIPAIS EXPORTADAS PARA O HTML ---
// Como estamos usando type="module", precisamos pendurar as funções no 'window'
window.app = {
    showView,
    newCharacter,
    saveCharacter,
    deleteCharacter,
    handleAvatarUpload,
    addGalleryImage,
    rollAttr,
    closeModal,
    toggleEnergy
};

// Animação de Intro
function playIntroAnimation() {
    const intro = document.getElementById('intro-overlay');
    setTimeout(() => {
        intro.style.opacity = '0';
        setTimeout(() => intro.remove(), 800);
    }, 2500); 
}

// Navegação
function showView(viewName) {
    document.getElementById('view-gallery').classList.add('hidden');
    document.getElementById('view-editor').classList.add('hidden');
    
    if(viewName === 'gallery') {
        document.getElementById('view-gallery').classList.remove('hidden');
        renderGalleryList();
    } else {
        document.getElementById('view-editor').classList.remove('hidden');
    }
}

// Renderiza a Galeria com dados da Nuvem
function renderGalleryList() {
    const grid = document.getElementById('gallery-list');
    grid.innerHTML = "";
    
    if(characters.length === 0) {
        grid.innerHTML = "<p style='color:#888; grid-column:1/-1; text-align:center;'>Nenhuma lenda encontrada. Crie a primeira!</p>";
        return;
    }

    characters.forEach((c, index) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
        card.style.opacity = '0';
        
        card.onclick = () => loadCharacter(c.id);
        card.innerHTML = `
            <img src="${c.avatar || 'https://via.placeholder.com/150'}" alt="${c.name}">
            <div class="info">
                <h3>${c.name}</h3>
                <p>${c.race} - ${c.rank}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Prepara nova ficha
function newCharacter() {
    currentId = null; // Null = Criar Novo
    resetForm();
    showView('editor');
}

// Carrega ficha para edição
function loadCharacter(id) {
    const char = characters.find(c => c.id === id);
    if(!char) return;
    currentId = id;

    // Preenchimento (igual ao anterior)
    setVal('char-name', char.name);
    setVal('char-jpname', char.jpname);
    setVal('char-race', char.race);
    setVal('char-rank', char.rank);
    setVal('char-age', char.age);
    setVal('char-player', char.player);
    setVal('char-concept', char.concept);
    document.getElementById('avatar-preview').src = char.avatar;

    // Atributos & Status
    setVal('attr-dex', char.attributes.dex);
    setVal('attr-fdv', char.attributes.fdv);
    setVal('attr-vit', char.attributes.vit);
    setVal('attr-sab', char.attributes.sab);
    setVal('attr-for', char.attributes.for);
    setVal('attr-int', char.attributes.int);
    setVal('attr-car', char.attributes.car);

    setVal('hp-curr', char.stats.hp[0]); setVal('hp-max', char.stats.hp[1]);
    setVal('en-curr', char.stats.en[0]); setVal('en-max', char.stats.en[1]);
    setVal('char-speed', char.stats.speed);

    // Combate
    setVal('weapon-name', char.combat.w_name);
    setVal('weapon-hit', char.combat.w_hit);
    setVal('weapon-dmg', char.combat.w_dmg);
    setVal('weapon-crit', char.combat.w_crit);
    setVal('weapon-desc', char.combat.w_desc);

    setVal('char-skills', char.skills);
    setVal('char-inventory', char.inventory);
    setVal('char-lore', char.lore);

    renderInternalGallery(char.gallery || []);
    toggleEnergy();
    updateCalculations();
    showView('editor');
}

// --- SALVAR NO FIREBASE ---
async function saveCharacter() {
    const btn = document.querySelector('.btn-primary');
    btn.innerText = "Salvando...";
    btn.disabled = true;

    // Pega os dados do form
    const charData = {
        name: getVal('char-name') || "Sem Nome",
        jpname: getVal('char-jpname'),
        race: getVal('char-race'),
        rank: getVal('char-rank'),
        age: getVal('char-age'),
        player: getVal('char-player'),
        concept: getVal('char-concept'),
        avatar: document.getElementById('avatar-preview').src,
        attributes: {
            dex: getNum('attr-dex'), fdv: getNum('attr-fdv'), vit: getNum('attr-vit'),
            sab: getNum('attr-sab'), for: getNum('attr-for'), int: getNum('attr-int'), car: getNum('attr-car')
        },
        stats: {
            hp: [getNum('hp-curr'), getNum('hp-max')],
            en: [getNum('en-curr'), getNum('en-max')],
            speed: getVal('char-speed')
        },
        combat: {
            w_name: getVal('weapon-name'),
            w_hit: getVal('weapon-hit'),
            w_dmg: getVal('weapon-dmg'),
            w_crit: getVal('weapon-crit'),
            w_desc: getVal('weapon-desc')
        },
        skills: getVal('char-skills'),
        inventory: getVal('char-inventory'),
        lore: getVal('char-lore'),
        gallery: getCurrentGalleryImages(),
        updatedAt: new Date() // Marca temporal
    };

    try {
        if(currentId) {
            // Atualizar Existente
            await setDoc(doc(db, "personagens", currentId), charData);
            showToast("Ficha Atualizada na Nuvem!", "success");
        } else {
            // Criar Novo
            await addDoc(dbRef, charData);
            showToast("Lenda Criada com Sucesso!", "success");
        }
        showView('gallery');
    } catch(error) {
        console.error(error);
        showToast("Erro ao salvar (imagem muito grande?)", "error");
    } finally {
        btn.innerText = "Salvar Personagem";
        btn.disabled = false;
    }
}

// --- EXCLUIR DO FIREBASE ---
async function deleteCharacter() {
    if(!currentId) return;
    if(confirm("Tem certeza que deseja apagar esta lenda para sempre?")) {
        try {
            await deleteDoc(doc(db, "personagens", currentId));
            showToast("Personagem Excluído.", "success");
            showView('gallery');
        } catch(e) {
            showToast("Erro ao excluir.", "error");
        }
    }
}

// --- Helpers de UI ---
function getVal(id) { return document.getElementById(id).value; }
function getNum(id) { return parseInt(document.getElementById(id).value) || 0; }
function setVal(id, val) { document.getElementById(id).value = val || ""; }

function resetForm() {
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    document.getElementById('avatar-preview').src = "https://via.placeholder.com/150";
    document.getElementById('char-gallery-grid').innerHTML = "";
    setVal('attr-dex', 1);
    setVal('hp-curr', 12); setVal('hp-max', 12);
}

function updateCalculations() {
    document.getElementById('disp-dex').innerText = getNum('attr-dex');
    document.getElementById('disp-for').innerText = getNum('attr-for');
}

function toggleEnergy() {
    const race = document.getElementById('char-race').value;
    document.getElementById('lbl-energy').innerText = race === 'Oni' ? "KEKKIJUTSU (PDK)" : "RESPIRAÇÃO (PDR)";
}

function handleAvatarUpload(input) {
    if(input.files[0]) convertToBase64(input.files[0], (res) => document.getElementById('avatar-preview').src = res);
}

function addGalleryImage(input) {
    if(input.files[0]) {
        convertToBase64(input.files[0], (res) => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `<img src="${res}"><button class="btn-delete-img" onclick="this.parentElement.remove()">X</button>`;
            document.getElementById('char-gallery-grid').appendChild(div);
        });
    }
}

function convertToBase64(file, callback) {
    if(file.size > 1024 * 1024) { // Limite 1MB pra não travar o banco
        showToast("Imagem muito grande! Máx 1MB.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
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

// Toast UI
function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerText = msg;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Dados
function rollAttr(attr) { rollDice(20, getNum('attr-'+attr)); }
function rollDice(sides, mod) {
    const modal = document.getElementById('diceModal');
    const res = document.getElementById('roll-result');
    modal.style.display = 'flex';
    let i = 0;
    const interval = setInterval(() => {
        res.innerText = Math.floor(Math.random()*sides)+1;
        res.style.color = '#fff';
        i++;
        if(i>10) {
            clearInterval(interval);
            const r = Math.floor(Math.random()*sides)+1;
            res.innerText = r + mod;
            document.getElementById('roll-calc').innerText = `(d${sides}: ${r}) + ${mod}`;
            res.style.color = r===20?'#fcd34d':(r===1?'#ff3333':'#c31432');
        }
    }, 50);
}
function closeModal(e) { if(e.target.id === 'diceModal') document.getElementById('diceModal').style.display='none'; }