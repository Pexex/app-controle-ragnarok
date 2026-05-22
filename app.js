// --- SISTEMA DE TOASTS ---
function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgClass = tipo === 'success' ? 'bg-green-600' : (tipo === 'error' ? 'bg-red-600' : 'bg-blue-600');
    let iconClass = tipo === 'success' ? 'fa-check-circle' : (tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

    toast.className = `${bgClass} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 toast-enter text-sm font-medium min-w-[250px]`;
    toast.innerHTML = `<i class="fa-solid ${iconClass} text-lg"></i> <span>${mensagem}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 300); // Remove o elemento do DOM após a animação de saída
    }, 3000);
}

// --- ESTADO DA APLICAÇÃO ---
let appState = {
    contas: [], // { email: 'x', moedas: 0, personagens: [ { id, nome, classe, level, genero } ] }
    historico: [], // { data, tipo, descricao, valor }
    gruposAtuais: [], // Array de arrays
    instanciaAtual: { nome: '', minLv: 1, maxLv: 250, moedas: 0 }
};

const itensLoja = [
    // Consumíveis
    { nome: 'Balão de Exploração', custo: 1, categoria: 'Consumíveis', icone: 'fa-map', corCat: 'text-green-600 bg-green-100' },
    { nome: 'Poção de Angeling', custo: 1, categoria: 'Consumíveis', icone: 'fa-flask', corCat: 'text-green-600 bg-green-100' },
    { nome: 'Poção do Furor Físico', custo: 2, categoria: 'Consumíveis', icone: 'fa-flask', corCat: 'text-green-600 bg-green-100' },
    { nome: 'Poção do Furor Mágico', custo: 2, categoria: 'Consumíveis', icone: 'fa-flask', corCat: 'text-green-600 bg-green-100' },
    { nome: 'Moeda de Corrida [1]', custo: 5, categoria: 'Consumíveis', icone: 'fa-coins', corCat: 'text-green-600 bg-green-100' },
    { nome: 'Pudim de Guyak', custo: 40, categoria: 'Consumíveis', icone: 'fa-bowl-food', corCat: 'text-green-600 bg-green-100' },

    // Equipamentos
    { nome: 'Moranguinho', custo: 10, categoria: 'Equipamentos', icone: 'fa-seedling', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Ferramentas Agrícolas', custo: 50, categoria: 'Equipamentos', icone: 'fa-hammer', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Arco Narciso', custo: 100, categoria: 'Equipamentos', icone: 'fa-bullseye', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Espada Oriental', custo: 100, categoria: 'Equipamentos', icone: 'fa-khanda', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Gladius Mágico', custo: 100, categoria: 'Equipamentos', icone: 'fa-khanda', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Vingativa', custo: 100, categoria: 'Equipamentos', icone: 'fa-gavel', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Cajado Fúnebre', custo: 100, categoria: 'Equipamentos', icone: 'fa-wand-magic-sparkles', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Punho de Aço', custo: 100, categoria: 'Equipamentos', icone: 'fa-hand-fist', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Báculo Mecanizado', custo: 100, categoria: 'Equipamentos', icone: 'fa-wand-magic-sparkles', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Tridente Aquático', custo: 100, categoria: 'Equipamentos', icone: 'fa-pitchfork', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Balista da Realeza', custo: 100, categoria: 'Equipamentos', icone: 'fa-bullseye', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Katar Tremulante', custo: 100, categoria: 'Equipamentos', icone: 'fa-khanda', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Bíblia Exorcista', custo: 100, categoria: 'Equipamentos', icone: 'fa-book-bible', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Lâmina Azulada', custo: 100, categoria: 'Equipamentos', icone: 'fa-khanda', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Elmo Bravio de Cinzas', custo: 200, categoria: 'Equipamentos', icone: 'fa-helmet-safety', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Elmo Certeiro de Cinzas', custo: 200, categoria: 'Equipamentos', icone: 'fa-helmet-safety', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Elmo Cobiçado de Cinzas', custo: 200, categoria: 'Equipamentos', icone: 'fa-helmet-safety', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Elmo Divino de Cinzas', custo: 200, categoria: 'Equipamentos', icone: 'fa-helmet-safety', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Elmo Mágico de Cinzas', custo: 200, categoria: 'Equipamentos', icone: 'fa-helmet-safety', corCat: 'text-orange-600 bg-orange-100' },
    { nome: 'Elmo Mortal de Cinzas', custo: 200, categoria: 'Equipamentos', icone: 'fa-helmet-safety', corCat: 'text-orange-600 bg-orange-100' },

    // Refino
    { nome: 'Caixa de Arma +5', custo: 90, categoria: 'Refino', icone: 'fa-box', corCat: 'text-red-600 bg-red-100' },
    { nome: 'Caixa de Armadura +5', custo: 90, categoria: 'Refino', icone: 'fa-box', corCat: 'text-red-600 bg-red-100' },
    { nome: 'Cubo de Refino de Mora', custo: 300, categoria: 'Refino', icone: 'fa-cube', corCat: 'text-red-600 bg-red-100' },
    { nome: 'Cubo de Refino de Cinzas', custo: 300, categoria: 'Refino', icone: 'fa-cube', corCat: 'text-red-600 bg-red-100' },
    { nome: 'Cubo de Refino Desbravador', custo: 300, categoria: 'Refino', icone: 'fa-cube', corCat: 'text-red-600 bg-red-100' },

    // Visuais
    { nome: '(Visual) Mapa dos Exploradores', custo: 500, categoria: 'Visual', icone: 'fa-map-location-dot', corCat: 'text-purple-600 bg-purple-100' }
];

// --- INICIALIZAÇÃO ---
window.onload = () => {
    carregarDadosLocais();
    atualizarSelectsContas();
    renderizarContas();
    renderizarHistorico();
    atualizarTextareaJson();
};

function mudarAba(abaId) {
    document.querySelectorAll('.aba-conteudo').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('button[id^="tab-"]').forEach(el => {
        el.classList.remove('tab-active');
        el.classList.add('text-slate-500');
    });
    
    document.getElementById(`aba-${abaId}`).classList.remove('hidden');
    let tabBtn = document.getElementById(`tab-${abaId}`);
    tabBtn.classList.add('tab-active');
    tabBtn.classList.remove('text-slate-500');

    if(abaId === 'loja') calcularLoja();
}

// --- FUNÇÕES DE DADOS (CONTAS E CHARS) ---
function adicionarConta() {
    const email = document.getElementById('novo-email').value.trim();
    if(!email) return mostrarToast('Digite um e-mail.', 'error');
    
    if(appState.contas.some(c => c.email === email)) {
        return mostrarToast('Conta já cadastrada.', 'error');
    }

    appState.contas.push({ email, moedas: 0, personagens: [] });
    document.getElementById('novo-email').value = '';
    
    salvarDados();
    atualizarSelectsContas();
    renderizarContas();
    mostrarToast('Conta adicionada com sucesso!');
}

function removerPersonagem(email, idChar) {
    let conta = appState.contas.find(c => c.email === email);
    if(conta) {
        conta.personagens = conta.personagens.filter(p => p.id !== idChar);
        salvarDados();
        renderizarContas();
        mostrarToast('Personagem removido.');
    }
}

function removerConta(email) {
    appState.contas = appState.contas.filter(c => c.email !== email);
    salvarDados();
    atualizarSelectsContas();
    renderizarContas();
    mostrarToast('Conta removida.');
}

// --- SISTEMA DE CRIAÇÃO ESTILO RO (NOVO) ---
function obterCoresClasseImg(classeName) {
    const n = classeName.toLowerCase();
    if(n.includes('aprendiz')) return { bg: 'e2e8f0', text: '475569' };
    if(n.match(/espadachim|cavaleiro|templário|guardião|lorde|paladino/)) return { bg: 'fca5a5', text: '7f1d1d' };
    if(n.match(/mago|bruxo|arcano|sábio|feiticeiro|arquimago|elementalista/)) return { bg: '93c5fd', text: '1e3a8a' };
    if(n.match(/arqueiro|caçador|sentinela|bardo|odalisca|musa|trovador|animador/)) return { bg: '86efac', text: '14532d' };
    if(n.match(/noviço|sacerdote|arcebispo|monge|shura|cardeal|inquisidor/)) return { bg: '5eead4', text: '134e4a' };
    if(n.match(/mercador|ferreiro|mecânico|alquimista|bioquímico|biólogo|mestre da forja/)) return { bg: 'fde047', text: '713f12' };
    if(n.match(/gatuno|mercenário|sicário|arruaceiro|renegado|algoz|abismo/)) return { bg: 'd8b4fe', text: '581c87' };
    if(n.includes('invocador') || n.includes('doram')) return { bg: 'fdba74', text: '7c2d12' };
    return { bg: 'f9a8d4', text: '831843' };
}

function sanitizarNomeArquivo(nome) {
    return nome.toLowerCase()
               .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
               .replace(/[^a-z0-9]/g, "_") // Substitui espaços e chars especiais por _
               .replace(/_+/g, "_") // Remove múltiplos _ consecutivos
               .replace(/^_|_$/g, ""); // Remove _ do início e do fim
}

function obterFallbackImagemClasse(classeName, genero = 'M') {
    const cores = obterCoresClasseImg(classeName);
    const simbolo = genero === 'M' ? '♂' : '♀';
    const text = encodeURIComponent(classeName + '\n\n' + simbolo);
    return `https://placehold.co/150x250/${cores.bg}/${cores.text}?text=${text}`;
}

function obterImagemClasse(classeName, genero = 'M') {
    let fileName = sanitizarNomeArquivo(classeName);
    const gen = genero.toLowerCase(); // 'm' ou 'f'

    // Kagerou usa a arte de Oboro quando o personagem é feminino.
    if(fileName === 'kagerou' && gen === 'f') {
        fileName = 'oboro';
    }

    return `img/${fileName}_${gen}.png`;
}

function focarNovoChar(email) {
    document.getElementById('novo-char-email').value = email;
    document.getElementById('novo-char-nome').value = '';
    document.getElementById('novo-char-level').value = '1';
    document.getElementById('novo-char-job').value = '1';
    document.getElementById('novo-char-classe').selectedIndex = 0;
    document.querySelector(`input[name="novo-char-genero"][value="M"]`).checked = true; // Reseta pro masculino
    
    atualizarPreviewClasse(false);
    document.getElementById('modal-criar-char').classList.remove('hidden');
}

function fecharModalCriar() {
    document.getElementById('modal-criar-char').classList.add('hidden');
}

function atualizarPreviewClasse(isEdit = false) {
    const prefix = isEdit ? 'edit-char' : 'novo-char';
    const classeName = document.getElementById(`${prefix}-classe`).value;
    
    // Auto-Ajuste de Gênero para Classes Restritas
    if(['Bardo', 'Trovador', 'Animador'].includes(classeName)) {
        document.querySelector(`input[name="${prefix}-genero"][value="M"]`).checked = true;
    } else if(['Odalisca', 'Musa'].includes(classeName)) {
        document.querySelector(`input[name="${prefix}-genero"][value="F"]`).checked = true;
    }

    const genero = document.querySelector(`input[name="${prefix}-genero"]:checked`).value;
    
    // Atualiza a arte apenas se for o modal de criação (o de edição não tem prévia)
    if(!isEdit) {
        const imgEl = document.getElementById('preview-classe-img');
        const nomeEl = document.getElementById('preview-classe-nome');
        
        // Tenta carregar local, senão cai pro fallback dinâmico
        imgEl.src = obterImagemClasse(classeName, genero);
        imgEl.onerror = function() {
            this.src = obterFallbackImagemClasse(classeName, genero);
        };
        
        let icone = genero === 'M' ? '<i class="fa-solid fa-mars text-blue-500"></i>' : '<i class="fa-solid fa-venus text-pink-500"></i>';
        nomeEl.innerHTML = `${classeName} ${icone}`;
    }
}

function confirmarAdicionarPersonagem() {
    const email = document.getElementById('novo-char-email').value;
    const nome = document.getElementById('novo-char-nome').value.trim();
    const classe = document.getElementById('novo-char-classe').value;
    const level = parseInt(document.getElementById('novo-char-level').value);
    const job = parseInt(document.getElementById('novo-char-job').value);
    const genero = document.querySelector('input[name="novo-char-genero"]:checked').value;

    if(!email) return mostrarToast('Erro: Email não selecionado.', 'error');
    if(!nome) return mostrarToast('Digite o nome do personagem.', 'error');
    if(isNaN(level) || level < 1 || level > 250) return mostrarToast('Level base inválido (1-250).', 'error');
    if(isNaN(job) || job < 1 || job > 80) return mostrarToast('Level de classe (Job) inválido (1-80).', 'error');

    let conta = appState.contas.find(c => c.email === email);
    conta.personagens.push({
        id: Date.now().toString(),
        nome,
        classe,
        level,
        jobLevel: job,
        genero: genero
    });

    salvarDados();
    renderizarContas();
    fecharModalCriar();
    mostrarToast('Personagem criado com sucesso!');
}

// --- EDICAO DE PERSONAGENS ---
function alterarNivelRapido(email, idChar, delta, tipo = 'base') {
    let conta = appState.contas.find(c => c.email === email);
    if(conta) {
        let char = conta.personagens.find(p => p.id === idChar);
        if(char) {
            if (tipo === 'base') {
                let novoLevel = char.level + delta;
                if(novoLevel >= 1 && novoLevel <= 250) {
                    char.level = novoLevel;
                } else {
                    return mostrarToast('Level base deve ser entre 1 e 250.', 'error');
                }
            } else if (tipo === 'job') {
                let novoJob = (char.jobLevel || 1) + delta;
                if(novoJob >= 1 && novoJob <= 80) {
                    char.jobLevel = novoJob;
                } else {
                    return mostrarToast('Job deve ser entre 1 e 80.', 'error');
                }
            }
            salvarDados();
            renderizarContas();
        }
    }
}

function abrirModalEditar(email, idChar) {
    let conta = appState.contas.find(c => c.email === email);
    if(!conta) return;
    let char = conta.personagens.find(p => p.id === idChar);
    if(!char) return;

    document.getElementById('edit-char-email').value = email;
    document.getElementById('edit-char-id').value = idChar;
    document.getElementById('edit-char-nome').value = char.nome;
    document.getElementById('edit-char-level').value = char.level;
    document.getElementById('edit-char-job').value = char.jobLevel || 1;
    
    // Marca o gênero (default Masculino se for muito antigo e não tiver)
    let gen = char.genero || 'M';
    document.querySelector(`input[name="edit-char-genero"][value="${gen}"]`).checked = true;

    // Copia as opções de classe do select de cadastro para o select do modal
    document.getElementById('edit-char-classe').innerHTML = document.getElementById('novo-char-classe').innerHTML;
    document.getElementById('edit-char-classe').value = char.classe;

    document.getElementById('modal-editar-char').classList.remove('hidden');
}

function fecharModalEditar() {
    document.getElementById('modal-editar-char').classList.add('hidden');
}

function alterarLevelEdit(delta) {
    let input = document.getElementById('edit-char-level');
    let val = parseInt(input.value) || 1;
    let novo = val + delta;
    if(novo >= 1 && novo <= 250) input.value = novo;
}

function alterarJobEdit(delta) {
    let input = document.getElementById('edit-char-job');
    let val = parseInt(input.value) || 1;
    let novo = val + delta;
    if(novo >= 1 && novo <= 80) input.value = novo;
}

function salvarEdicaoModal() {
    let email = document.getElementById('edit-char-email').value;
    let idChar = document.getElementById('edit-char-id').value;
    let novoLevel = parseInt(document.getElementById('edit-char-level').value);
    let novoJob = parseInt(document.getElementById('edit-char-job').value);
    let novaClasse = document.getElementById('edit-char-classe').value;
    let novoGenero = document.querySelector('input[name="edit-char-genero"]:checked').value;

    if(isNaN(novoLevel) || novoLevel < 1 || novoLevel > 250) {
        return mostrarToast('Level base inválido (1-250).', 'error');
    }
    if(isNaN(novoJob) || novoJob < 1 || novoJob > 80) {
        return mostrarToast('Job inválido (1-80).', 'error');
    }

    let conta = appState.contas.find(c => c.email === email);
    if(conta) {
        let char = conta.personagens.find(p => p.id === idChar);
        if(char) {
            char.level = novoLevel;
            char.jobLevel = novoJob;
            char.classe = novaClasse;
            char.genero = novoGenero;
            salvarDados();
            renderizarContas();
            fecharModalEditar();
            mostrarToast('Personagem atualizado com sucesso!');
        }
    }
}

// --- RENDERIZAÇÃO VISUAL ---
function obterCorClasse(classeName) {
    const nomeLower = classeName.toLowerCase();
    // Lógica simples de cores por tipo
    if(nomeLower.includes('aprendiz')) return 'bg-gray-100 text-gray-700 border-gray-300';
    if(nomeLower.match(/espadachim|cavaleiro|templário|guardião|lorde|paladino/)) return 'bg-red-100 text-red-700 border-red-300';
    if(nomeLower.match(/mago|bruxo|arcano|sábio|feiticeiro|arquimago|elementalista/)) return 'bg-blue-100 text-blue-700 border-blue-300';
    if(nomeLower.match(/arqueiro|caçador|sentinela|bardo|odalisca|musa|trovador/)) return 'bg-green-100 text-green-700 border-green-300';
    if(nomeLower.match(/noviço|sacerdote|arcebispo|monge|shura|cardeal|inquisidor/)) return 'bg-teal-100 text-teal-700 border-teal-300';
    if(nomeLower.match(/mercador|ferreiro|mecânico|alquimista|bioquímico|biólogo/)) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if(nomeLower.match(/gatuno|mercenário|sicário|arruaceiro|renegado|algoz/)) return 'bg-purple-100 text-purple-700 border-purple-300';
    if(nomeLower.includes('invocador') || nomeLower.includes('doram')) return 'bg-orange-100 text-orange-800 border-orange-300';
    // Expandidas
    return 'bg-pink-100 text-pink-700 border-pink-300';
}

function isSuporte(classeName) {
    const suportes = ['Sacerdote', 'Arcebispo', 'Cardeal', 'Bardo', 'Odalisca', 'Menestrel', 'Cigana', 'Trovador', 'Musa', 'Animador', 'Espiritualista', 'Ceifador de Almas', 'Invocador (Suporte)'];
    return suportes.some(sup => classeName.includes(sup));
}

function renderizarContas() {
    const container = document.getElementById('lista-contas');
    container.innerHTML = '';

    if(appState.contas.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10 bg-white/50 border border-dashed border-slate-400 rounded-xl">
                <i class="fa-solid fa-server text-4xl text-slate-400 mb-3"></i>
                <p class="text-sm text-slate-600 font-medium">Nenhuma conta cadastrada no servidor.</p>
                <p class="text-xs text-slate-500 mt-1">Crie sua primeira conta no painel acima para iniciar o jogo.</p>
            </div>`;
        return;
    }

    appState.contas.forEach(conta => {
        let charsHtml = conta.personagens.map(p => {
            let corInfo = obterCoresClasseImg(p.classe);
            let job = p.jobLevel || 1;
            let gen = p.genero || 'M'; // Fallback para chars velhos
            let iconeGen = gen === 'M' ? '<i class="fa-solid fa-mars text-blue-500 drop-shadow-sm ml-1 text-xs"></i>' : '<i class="fa-solid fa-venus text-pink-500 drop-shadow-sm ml-1 text-xs"></i>';
            
            let fileName = sanitizarNomeArquivo(p.classe);
            let fallbackImg = obterFallbackImagemClasse(p.classe, gen);
            
            return `
            <div class="relative bg-white border-2 border-indigo-100 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col h-[340px] overflow-hidden">
                
                <!-- Ícone de Classe (Canto Superior Direito) -->
                <div class="absolute top-2 right-2 bg-white border border-slate-300 w-7 h-7 rounded flex items-center justify-center shadow-sm z-20" title="${p.classe}">
                    <img src="img/emblema_${fileName}.png" class="w-6 h-6 object-contain rounded-sm" alt="${p.classe}" onerror="this.src='https://placehold.co/28x28/${corInfo.bg}/${corInfo.text}?text=${p.classe.substring(0,2).toUpperCase()}'">
                </div>
                
                <!-- Espaço do Personagem (Sprite Dinâmico) -->
                <div class="flex-1 w-full bg-gradient-to-b from-white to-blue-50/50 flex items-center justify-center relative p-2">
                    <img src="img/${fileName}_${gen.toLowerCase()}.png" class="max-h-[160px] object-contain opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all drop-shadow-md" alt="${p.classe}" onerror="this.src='${fallbackImg}'">
                </div>
                
                <!-- Controles de Nível e Edição embutidos no Card -->
                <div class="bg-slate-50 p-2 border-t border-slate-200 z-10 space-y-1.5">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 font-bold text-[9px] uppercase">Lv. Base</span>
                        <div class="flex items-center bg-white rounded border border-slate-300 shadow-inner">
                            <button onclick="alterarNivelRapido('${conta.email}', '${p.id}', -1, 'base')" class="w-6 h-5 flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold">-</button>
                            <span class="w-8 text-center font-bold text-slate-700 text-[10px]">${p.level}</span>
                            <button onclick="alterarNivelRapido('${conta.email}', '${p.id}', 1, 'base')" class="w-6 h-5 flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold">+</button>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 font-bold text-[9px] uppercase">Lv. Job</span>
                        <div class="flex items-center bg-white rounded border border-slate-300 shadow-inner">
                            <button onclick="alterarNivelRapido('${conta.email}', '${p.id}', -1, 'job')" class="w-6 h-5 flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold">-</button>
                            <span class="w-8 text-center font-bold text-slate-700 text-[10px]">${job}</span>
                            <button onclick="alterarNivelRapido('${conta.email}', '${p.id}', 1, 'job')" class="w-6 h-5 flex items-center justify-center hover:bg-slate-100 text-slate-500 font-bold">+</button>
                        </div>
                    </div>
                    
                    <div class="flex gap-1 pt-1">
                        <button onclick="abrirModalEditar('${conta.email}', '${p.id}')" class="flex-1 bg-white border border-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-600 text-[10px] font-bold py-1 rounded transition-colors shadow-sm flex items-center justify-center gap-1">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button onclick="removerPersonagem('${conta.email}', '${p.id}')" class="px-2.5 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-slate-600 text-[10px] font-bold py-1 rounded transition-colors shadow-sm">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Barra de Nome (Estilo RO) -->
                <div class="bg-[#e2e8f0] text-[#1e293b] font-bold text-center py-2 text-sm border-t border-[#cbd5e1] truncate px-1 shadow-inner group-hover:bg-[#dbeafe] group-hover:text-indigo-800 transition-colors flex items-center justify-center gap-1">
                    ${p.nome} ${iconeGen}
                </div>
            </div>`;
        }).join('');

        let newSlotHtml = `
            <div class="relative bg-[#e9ecef] border-2 border-transparent rounded-lg shadow-sm flex flex-col h-[340px] hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group overflow-hidden" onclick="focarNovoChar('${conta.email}')">
                <div class="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#eef2f6] to-[#e2e8f0]">
                    <div class="w-16 h-16 rounded-full border-2 border-[#cbd5e1] flex items-center justify-center text-[#94a3b8] bg-[#f8fafc] group-hover:bg-indigo-50 group-hover:text-indigo-400 group-hover:border-indigo-300 transition-all shadow-inner">
                        <i class="fa-solid fa-plus text-2xl"></i>
                    </div>
                </div>
                <div class="bg-[#cbd5e1] text-[#64748b] font-bold text-center py-2 text-sm border-t border-[#94a3b8] tracking-widest group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors shadow-inner">
                    NOME
                </div>
            </div>
        `;

        if(conta.personagens.length === 0) {
            charsHtml = '';
        }

        let box = document.createElement('div');
        box.className = 'border border-blue-200 rounded-xl p-5 mb-6 shadow-md relative overflow-hidden bg-white/80 backdrop-blur-sm';
        box.innerHTML = `
            <button onclick="removerConta('${conta.email}')" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors z-10 bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:border-red-200" title="Remover Conta">
                <i class="fa-solid fa-trash"></i>
            </button>
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-blue-200 pb-4 pr-12">
                <div>
                    <h3 class="font-bold text-xl text-slate-700 flex items-center gap-2">
                        <i class="fa-solid fa-desktop text-indigo-500"></i> ${conta.email}
                    </h3>
                    <span class="text-sm text-slate-500 font-medium">Slots Ocupados: ${conta.personagens.length}</span>
                </div>
                <div class="mt-3 md:mt-0 bg-blue-50 px-4 py-2 rounded-xl shadow-inner border border-blue-100 flex items-center gap-3">
                    <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Moedas (Conta)</span>
                    <span class="text-xl font-black text-yellow-600 flex items-center gap-1 drop-shadow-sm">
                        ${conta.moedas} <i class="fa-solid fa-coins text-sm"></i>
                    </span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                ${charsHtml}
                ${newSlotHtml}
            </div>
        `;
        container.appendChild(box);
    });
}

function atualizarSelectsContas() {
    const selects = ['select-conta-manual', 'select-conta-loja'];
    selects.forEach(id => {
        let el = document.getElementById(id);
        if(el) {
            el.innerHTML = appState.contas.map(c => `<option value="${c.email}">${c.email}</option>`).join('');
        }
    });
}

// --- ALGORITMO DE GRUPOS ---
function gerarGrupos() {
    const rawInstancia = document.getElementById('select-instancia').value;
    const maxSize = parseInt(document.getElementById('tamanho-grupo').value);
    
    const partes = rawInstancia.split('|');
    const nomeInst = partes[0];
    const minLv = parseInt(partes[1]);
    const maxLv = parseInt(partes[2]);
    const moedasPrevistas = parseInt(partes[3]);

    let todosPersonagens = [];
    appState.contas.forEach(conta => {
        conta.personagens.forEach(p => {
            if (p.level >= minLv && p.level <= maxLv) {
                todosPersonagens.push({...p, emailConta: conta.email});
            }
        });
    });

    if(todosPersonagens.length === 0) {
        mostrarToast(`Nenhum personagem tem nível entre ${minLv} e ${maxLv} para a instância.`, 'error');
        return;
    }

    todosPersonagens.sort((a, b) => b.level - a.level);

    let grupos = [];
    
    todosPersonagens.forEach(p => {
        let alocado = false;
        
        for(let i=0; i<grupos.length; i++) {
            let g = grupos[i];
            
            if(g.length >= maxSize) continue;
            
            let maiorLevelDoGrupo = g[0].level; 
            if((maiorLevelDoGrupo - p.level) > 15) continue;
            
            let temMesmaConta = g.some(membro => membro.emailConta === p.emailConta);
            if(temMesmaConta) continue;

            g.push(p);
            alocado = true;
            break;
        }
        
        if(!alocado) {
            grupos.push([p]);
        }
    });
    
    appState.gruposAtuais = grupos;
    appState.instanciaAtual = { nome: nomeInst, minLv: minLv, maxLv: maxLv, moedas: moedasPrevistas };
    
    mostrarToast('Grupos gerados com base nas regras!');
    renderizarGruposTela();
    atualizarSelectFarm();
}

function renderizarGruposTela() {
    const container = document.getElementById('container-grupos');
    container.innerHTML = '';

    if(appState.gruposAtuais.length === 0) return;

    const { nome, minLv, maxLv, moedas } = appState.instanciaAtual;
    const nivelText = maxLv === 250 ? `Nv ${minLv}+` : `Nv ${minLv} a ${maxLv}`;

    let headerHtml = `
        <div class="flex justify-between items-center bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <div>
                <h3 class="font-bold text-indigo-900 text-lg">${nome}</h3>
                <p class="text-indigo-600 text-sm font-medium"><i class="fa-solid fa-ranking-star"></i> Requisito: ${nivelText}</p>
            </div>
            <div class="text-right">
                <span class="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">Previsão: ${moedas} Moedas</span>
            </div>
        </div>
    `;
    container.innerHTML = headerHtml;

    appState.gruposAtuais.forEach((grupo, idx) => {
        let maxLvl = Math.max(...grupo.map(p => p.level));
        let minLvl = Math.min(...grupo.map(p => p.level));
        let temSup = grupo.some(p => isSuporte(p.classe));

        let flagSup = temSup ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 font-medium ml-2"><i class="fa-solid fa-plus-circle"></i> C/ Suporte</span>` : `<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-medium ml-2"><i class="fa-solid fa-triangle-exclamation"></i> Sem Suporte</span>`;

        let charsHtml = grupo.map(p => {
            let cor = obterCorClasse(p.classe);
            let job = p.jobLevel || 1;
            return `<div class="p-2 border rounded ${cor} text-sm flex justify-between items-center shadow-sm">
                        <span class="font-bold">${p.nome}</span>
                        <div class="text-right">
                            <span class="block text-xs opacity-80">${p.classe} (Nv ${p.level} / J. ${job})</span>
                            <span class="block text-[10px] text-slate-500 max-w-[100px] truncate" title="${p.emailConta}">${p.emailConta.split('@')[0]}</span>
                        </div>
                    </div>`;
        }).join('');

        container.innerHTML += `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4">
                <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 class="font-bold text-slate-700">Grupo ${idx + 1}</h4>
                    <div class="flex items-center text-xs text-slate-500 font-medium">
                        <span class="bg-white px-2 py-1 rounded border shadow-sm">Membros: ${grupo.length}</span>
                        <span class="bg-white px-2 py-1 rounded border shadow-sm ml-2">Nv ${maxLvl} ~ ${minLvl}</span>
                        ${flagSup}
                    </div>
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        ${charsHtml}
                    </div>
                </div>
            </div>
        `;
    });
}

// --- FARM E MOEDAS ---
function atualizarSelectFarm() {
    let sel = document.getElementById('select-grupo-farm');
    sel.innerHTML = '';
    
    if(appState.instanciaAtual) {
        document.getElementById('moedas-grupo-farm').value = appState.instanciaAtual.moedas || 0;
    }

    if(appState.gruposAtuais.length === 0) {
        sel.innerHTML = '<option value="">Nenhum grupo gerado ainda</option>';
        return;
    }
    
    appState.gruposAtuais.forEach((g, idx) => {
        sel.innerHTML += `<option value="${idx}">Grupo ${idx + 1} (${g.length} membros)</option>`;
    });
}

function registrarFarmGrupo() {
    let idx = document.getElementById('select-grupo-farm').value;
    let moedas = parseInt(document.getElementById('moedas-grupo-farm').value);
    
    if(idx === "" || isNaN(moedas) || moedas <= 0) return mostrarToast('Valores inválidos para farm.', 'error');
    
    let grupo = appState.gruposAtuais[idx];
    let instName = appState.instanciaAtual.nome || 'Instância Desconhecida';

    let emailsAlvos = [...new Set(grupo.map(p => p.emailConta))];
    
    emailsAlvos.forEach(email => {
        let c = appState.contas.find(x => x.email === email);
        if(c) {
            c.moedas += moedas;
            registrarNoHistorico(email, `Farm: ${instName} (Grupo ${parseInt(idx)+1})`, moedas);
        }
    });

    salvarDados();
    renderizarContas();
    renderizarHistorico();
    mostrarToast(`Farm registrado! +${moedas} moedas para as contas do Grupo ${parseInt(idx)+1}`);
}

function ajustarMoedasManual(adicionar) {
    let email = document.getElementById('select-conta-manual').value;
    let valor = parseInt(document.getElementById('valor-manual').value);
    let desc = document.getElementById('desc-manual').value.trim() || 'Ajuste Manual';
    
    if(!email || isNaN(valor) || valor <= 0) return mostrarToast('Valores inválidos.', 'error');
    
    let c = appState.contas.find(x => x.email === email);
    if(!c) return;

    let diff = adicionar ? valor : -valor;
    if(!adicionar && c.moedas < valor) return mostrarToast('Saldo insuficiente nesta conta!', 'error');

    c.moedas += diff;
    let operacao = adicionar ? `Entrada: ${desc}` : `Saída: ${desc}`;
    registrarNoHistorico(email, operacao, diff);

    document.getElementById('desc-manual').value = '';
    salvarDados();
    renderizarContas();
    renderizarHistorico();
    if(!document.getElementById('aba-loja').classList.contains('hidden')) calcularLoja();
    
    mostrarToast('Saldo atualizado manualmente.');
}

function registrarNoHistorico(email, desc, valor) {
    let obj = {
        data: new Date().toLocaleString('pt-BR'),
        email: email,
        desc: desc,
        valor: valor
    };
    appState.historico.unshift(obj);
    if(appState.historico.length > 50) appState.historico.pop(); // Limita a 50 itens
}

function renderizarHistorico() {
    let t = document.getElementById('tabela-historico');
    t.innerHTML = '';
    appState.historico.forEach(h => {
        let cor = h.valor >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
        let sinal = h.valor >= 0 ? '+' : '';
        t.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-2">${h.data}</td>
                <td class="px-4 py-2">${h.email}</td>
                <td class="px-4 py-2">${h.desc}</td>
                <td class="px-4 py-2 text-right ${cor}">${sinal}${h.valor}</td>
            </tr>
        `;
    });
}

// --- LOJA ---
function calcularLoja() {
    let email = document.getElementById('select-conta-loja').value;
    let saldo = 0;
    
    if(email) {
        let c = appState.contas.find(x => x.email === email);
        saldo = c ? c.moedas : 0;
    }
    
    document.getElementById('saldo-atual-loja').innerText = saldo;

    let filtroCat = document.getElementById('filtro-categoria-loja').value;
    let ordem = document.getElementById('ordem-loja').value;

    let itensFiltrados = itensLoja.map((item, index) => {
        return { ...item, idxOriginal: index };
    });

    if(filtroCat !== 'Todas') {
        itensFiltrados = itensFiltrados.filter(item => item.categoria === filtroCat);
    }

    if(ordem === 'menor_preco') {
        itensFiltrados.sort((a, b) => a.custo - b.custo);
    } else if (ordem === 'maior_preco') {
        itensFiltrados.sort((a, b) => b.custo - a.custo);
    } else if (ordem === 'az') {
        itensFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    document.getElementById('qtd-itens-loja').innerText = itensFiltrados.length;

    let grid = document.getElementById('grid-loja');
    grid.innerHTML = '';

    itensFiltrados.forEach((item) => {
        let qtdPossivel = Math.floor(saldo / item.custo);
        let podeComprar = email && qtdPossivel > 0;
        let corBorda = podeComprar ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 cursor-pointer shadow-sm hover:shadow-md transition-all' : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed';
        let action = podeComprar ? `onclick="comprarItemLoja(${item.idxOriginal})"` : '';
        
        grid.innerHTML += `
            <div class="border-2 ${corBorda} p-4 mt-2 rounded-xl text-center flex flex-col justify-between relative group" ${action}>
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${item.corCat || 'bg-slate-200 text-slate-700'} border border-white whitespace-nowrap">
                    <i class="fa-solid ${item.icone || 'fa-box'}"></i> ${item.categoria || 'Geral'}
                </div>
                <div class="mb-3 mt-2">
                    <span class="block text-sm font-bold text-slate-700">${item.nome}</span>
                    <span class="block text-xs font-medium text-slate-500 mt-1 bg-white inline-block px-2 py-0.5 rounded border border-slate-200">Custo: ${item.custo} <i class="fa-solid fa-coins text-yellow-500"></i></span>
                </div>
                <div class="mt-auto">
                    ${podeComprar ? 
                        `<button class="w-full bg-green-500 group-hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded shadow transition-colors flex items-center justify-center gap-2">
                            <i class="fa-solid fa-bag-shopping"></i> Comprar
                        </button>` 
                        : 
                        `<div class="w-full bg-slate-300 text-slate-500 text-sm font-bold py-2 px-3 rounded flex items-center justify-center gap-2">
                            <i class="fa-solid fa-lock"></i> ${email ? 'Insuficiente' : 'Selecione Conta'}
                        </div>`
                    }
                    <div class="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                        Limite: ${email ? qtdPossivel : 0} un.
                    </div>
                </div>
            </div>
        `;
    });
    
    if(itensFiltrados.length === 0) {
        grid.innerHTML = `<div class="col-span-full p-10 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300"><i class="fa-solid fa-box-open text-3xl mb-2 block"></i>Nenhum item encontrado com este filtro.</div>`;
    }
}

function comprarItemLoja(idxOriginalItem) {
    let email = document.getElementById('select-conta-loja').value;
    if(!email) return mostrarToast('Selecione uma conta primeiro.', 'error');

    let item = itensLoja[idxOriginalItem];
    let c = appState.contas.find(x => x.email === email);
    
    if(!c) return;

    if(c.moedas < item.custo) {
        return mostrarToast('Saldo insuficiente para comprar este item.', 'error');
    }

    c.moedas -= item.custo;
    registrarNoHistorico(email, `Resgate na Loja: ${item.nome}`, -item.custo);
    
    salvarDados();
    renderizarContas();
    renderizarHistorico();
    calcularLoja(); // Atualiza a tela da loja imediatamente
    
    mostrarToast(`Sucesso! 1x ${item.nome} resgatado.`);
}

// --- PERSISTÊNCIA (LocalStorage e JSON) ---
function salvarDados() {
    let dadosSalvar = {
        contas: appState.contas,
        historico: appState.historico
    };
    let jsonString = JSON.stringify(dadosSalvar, null, 2);
    localStorage.setItem('roFarmData', jsonString);
    atualizarTextareaJson();
}

function carregarDadosLocais() {
    let salvos = localStorage.getItem('roFarmData');
    if(salvos) {
        try {
            let obj = JSON.parse(salvos);
            appState.contas = obj.contas || [];
            appState.historico = obj.historico || [];
        } catch(e) {
            console.error('Erro ao carregar dados locais', e);
        }
    }
}

function atualizarTextareaJson() {
    let dadosSalvar = {
        contas: appState.contas,
        historico: appState.historico
    };
    document.getElementById('json-dados').value = JSON.stringify(dadosSalvar, null, 2);
}

function copiarDados() {
    let txt = document.getElementById('json-dados');
    txt.select();
    document.execCommand('copy');
    mostrarToast('Código copiado! Cole no seu WhatsApp ou Bloco de Notas.');
}

function importarDados() {
    let txt = document.getElementById('json-dados').value;
    try {
        let obj = JSON.parse(txt);
        if(obj.contas) {
            appState.contas = obj.contas;
            appState.historico = obj.historico || [];
            appState.gruposAtuais = [];
            salvarDados();
            atualizarSelectsContas();
            renderizarContas();
            renderizarHistorico();
            mostrarToast('Dados importados com sucesso!');
        } else {
            mostrarToast('Formato de dados inválido.', 'error');
        }
    } catch(e) {
        mostrarToast('Erro ao ler os dados. Verifique se o código está correto.', 'error');
    }
}

function limparTudo() {
    let campoConfirmacao = prompt('Para apagar TUDO (todas as contas, moedas e históricos), digite: APAGAR');
    if(campoConfirmacao === 'APAGAR') {
        appState.contas = [];
        appState.historico = [];
        appState.gruposAtuais = [];
        salvarDados();
        atualizarSelectsContas();
        renderizarContas();
        renderizarHistorico();
        renderizarGruposTela();
        mostrarToast('Todos os dados foram apagados.', 'error');
    } else if(campoConfirmacao !== null) {
        mostrarToast('Ação cancelada. Palavra-chave incorreta.', 'info');
    }
}
