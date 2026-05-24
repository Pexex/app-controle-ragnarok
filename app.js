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

function mostrarToastConfirmacao(mensagem, onConfirm, onCancel = null, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    let bgClass = tipo === 'success' ? 'bg-green-600' : (tipo === 'error' ? 'bg-red-600' : 'bg-blue-600');
    let iconClass = tipo === 'success' ? 'fa-check-circle' : (tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

    toast.className = `${bgClass} text-white px-4 py-3 rounded shadow-lg toast-enter text-sm font-medium min-w-[280px]`;
    toast.innerHTML = `
        <div class="flex-1 flex items-start gap-3">
            <i class="fa-solid ${iconClass} text-lg mt-0.5"></i>
            <span class="leading-snug">${mensagem}</span>
        </div>
        <div class="flex items-center gap-2 ml-4 mt-3 sm:mt-0 sm:ml-0">
            <button class="px-3 py-1 rounded bg-white text-slate-900 font-semibold hover:bg-slate-100 confirm-toast-yes">Confirmar</button>
            <button class="px-3 py-1 rounded border border-white text-white hover:bg-white/10 confirm-toast-no">Cancelar</button>
        </div>
    `;

    container.appendChild(toast);

    const removeToast = () => {
        if (!toast) return;
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.confirm-toast-yes').onclick = () => {
        onConfirm();
        removeToast();
    };
    toast.querySelector('.confirm-toast-no').onclick = () => {
        if (onCancel) onCancel();
        removeToast();
    };

    setTimeout(removeToast, 15000);
}

function copiarParaClipboard(texto, info = 'Comando copiado!') {
    const fallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            mostrarToast(`${info} ${texto}`);
        } catch (err) {
            mostrarToast('Não foi possível copiar para a área de transferência.', 'error');
        }
        document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
            () => mostrarToast(`${info} ${texto}`),
            () => fallbackCopy()
        );
    } else {
        fallbackCopy();
    }
}

// --- ESTADO DA APLICAÇÃO ---
let appState = {
    contas: [], // { email: 'x', moedas: 0, personagens: [ { id, nome, classe, level, genero } ] }
    historico: [], // { data, tipo, descricao, valor }
    gruposAtuais: [], // [{ name, members: [...] }]
    gruposHistorico: [], // histórico de farm por grupo
    instanciaAtual: { nome: '', minLv: 1, maxLv: 250, moedas: 0 },
    instanciaStatus: {}, // { [instName]: { lastDone: ISO, nextAllowed: ISO } }
    eventos: [] // { id, nome, moeda, descricao, dataFim, ativo, personagensEvento: { charId: quantidade }, requisitos: [], quests: [], loja: [], itensFarmados: [] }
};

let eventosDisponiveis = []; // Eventos carregados do arquivo eventos.json
let eventoSelecionadoId = null;
let eventoDetalheAba = 'overview';

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
window.onload = async () => {
    carregarDadosLocais();
    manterGruposConsistentes();
    await carregarEventosExternos();
    atualizarSelectsContas();
    renderizarContas();
    renderizarHistorico();
    renderizarGruposTela();
    atualizarSelectFarm();
    renderizarEventos();
    atualizarTextareaJson();
    mudarArea('contas');

    // wire up instance selection changes
    const selectInst = document.getElementById('select-instancia');
    if (selectInst) {
        selectInst.addEventListener('change', () => {
            const rawInst = selectInst.value;
            const partes = rawInst.split('|');
            const nomeInst = partes[0];
            const minLv = parseInt(partes[1]);
            const maxLv = parseInt(partes[2]);
            const moedasPrevistas = parseInt(partes[3]);
            appState.instanciaAtual = { nome: nomeInst, minLv: minLv, maxLv: maxLv, moedas: moedasPrevistas };
            salvarDados();
            mostrarToast(`Instância "${nomeInst}" selecionada.`);
        });
    }
};

function mudarArea(areaId) {
    document.querySelectorAll('.area-conteudo').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('button[id^="tab-area-"]').forEach(el => {
        el.classList.remove('tab-active');
        el.classList.add('text-slate-500');
    });

    const areaElement = document.getElementById(`area-${areaId}`);
    if(areaElement) areaElement.classList.remove('hidden');
    const areaBtn = document.getElementById(`tab-area-${areaId}`);
    if(areaBtn) {
        areaBtn.classList.add('tab-active');
        areaBtn.classList.remove('text-slate-500');
    }

    document.querySelectorAll('.subnav').forEach(el => el.classList.add('hidden'));
    if(areaId === 'desbravadores') {
        document.getElementById('subnav-desbravadores').classList.remove('hidden');
        mudarSubAba('grupos');
    }
    if(areaId === 'eventos') {
        renderizarEventos();
    }
}

function mudarSubAba(subAbaId, updateNav = true) {
    document.querySelectorAll('.subaba-conteudo').forEach(el => el.classList.add('hidden'));

    if(updateNav) {
        document.querySelectorAll('button[id^="tab-sub-"]').forEach(el => {
            el.classList.remove('tab-active');
            el.classList.add('text-slate-500');
        });

        const subTabBtn = document.getElementById(`tab-sub-${subAbaId}`);
        if(subTabBtn) {
            subTabBtn.classList.add('tab-active');
            subTabBtn.classList.remove('text-slate-500');
        }
    }

    const target = document.getElementById(`subaba-${subAbaId}`) || document.getElementById(subAbaId);
    if(target) target.classList.remove('hidden');

    if(subAbaId.startsWith('eventos')) renderizarEventos();
    if(subAbaId === 'loja') calcularLoja();
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
        manterGruposConsistentes();
        mostrarToast('Personagem removido.');
    }
}

function removerConta(email) {
    appState.contas = appState.contas.filter(c => c.email !== email);
    salvarDados();
    atualizarSelectsContas();
    renderizarContas();
    manterGruposConsistentes();
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

// Mapa de classes para nomes de arquivo de sprite corretos
const mapearClasseParaArquivo = {
    'Paladino': 'paladino',
    'Arquimago': 'arquimago_cl_4',
    'Professor': 'professor',
    'Atirador de Elite': 'atiradores_de_elite',
    'Menestrel': 'menestrel',
    'Cigana': 'cigana',
    'Sumo Sacerdote': 'sumo_sacerdote',
    'Mestre': 'mestre',
    'Mestre-Ferreiro': 'ferreiro',
    'Criador': 'criador',
    'Algoz': 'algoz_das_sombras',
    'Desordeiro': 'desordeiro',
    'Oboro': 'oboro',
    'Lorde': 'lorde',
    'Taekwon': 'taekwon',
    'Noviço': 'novicos',
    'Sicário': 'sicarios',
    'Ninja': 'ninja',
    'Justiceiro': 'justiceiro',
    'Bruxo': 'bruxo',
    'Invocador (Físico)': 'invocador',
    'Invocador (Mágico)': 'invocador'
};

// Unir variações de Invocador para usar o mesmo sprite
mapearClasseParaArquivo['Invocador'] = 'invocador';
mapearClasseParaArquivo['Invocador (Suporte)'] = 'invocador';
mapearClasseParaArquivo['Invocador (Dano)'] = 'invocador';
mapearClasseParaArquivo['Invocador (Controle)'] = 'invocador';

// Mapa de classes para nomes de arquivo de emblema (alguns diferem do sprite)
const mapearClasseParaEmblema = {
    'Paladino': 'paladinos',
    'Arquimago': 'arquimago_cl_4',
    'Professor': 'professores',
    'Atirador de Elite': 'atiradores_de_elite',
    'Menestrel': 'menestréis',
    'Cigana': 'ciganas',
    'Sumo Sacerdote': 'sumo_sacerdotes',
    'Mestre': 'mestres',
    'Mestre-Ferreiro': 'mestres_ferreiros',
    'Criador': 'criadores',
    'Algoz': 'algoz_das_sombras',
    'Desordeiro': 'desordeiros',
    'Oboro': 'oboro',
    'Lorde': 'lordes',
    'Taekwon': 'taekwons',
    'Noviço': 'novico',
    'Sicário': 'sicario',
    'Ninja': 'ninjas',
    'Justiceiro': 'justiceiros',
    'Bruxo': 'bruxo',
    'Invocador (Físico)': 'invocadores',
    'Invocador (Mágico)': 'invocadores'
};

// Emblema único para variações de Invocador
mapearClasseParaEmblema['Invocador'] = 'invocadores';
mapearClasseParaEmblema['Invocador (Suporte)'] = 'invocadores';
mapearClasseParaEmblema['Invocador (Dano)'] = 'invocadores';
mapearClasseParaEmblema['Invocador (Controle)'] = 'invocadores';

function obterNomeEmblema(classeName) {
    return mapearClasseParaEmblema[classeName] || sanitizarNomeArquivo(classeName);
}

function obterImagemClasse(classeName, genero = 'M') {
    let fileName = mapearClasseParaArquivo[classeName] || sanitizarNomeArquivo(classeName);
    const gen = genero.toLowerCase(); // 'm' ou 'f'

    // Kagerou usa a arte de Oboro quando o personagem é feminino.
    if(fileName === 'kagerou' && gen === 'f') {
        fileName = 'oboro';
    }

    return `img/${fileName}_${gen}.png`;
}

// Gera possíveis variações de nomes base para sprite (ajuda com plural/sufixos)
function gerarCandidatosNomeBase(classeName) {
    const list = [];
    const mapped = mapearClasseParaArquivo[classeName];
    if(mapped) list.push(mapped);
    const sanitized = sanitizarNomeArquivo(classeName);
    if(sanitized) list.push(sanitized);
    if(!sanitized.endsWith('s')) list.push(sanitized + 's');
    list.push(sanitized + '_1');
    return [...new Set(list)].filter(Boolean);
}

function gerarCandidatosImagemClasse(classeName, genero = 'M') {
    const gen = genero.toLowerCase();
    return gerarCandidatosNomeBase(classeName).map(base => `img/${base}_${gen}.png`);
}

function gerarCandidatosEmblema(classeName) {
    const list = [];
    const mapped = mapearClasseParaEmblema[classeName];
    if(mapped) list.push(mapped);
    const sanitized = sanitizarNomeArquivo(classeName);
    if(sanitized) list.push(sanitized);
    if(!sanitized.endsWith('s')) list.push(sanitized + 's');
    return [...new Set(list)].filter(Boolean).map(base => `img/emblema_${base}.png`);
}

function handleImgError(el) {
    const alt = el.dataset.alt;
    const fallback = el.dataset.fallback;
    // Depuração: log dos candidatos e fallback para identificar arquivos faltantes
    const classLabel = el.getAttribute('alt') || 'desconhecido';
    if(!alt) {
        console.warn(`Imagem: sem candidatos para "${classLabel}" — aplicando fallback: ${fallback}`);
        if(fallback) el.src = fallback;
        el.onerror = null;
        return;
    }
    const parts = alt.split('|');
    let idx = parseInt(el.dataset.idx || '0');
    idx++;
    if(idx < parts.length) {
        console.warn(`Imagem: tentativa ${idx+1}/${parts.length} para "${classLabel}": ${parts[idx]}`);
        el.dataset.idx = idx;
        el.src = parts[idx];
    } else {
        console.warn(`Imagem: candidatos esgotados para "${classLabel}" — aplicando fallback: ${fallback}`);
        el.onerror = null;
        if(fallback) el.src = fallback;
    }
}

function focarNovoChar(email) {
    document.getElementById('novo-char-email').value = email;
    document.getElementById('novo-char-nome').value = '';
    document.getElementById('novo-char-level').value = '1';
    document.getElementById('novo-char-job').value = '1';
    document.getElementById('novo-char-classe').selectedIndex = 0;
    document.querySelector(`input[name="novo-char-genero"][value="M"]`).checked = true; // Reseta pro masculino
    document.getElementById('novo-char-booster').checked = false; // Resetar booster para novo personagem
    document.getElementById('novo-char-battlepass').checked = false;
    document.getElementById('novo-char-battlepass-level').value = '1';
    
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
        
        // Tenta carregar local com múltiplos candidatos, senão cai pro fallback dinâmico
        const previewCandidates = gerarCandidatosImagemClasse(classeName, genero);
        imgEl.src = previewCandidates[0] || obterImagemClasse(classeName, genero);
        imgEl.dataset.alt = previewCandidates.join('|');
        imgEl.dataset.fallback = obterFallbackImagemClasse(classeName, genero);
        imgEl.dataset.idx = 0;
        imgEl.onerror = function() { handleImgError(this); };
        
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
    const boosterEvento = document.getElementById('novo-char-booster').checked;
    const battlePass = document.getElementById('novo-char-battlepass').checked;
    const battlePassLevel = parseInt(document.getElementById('novo-char-battlepass-level').value) || 1;

    if(!email) return mostrarToast('Erro: Email não selecionado.', 'error');
    if(!nome) return mostrarToast('Digite o nome do personagem.', 'error');
    if(isNaN(level) || level < 1 || level > 250) return mostrarToast('Level base inválido (1-250).', 'error');
    if(isNaN(job) || job < 1 || job > 80) return mostrarToast('Level de classe (Job) inválido (1-80).', 'error');
    if(battlePass && (isNaN(battlePassLevel) || battlePassLevel < 1 || battlePassLevel > 100)) return mostrarToast('Nível do Passe de Batalha inválido (1-100).', 'error');

    let conta = appState.contas.find(c => c.email === email);
    conta.personagens.push({
        id: Date.now().toString(),
        nome,
        classe,
        level,
        jobLevel: job,
        genero: genero,
        boosterEvento: boosterEvento,
        battlePass: battlePass,
        battlePassLevel: battlePass ? battlePassLevel : 1
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
            manterGruposConsistentes();
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
    document.getElementById('edit-char-booster').checked = !!char.boosterEvento;
    document.getElementById('edit-char-battlepass').checked = !!char.battlePass;
    document.getElementById('edit-char-battlepass-level').value = char.battlePassLevel || 1;

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
    let novoNome = document.getElementById('edit-char-nome').value.trim();
    let novoLevel = parseInt(document.getElementById('edit-char-level').value);
    let novoJob = parseInt(document.getElementById('edit-char-job').value);
    let novaClasse = document.getElementById('edit-char-classe').value;
    let novoGenero = document.querySelector('input[name="edit-char-genero"]:checked').value;

    if(!novoNome) {
        return mostrarToast('Digite o nome do personagem.', 'error');
    }
    if(isNaN(novoLevel) || novoLevel < 1 || novoLevel > 250) {
        return mostrarToast('Level base inválido (1-250).', 'error');
    }
    if(isNaN(novoJob) || novoJob < 1 || novoJob > 80) {
        return mostrarToast('Job inválido (1-80).', 'error');
    }

    const battlePass = document.getElementById('edit-char-battlepass').checked;
    const battlePassLevel = parseInt(document.getElementById('edit-char-battlepass-level').value) || 1;
    if(battlePass && (isNaN(battlePassLevel) || battlePassLevel < 1 || battlePassLevel > 100)) {
        return mostrarToast('Nível do Passe de Batalha inválido (1-100).', 'error');
    }

    let conta = appState.contas.find(c => c.email === email);
    if(conta) {
        let char = conta.personagens.find(p => p.id === idChar);
        if(char) {
            char.nome = novoNome;
            char.level = novoLevel;
            char.jobLevel = novoJob;
            char.classe = novaClasse;
            char.genero = novoGenero;
            char.boosterEvento = document.getElementById('edit-char-booster').checked;
            char.battlePass = battlePass;
            char.battlePassLevel = battlePass ? battlePassLevel : 1;
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
    const suportes = ['Sacerdote', 'Arcebispo', 'Cardeal', 'Bardo', 'Odalisca', 'Menestrel', 'Cigana', 'Trovador', 'Musa', 'Animador', 'Espiritualista', 'Ceifador de Almas', 'Invocador'];
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
            let boosterBadge = p.boosterEvento ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">Booster</span>' : '';
            let battlePassBadge = p.battlePass ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Passe NV ${p.battlePassLevel || 1}</span>` : '';
            
            // Usar o mesmo mapeamento para arquivos de emblema
            let fileName = mapearClasseParaArquivo[p.classe] || sanitizarNomeArquivo(p.classe);
            let nomeEmblema = obterNomeEmblema(p.classe);
            let fallbackImg = obterFallbackImagemClasse(p.classe, gen);
            
            // candidatos de sprite e emblema
            const spriteCandidates = gerarCandidatosImagemClasse(p.classe, gen);
            const spriteFirst = spriteCandidates[0] || obterImagemClasse(p.classe, gen);
            const spriteAlt = spriteCandidates.join('|');

            const emblemCandidates = gerarCandidatosEmblema(p.classe);
            const emblemFirst = emblemCandidates[0] || `img/emblema_${obterNomeEmblema(p.classe)}.png`;
            const emblemAlt = emblemCandidates.join('|');

            const fallbackSmall = `https://placehold.co/28x28/${corInfo.bg}/${corInfo.text}?text=${p.classe.substring(0,2).toUpperCase()}`;
            const fallbackLarge = obterFallbackImagemClasse(p.classe, gen);

            return `
            <div class="relative bg-white border-2 border-indigo-100 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col h-[340px] overflow-hidden">
                
                <!-- Ícone de Classe (Canto Superior Direito) + Badge Booster -->
                <div class="absolute top-3 left-3 flex flex-col items-start gap-1 z-20">
                    ${boosterBadge ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">Booster</span>` : ''}
                    ${battlePassBadge ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">Passe NV ${p.battlePassLevel || 1}</span>` : ''}
                </div>
                <div class="absolute top-3 right-3 z-20">
                    <div class="bg-white border border-slate-300 w-7 h-7 rounded flex items-center justify-center shadow-sm" title="${p.classe}">
                        <img src="${emblemFirst}" data-alt="${emblemAlt}" data-fallback="${fallbackSmall}" class="w-6 h-6 object-contain rounded-sm" alt="${p.classe}" onerror="handleImgError(this)">
                    </div>
                </div>
                <div class="flex-1 flex items-center justify-center p-4 pt-12 bg-slate-100 min-h-[190px]">
                    <img src="${spriteFirst}" data-alt="${spriteAlt}" data-fallback="${fallbackLarge}" alt="${p.classe}" class="max-h-full max-w-full object-contain" onerror="handleImgError(this)">
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
            const nivelPersonagem = parseInt(p.level, 10);
            if (isNaN(nivelPersonagem)) return;
            if (nivelPersonagem >= minLv && nivelPersonagem <= maxLv) {
                todosPersonagens.push({...p, level: nivelPersonagem, emailConta: conta.email});
            }
        });
    });

    if(todosPersonagens.length === 0) {
        mostrarToast(`Nenhum personagem tem nível entre ${minLv} e ${maxLv} para a instância.`, 'error');
        return;
    }

    todosPersonagens.sort((a, b) => b.level - a.level);

    const targetSize = Math.max(1, maxSize);
    const maxGroups = Math.ceil(todosPersonagens.length / targetSize);

    // Inicializa todos os grupos vazios — vamos preencher preferencialmente até targetSize
    let grupos = [];
    for (let i = 0; i < maxGroups; i++) grupos.push([]);

    // Função utilitária para avaliar candidaturas
    function trataCandidatura(g, p) {
        if (g.length >= targetSize) return null;
        const temMesmaConta = g.some(m => m.emailConta === p.emailConta);
        if (temMesmaConta) return null;
        const groupMax = g.length ? Math.max(...g.map(m => m.level)) : p.level;
        const groupMin = g.length ? Math.min(...g.map(m => m.level)) : p.level;
        const candidateMax = Math.max(groupMax, p.level);
        const candidateMin = Math.min(groupMin, p.level);
        const candidateRange = candidateMax - candidateMin;
        if (candidateRange > 15) return null;
        return { candidateRange, groupMax };
    }

    // Para cada personagem, tente colocá-lo em um grupo com espaço, priorizando os grupos mais vazios
    todosPersonagens.forEach(p => {
        let bestIdx = -1;
        let bestLen = Infinity;
        let bestRange = Infinity;

        // Primeira tentativa: encontra o melhor grupo respeitando CONTA + RANGE
        for (let i = 0; i < grupos.length; i++) {
            const g = grupos[i];
            const cand = trataCandidatura(g, p);
            if (!cand) continue;
            if (g.length < bestLen || (g.length === bestLen && cand.candidateRange < bestRange)) {
                bestIdx = i;
                bestLen = g.length;
                bestRange = cand.candidateRange;
            }
        }

        if (bestIdx !== -1) {
            grupos[bestIdx].push(p);
            grupos[bestIdx].sort((a, b) => b.level - a.level);
            return;
        }

        // Segunda tentativa: relaxa RANGE mas NUNCA relaxa a restrição de CONTA
        for (let i = 0; i < grupos.length; i++) {
            const g = grupos[i];
            if (g.length >= targetSize) continue;
            // Verifica se há alguém da mesma conta — se tiver, pula este grupo
            const temMesmaConta = g.some(m => m.emailConta === p.emailConta);
            if (temMesmaConta) continue;
            // Se não há ninguém da mesma conta, aloca mesmo que o range ultrapasse 15
            grupos[i].push(p);
            grupos[i].sort((a, b) => b.level - a.level);
            return;
        }

        // Terceira tentativa (fallback): coloca em novo grupo solo
        grupos.push([p]);
    });

    // Remover possíveis grupos vazios (quando total < maxGroups)
    grupos = grupos.filter(g => g.length > 0);

    // Salva como objetos com nome e membros para permitir nomeação futura
    // Preserve existing group names if available
    const oldNames = (appState.gruposAtuais || []).map(g => g.name || '');
    appState.gruposAtuais = grupos.map((g, i) => ({ name: oldNames[i] || `Grupo ${i+1}`, members: g }));
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
                <div class="mt-2"><span class="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">Previsão: ${moedas} Moedas</span></div>
            </div>
        </div>
    `;
    container.innerHTML = headerHtml;

    appState.gruposAtuais.forEach((grupoObj, idx) => {
        const grupo = grupoObj.members || [];
        let maxLvl = grupo.length ? Math.max(...grupo.map(p => p.level)) : 0;
        let minLvl = grupo.length ? Math.min(...grupo.map(p => p.level)) : 0;
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

        const groupName = grupoObj.name || `Grupo ${idx + 1}`;
        container.innerHTML += `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-4">
                <div class="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <h4 class="font-bold text-slate-700">${groupName}</h4>
                        <input type="text" data-idx="${idx}" class="group-name-input ml-3 p-1 px-2 text-sm border rounded" value="${groupName}" placeholder="Nome do grupo" />
                    </div>
                    <div class="flex items-center text-xs text-slate-500 font-medium">
                        <span class="bg-white px-2 py-1 rounded border shadow-sm">Membros: ${grupo.length}</span>
                        <span class="bg-white px-2 py-1 rounded border shadow-sm ml-2">Nv ${maxLvl} ~ ${minLvl}</span>
                        ${flagSup}
                        <div class="ml-3">
                            <button data-grupo-idx="${idx}" class="btn-marcar-grupo px-2 py-1 bg-green-500 text-white rounded text-xs ml-2">Marcar feito</button>
                            <div id="status-grupo-${idx}" class="text-[10px] text-slate-500 mt-1"></div>
                        </div>
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

    // attach listeners for group name inputs and per-group marcar buttons
    setTimeout(() => {
        document.querySelectorAll('.group-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = e.target.value.trim() || `Grupo ${idx+1}`;
                if(appState.gruposAtuais[idx]) appState.gruposAtuais[idx].name = val;
                atualizarSelectFarm();
            });
        });

        document.querySelectorAll('.btn-marcar-grupo').forEach(btn => {
            const idx = parseInt(btn.getAttribute('data-grupo-idx'));
            const instName = appState.instanciaAtual && appState.instanciaAtual.nome ? appState.instanciaAtual.nome : '';
            // set disabled state based on per-group cooldown
            const st = appState.instanciaStatus && appState.instanciaStatus[instName] && appState.instanciaStatus[instName].groups ? appState.instanciaStatus[instName].groups[idx] : null;
            const statusDiv = document.getElementById(`status-grupo-${idx}`);
            const now = new Date();
            if (st && st.nextAllowed) {
                const next = new Date(st.nextAllowed);
                if (now < next) {
                    btn.disabled = true;
                    btn.classList.add('opacity-40', 'cursor-not-allowed');
                    if(statusDiv) statusDiv.innerText = `Próx.: ${next.toLocaleString()}`;
                } else {
                    btn.disabled = false;
                    if(statusDiv) statusDiv.innerText = st.lastDone ? `Últ.: ${new Date(st.lastDone).toLocaleString()}` : '';
                }
            } else {
                btn.disabled = false;
                if(statusDiv) statusDiv.innerText = '';
            }

            btn.onclick = () => {
                if(!instName) return mostrarToast('Nenhuma instância selecionada.', 'error');
                abrirModalConfirmarInstancia(instName, idx);
            };
        });
    }, 50);
}

// --- MODAL CONFIRMAÇÃO INSTÂNCIA ---
// Abre o modal com detalhes da instância/grupo que será marcado como feito
function abrirModalConfirmarInstancia(instName, groupIdx = null) {
    const instancia = appState.instanciaAtual;
    const moedas = instancia && instancia.moedas ? parseInt(instancia.moedas) : 0;
    
    let grupo = [];
    let emailsAlvos = [];
    let grupoName = '';
    
    if (groupIdx !== null && appState.gruposAtuais && appState.gruposAtuais[groupIdx]) {
        grupo = appState.gruposAtuais[groupIdx].members || [];
        grupoName = appState.gruposAtuais[groupIdx].name || `Grupo ${groupIdx+1}`;
        emailsAlvos = [...new Set(grupo.map(m => m.emailConta))];
    } else {
        // marcar todos os grupos
        if (appState.gruposAtuais) {
            appState.gruposAtuais.forEach(g => {
                grupo = grupo.concat(g.members || []);
            });
            emailsAlvos = [...new Set(grupo.map(m => m.emailConta))];
            grupoName = 'Todos os grupos';
        }
    }

    // Preenche o modal
    document.getElementById('modal-inst-name').innerText = instName || 'Desconhecida';
    document.getElementById('modal-grupo-name').innerText = grupoName;
    document.getElementById('modal-moedas-valor').innerText = `${moedas} moedas`;
    document.getElementById('modal-total-contas').innerText = emailsAlvos.length;

    // Lista de personagens
    const listDiv = document.getElementById('modal-personagens-list');
    listDiv.innerHTML = '';
    grupo.forEach(p => {
        const cor = obterCorClasse(p.classe);
        listDiv.innerHTML += `
            <div class="bg-white border border-slate-200 rounded p-2 text-sm flex justify-between items-start">
                <div>
                    <span class="font-bold">${p.nome}</span>
                    <span class="block text-[11px] text-slate-500">${p.classe} (Nv ${p.level})</span>
                </div>
                <span class="text-[10px] bg-slate-200 px-2 py-1 rounded whitespace-nowrap">${p.emailConta}</span>
            </div>
        `;
    });

    // Armazena params para confirmar depois
    window._pendingInstanciaConfirm = { instName, groupIdx };

    // Abre o modal
    document.getElementById('modal-confirmar-instancia').classList.remove('hidden');
}

function fecharModalConfirmarInstancia() {
    document.getElementById('modal-confirmar-instancia').classList.add('hidden');
    window._pendingInstanciaConfirm = null;
}

function confirmarMarcacaoInstancia() {
    if (!window._pendingInstanciaConfirm) return;
    const { instName, groupIdx } = window._pendingInstanciaConfirm;
    fecharModalConfirmarInstancia();
    marcarInstanciaFeita(instName, groupIdx);
}

// --- FARM E MOEDAS ---
// Mantém os grupos consistentes: remove membros fora do range e tenta preencher vagas
function manterGruposConsistentes() {
    if(!appState.gruposAtuais || appState.gruposAtuais.length === 0) return;
    const min = appState.instanciaAtual.minLv || 1;
    const max = appState.instanciaAtual.maxLv || 250;
    const targetSize = parseInt(document.getElementById('tamanho-grupo')?.value) || 5;

    // Remove membros que não existem mais ou estão fora do range
    let changed = false;
    appState.gruposAtuais.forEach(g => {
        const before = (g.members || []).length;
        g.members = (g.members || []).filter(m => {
            const conta = appState.contas.find(c => c.email === m.emailConta);
            if(!conta) return false;
            const char = conta.personagens.find(p => p.id === m.id);
            if(!char) return false;
            return char.level >= min && char.level <= max;
        });
        if(g.members.length !== before) changed = true;
    });

    // Recria pool de candidatos elegíveis (não em grupos)
    let inGroupIds = new Set();
    appState.gruposAtuais.forEach(g => (g.members || []).forEach(m => inGroupIds.add(m.id)));
    let pool = [];
    appState.contas.forEach(c => {
        c.personagens.forEach(p => {
            if(p.level >= min && p.level <= max && !inGroupIds.has(p.id)) {
                pool.push({ ...p, emailConta: c.email });
            }
        });
    });

    // Tenta preencher grupos até targetSize (último grupo pode ficar menor)
    for(let i=0;i<appState.gruposAtuais.length;i++){
        const g = appState.gruposAtuais[i];
        while((g.members || []).length < targetSize && pool.length > 0) {
            // prefira candidato de conta diferente
            let idx = pool.findIndex(cand => !(g.members || []).some(m => m.emailConta === cand.emailConta));
            if(idx === -1) idx = 0;
            const cand = pool.splice(idx,1)[0];
            g.members.push(cand);
            changed = true;
        }
    }

    if(changed) {
        salvarDados();
        renderizarGruposTela();
        atualizarSelectFarm();
    }
}

// Marca a instância como feita agora e calcula próxima permissão (próximo dia às 4:00)
function marcarInstanciaFeita(instName, groupIdx = null) {
    const now = new Date();
    // calcula próximo 4:00
    const next4 = new Date(now);
    next4.setHours(4,0,0,0);
    if(now >= next4) {
        // já passou hoje 4:00, então próxima é amanhã 4:00
        next4.setDate(next4.getDate() + 1);
    }
    appState.instanciaStatus = appState.instanciaStatus || {};
    appState.instanciaStatus[instName] = appState.instanciaStatus[instName] || { lastDone: null, nextAllowed: null, groups: {} };

    const moedasPorConta = appState.instanciaAtual && appState.instanciaAtual.moedas ? parseInt(appState.instanciaAtual.moedas) : 0;

    if (groupIdx === null) {
        // marca a instância globalmente e credita para todos os grupos (compatibilidade)
        appState.instanciaStatus[instName].lastDone = now.toISOString();
        appState.instanciaStatus[instName].nextAllowed = next4.toISOString();

        if (moedasPorConta > 0 && appState.gruposAtuais && appState.gruposAtuais.length > 0) {
            appState.gruposHistorico = appState.gruposHistorico || [];
            appState.gruposAtuais.forEach((gObj, idx) => {
                const grupoName = gObj.name || `Grupo ${idx+1}`;
                const membros = gObj.members || [];
                const emailsAlvos = [...new Set(membros.map(m => m.emailConta))];

                emailsAlvos.forEach(email => {
                    const c = appState.contas.find(x => x.email === email);
                    if (c) {
                        c.moedas = (c.moedas || 0) + moedasPorConta;
                        registrarNoHistorico(email, `Auto Farm: ${instName} (${grupoName})`, moedasPorConta);
                    }
                });

                appState.gruposHistorico.unshift({
                    data: now.toISOString(),
                    grupoIdx: idx,
                    grupoName: grupoName,
                    instancia: instName,
                    moedas: moedasPorConta,
                    emails: emailsAlvos,
                    auto: true
                });
            });
            if (appState.gruposHistorico.length > 200) appState.gruposHistorico.splice(200);
        }
    } else {
        // marca e credita apenas o grupo especificado
        appState.instanciaStatus[instName].groups = appState.instanciaStatus[instName].groups || {};
        appState.instanciaStatus[instName].groups[groupIdx] = {
            lastDone: now.toISOString(),
            nextAllowed: next4.toISOString()
        };

        if (moedasPorConta > 0 && appState.gruposAtuais && appState.gruposAtuais.length > groupIdx) {
            appState.gruposHistorico = appState.gruposHistorico || [];
            const gObj = appState.gruposAtuais[groupIdx];
            const grupoName = gObj.name || `Grupo ${groupIdx+1}`;
            const membros = gObj.members || [];
            const emailsAlvos = [...new Set(membros.map(m => m.emailConta))];

            emailsAlvos.forEach(email => {
                const c = appState.contas.find(x => x.email === email);
                if (c) {
                    c.moedas = (c.moedas || 0) + moedasPorConta;
                    registrarNoHistorico(email, `Auto Farm: ${instName} (${grupoName})`, moedasPorConta);
                }
            });

            appState.gruposHistorico.unshift({
                data: now.toISOString(),
                grupoIdx: groupIdx,
                grupoName: grupoName,
                instancia: instName,
                moedas: moedasPorConta,
                emails: emailsAlvos,
                auto: true
            });
            if (appState.gruposHistorico.length > 200) appState.gruposHistorico.splice(200);
        }
    }

    salvarDados();
    renderizarContas();
    renderizarHistorico();
    renderizarGruposTela();
    atualizarSelectFarm();
}

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
        const name = g.name || `Grupo ${idx+1}`;
        const count = (g.members || []).length;
        sel.innerHTML += `<option value="${idx}">${name} (${count} membros)</option>`;
    });
}

function registrarFarmGrupo() {
    let idx = document.getElementById('select-grupo-farm').value;
    let moedas = parseInt(document.getElementById('moedas-grupo-farm').value);
    
    if(idx === "" || isNaN(moedas) || moedas <= 0) return mostrarToast('Valores inválidos para farm.', 'error');
    
    let grupoObj = appState.gruposAtuais[idx];
    let grupo = grupoObj ? (grupoObj.members || []) : [];
    let instName = appState.instanciaAtual.nome || 'Instância Desconhecida';

    let emailsAlvos = [...new Set(grupo.map(p => p.emailConta))];
    
    emailsAlvos.forEach(email => {
        let c = appState.contas.find(x => x.email === email);
        if(c) {
            c.moedas += moedas;
            registrarNoHistorico(email, `Farm: ${instName} (Grupo ${parseInt(idx)+1})`, moedas);
        }
    });

    // Registra histórico do grupo
    appState.gruposHistorico = appState.gruposHistorico || [];
    appState.gruposHistorico.unshift({
        data: new Date().toISOString(),
        grupoIdx: parseInt(idx),
        grupoName: grupoObj ? grupoObj.name : `Grupo ${parseInt(idx)+1}`,
        instancia: instName,
        moedas: moedas,
        emails: emailsAlvos
    });
    if(appState.gruposHistorico.length > 200) appState.gruposHistorico.pop();

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
    if(!document.getElementById('subaba-loja').classList.contains('hidden')) calcularLoja();
    
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
        historico: appState.historico,
        eventos: appState.eventos,
        gruposAtuais: appState.gruposAtuais,
        gruposHistorico: appState.gruposHistorico,
        instanciaStatus: appState.instanciaStatus
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
            appState.eventos = obj.eventos || [];
            appState.gruposAtuais = obj.gruposAtuais || [];
            appState.gruposHistorico = obj.gruposHistorico || [];
            appState.instanciaStatus = obj.instanciaStatus || {};
        } catch(e) {
            console.error('Erro ao carregar dados locais', e);
        }
    }
}

function atualizarTextareaJson() {
    let dadosSalvar = {
        contas: appState.contas,
        historico: appState.historico,
        eventos: appState.eventos
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
            appState.eventos = obj.eventos || [];
            appState.gruposAtuais = [];
            salvarDados();
            atualizarSelectsContas();
            renderizarContas();
            renderizarHistorico();
            renderizarEventos();
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
        appState.eventos = [];
        salvarDados();
        atualizarSelectsContas();
        renderizarContas();
        renderizarHistorico();
        renderizarEventos();
        renderizarGruposTela();
        mostrarToast('Todos os dados foram apagados.', 'error');
    } else if(campoConfirmacao !== null) {
        mostrarToast('Ação cancelada. Palavra-chave incorreta.', 'info');
    }
}

// --- SISTEMA DE FARM DE EVENTOS ---
function parseListaSimples(texto) {
    return texto.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function parseLinhasChaveValor(texto) {
    return texto.split(/\r?\n/).map(item => {
        const partes = item.split(/[\|\/]/).map(p => p.trim());
        return { nome: partes[0] || '', valor: partes[1] || '' };
    }).filter(item => item.nome);
}

function parseQuests(texto) {
    return texto.split(/\r?\n/).map(item => {
        const partes = item.split(/[\|\/]/).map(p => p.trim());
        return {
            titulo: partes[0] || '',
            descricao: partes[1] || '',
            recompensa: partes[2] || ''
        };
    }).filter(item => item.titulo);
}

function renderizarMetadadosEvento(evento) {
    let html = '';

    if(evento.requisitos?.length) {
        html += `<div class="mb-3"><strong class="text-slate-700">Requisitos:</strong><ul class="list-disc pl-5 mt-2 text-sm text-slate-600">${evento.requisitos.map(item => `<li>${item}</li>`).join('')}</ul></div>`;
    }

    if(evento.quests?.length) {
        html += `<div class="mb-3"><strong class="text-slate-700">Quests:</strong><ul class="list-disc pl-5 mt-2 text-sm text-slate-600">${evento.quests.map(item => `<li><span class="font-semibold">${item.titulo}</span>${item.descricao ? `: ${item.descricao}` : ''}${item.recompensa ? ` — ${item.recompensa}` : ''}</li>`).join('')}</ul></div>`;
    }

    if(evento.loja?.length) {
        html += `<div class="mb-3"><strong class="text-slate-700">Loja do Evento:</strong><ul class="list-disc pl-5 mt-2 text-sm text-slate-600">${evento.loja.map(item => `<li>${item.nome}${item.custo ? ` — ${item.custo}` : ''}</li>`).join('')}</ul></div>`;
    }

    if(evento.itensFarmados?.length) {
        html += `<div class="mb-3"><strong class="text-slate-700">Itens Farmados:</strong><ul class="list-disc pl-5 mt-2 text-sm text-slate-600">${evento.itensFarmados.map(item => `<li>${item.nome}${item.quantidade ? ` x${item.quantidade}` : ''}</li>`).join('')}</ul></div>`;
    }

    return html;
}

function adicionarEvento() {
    const nome = document.getElementById('evento-nome').value.trim();
    const moeda = document.getElementById('evento-moeda').value.trim();
    const descricao = document.getElementById('evento-descricao').value.trim();
    const dataFim = document.getElementById('evento-data-fim').value;
    const requisitos = parseListaSimples(document.getElementById('evento-requisitos').value);
    const quests = parseQuests(document.getElementById('evento-quests').value);
    const loja = parseLinhasChaveValor(document.getElementById('evento-loja').value).map(item => ({ nome: item.nome, custo: parseInt(item.valor) || 0 }));
    const itensFarmados = parseLinhasChaveValor(document.getElementById('evento-itens').value).map(item => ({ nome: item.nome, quantidade: parseInt(item.valor) || 0 }));

    if(!nome) return mostrarToast('Digite o nome do evento.', 'error');
    if(!moeda) return mostrarToast('Digite o nome da moeda.', 'error');
    if(!dataFim) return mostrarToast('Selecione a data de término.', 'error');

    const evento = {
        id: Date.now().toString(),
        nome,
        moeda,
        descricao,
        dataFim,
        ativo: true,
        personagensEvento: {},
        requisitos,
        quests,
        loja,
        itensFarmados
    };

    appState.eventos.push(evento);
    
    document.getElementById('evento-nome').value = '';
    document.getElementById('evento-moeda').value = '';
    document.getElementById('evento-descricao').value = '';
    document.getElementById('evento-data-fim').value = '';
    document.getElementById('evento-requisitos').value = '';
    document.getElementById('evento-quests').value = '';
    document.getElementById('evento-loja').value = '';
    document.getElementById('evento-itens').value = '';

    salvarDados();
    renderizarEventos();
    mostrarToast(`Evento "${nome}" adicionado!`);
}

function removerEvento(eventoId) {
    const even = appState.eventos.find(e => e.id === eventoId);
    if(!even) return;

    mostrarToastConfirmacao(
        `Tem certeza que deseja remover o evento "${even.nome}"?`,
        () => {
            appState.eventos = appState.eventos.filter(e => e.id !== eventoId);
            salvarDados();
            renderizarEventos();
            mostrarToast(`Evento "${even.nome}" removido.`);
        },
        () => {
            mostrarToast('Remoção cancelada.', 'info');
        },
        'error'
    );
}

function carregarEventosExternos() {
    return fetch('eventos.json', { cache: 'reload' })
        .then(response => {
            if(!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(json => {
            eventosDisponiveis = json.eventos || [];
        })
        .catch(error => {
            console.warn('Não foi possível carregar eventos externos:', error);
            eventosDisponiveis = [];
        });
}

function renderizarEventos() {
    renderizarEventosExternos();
    renderizarEventoDetalhe();
}

function determinarEventoSelecionadoPadrao() {
    if(eventosDisponiveis.length === 0) {
        eventoSelecionadoId = null;
        return;
    }
    if(!eventoSelecionadoId || !eventosDisponiveis.some(e => e.id === eventoSelecionadoId)) {
        eventoSelecionadoId = eventosDisponiveis[0].id;
    }
}

function setEventoSelecionado(eventoId) {
    eventoSelecionadoId = eventoId;
    eventoDetalheAba = 'overview';
    renderizarEventos();
}

function getEventoRegistro(eventoId) {
    return appState.eventos.find(e => e.id === eventoId) || { personagensEvento: {} };
}

function getEventoMoeda(evento) {
    if(!evento) return '';
    if(evento.booster) return 'Moeda de Apoio';
    return evento.moeda || '';
}

function getEventoAtivo(eventoId) {
    const modelo = eventosDisponiveis.find(e => e.id === eventoId);
    if(!modelo) return null;
    const registro = getEventoRegistro(eventoId);
    return {
        ...modelo,
        personagensEvento: { ...registro.personagensEvento }
    };
}

function eventoUsaSaldoConta(evento) {
    return evento?.saldoPorConta === true;
}

function personagemElegivelParaEvento(personagem, evento) {
    if(!evento) return true;
    if(eventoUsaSaldoConta(evento)) {
        if(evento.id === 'gatchaman') {
            return personagem.level >= 100;
        }
    }
    if(evento.booster) return personagem.boosterEvento;
    return true;
}

function renderizarEventosExternos() {
    const container = document.getElementById('lista-eventos-externos');
    if(!container) return;

    if(eventosDisponiveis.length === 0) {
        container.innerHTML = `
            <div class="text-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
                <i class="fa-solid fa-file-import text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-500 font-medium">Nenhum evento disponível no arquivo.</p>
                <p class="text-xs text-slate-400 mt-1">Adicione eventos em <code>eventos.json</code> na raiz do projeto.</p>
            </div>`;
        return;
    }

    determinarEventoSelecionadoPadrao();

    container.innerHTML = eventosDisponiveis.map(evento => {
        const dataFim = new Date(evento.dataFim);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataFim - hoje) / (1000 * 60 * 60 * 24));
        const statusClass = diasRestantes <= 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
        const statusText = diasRestantes <= 0 ? 'Encerrado' : `${diasRestantes} dias restantes`;
        const statusColor = diasRestantes <= 0 ? 'text-red-600' : 'text-blue-600';
        const detalhes = [
            evento.requisitos?.length ? `${evento.requisitos.length} requisitos` : '',
            evento.quests?.length ? `${evento.quests.length} quests` : '',
            evento.loja?.length ? `${evento.loja.length} itens na loja` : '',
            evento.itensFarmados?.length ? `${evento.itensFarmados.length} itens farmados` : ''
        ].filter(Boolean).join(' · ');
        const selecionado = eventoSelecionadoId === evento.id ? 'ring-2 ring-indigo-400 border-indigo-300' : 'border-slate-200';

        return `
            <div onclick="setEventoSelecionado('${evento.id}')" class="cursor-pointer border p-4 rounded-lg shadow-sm transition-all ${statusClass} ${selecionado} hover:shadow-md hover:border-indigo-300">
                <div class="flex justify-between items-start gap-3">
                    <div class="flex-1">
                        <h3 class="text-base font-bold text-slate-800">${evento.nome}</h3>
                        <p class="text-xs text-slate-500 mt-1">${evento.descricao || 'Sem descrição'}</p>
                        ${detalhes ? `<p class="text-xs text-slate-500 mt-2">${detalhes}</p>` : ''}
                    </div>
                    <div class="text-right text-xs font-semibold ${statusColor}">${statusText}</div>
                </div>
                <div class="mt-4 text-sm text-slate-600 flex items-center justify-between">
                            <span><i class="fa-solid fa-coins text-yellow-500 mr-1"></i>${getEventoMoeda(evento)}</span>
                            <span class="text-slate-500">Clique para abrir</span>
                        </div>
            </div>`;
    }).join('');
}

function renderizarEventoDetalhe() {
    const container = document.getElementById('evento-detalhe-conteudo');
    const titulo = document.getElementById('evento-selecionado-title');
    const subtitle = document.getElementById('evento-selecionado-subtitle');
    const status = document.getElementById('evento-selecionado-status');

    if(!container || !titulo || !subtitle || !status) return;

    if(!eventoSelecionadoId) {
        titulo.textContent = 'Nenhum evento selecionado';
        subtitle.textContent = 'Carregue eventos do JSON para começar.';
        status.textContent = '';
        container.innerHTML = `
            <div class="text-center p-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
                <i class="fa-solid fa-calendar-xmark text-3xl mb-3"></i>
                Selecione um evento à esquerda para exibir os detalhes.
            </div>`;
        return;
    }

    const evento = getEventoAtivo(eventoSelecionadoId);
    if(!evento) {
        titulo.textContent = 'Evento não encontrado';
        subtitle.textContent = 'Verifique se o arquivo eventos.json contém o evento selecionado.';
        status.textContent = '';
        container.innerHTML = '';
        return;
    }

    const dataFim = evento.dataFim ? new Date(evento.dataFim) : null;
    const hoje = new Date();
    const diasRestantes = dataFim ? Math.ceil((dataFim - hoje) / (1000 * 60 * 60 * 24)) : null;
    const statusText = dataFim ? (diasRestantes <= 0 ? 'Evento encerrado' : `${diasRestantes} dias restantes`) : 'Data de término não informada';
    const statusClass = diasRestantes !== null && diasRestantes <= 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';

    titulo.textContent = evento.nome;
    subtitle.textContent = evento.descricao || 'Nenhuma descrição adicional disponível.';
    status.textContent = statusText;
    status.className = `rounded-full px-3 py-1 text-sm font-semibold ${statusClass}`;

    renderizarTabsEvento(evento);
    renderizarConteudoAbaEvento(evento);
}

function renderizarTabsEvento(evento) {
    const tabsContainer = document.getElementById('tabs-evento');
    if(!tabsContainer) return;

    const isBoosterEvento = !!evento.booster;
    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: 'fa-solid fa-eye' },
        { id: 'personagens', label: isBoosterEvento ? 'Booster' : 'Personagens', icon: isBoosterEvento ? 'fa-solid fa-bolt' : 'fa-solid fa-user-group' },
        ...(isBoosterEvento ? [{ id: 'caixas', label: 'Caixas', icon: 'fa-solid fa-box' }] : []),
        { id: 'farm', label: 'Registrar Farm', icon: 'fa-solid fa-hand-holding-dollar' },
        { id: 'quests', label: 'Quests', icon: 'fa-solid fa-scroll' },
        { id: 'loja', label: 'Loja', icon: 'fa-solid fa-store' }
    ];

    tabsContainer.innerHTML = tabs.map(tab => {
        const active = eventoDetalheAba === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
        return `
            <button onclick="mudarAbaDetalheEvento('${tab.id}')" class="${active} px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2">
                <i class="${tab.icon}"></i> ${tab.label}
            </button>`;
    }).join('');
}

function mudarAbaDetalheEvento(abaId) {
    eventoDetalheAba = abaId;
    renderizarEventoDetalhe();
}

function renderizarConteudoAbaEvento(evento) {
    const container = document.getElementById('evento-detalhe-conteudo');
    if(!container) return;

    const isBoosterEvento = !!evento.booster;
    const isContaSaldoEvento = eventoUsaSaldoConta(evento);
    const personagens = appState.contas.flatMap(conta => conta.personagens.map(p => ({ ...p, contaEmail: conta.email }))).filter(p => personagemElegivelParaEvento(p, evento));
    const totalRegistrado = Object.values(evento.personagensEvento || {}).reduce((acc, qtd) => acc + qtd, 0);
    const totalBoosters = isBoosterEvento ? personagens.length : 0;
    const contasBoosters = isBoosterEvento ? [...new Set(personagens.map(p => p.contaEmail))].length : 0;

    const detalheBasico = `
        <div class="grid grid-cols-1 md:grid-cols-${isBoosterEvento ? '3' : '2'} gap-4">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p class="text-sm text-slate-500 font-semibold mb-2">Moeda do Evento</p>
                <p class="text-lg font-bold text-slate-800"><i class="fa-solid fa-coins text-yellow-500 mr-2"></i>${getEventoMoeda(evento)}</p>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p class="text-sm text-slate-500 font-semibold mb-2">Total Registrado</p>
                <p class="text-lg font-bold text-slate-800">${totalRegistrado}</p>
            </div>
            ${isBoosterEvento ? `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p class="text-sm text-slate-500 font-semibold mb-2">Boosters do Evento</p>
                <p class="text-lg font-bold text-slate-800">${totalBoosters} personagem${totalBoosters === 1 ? '' : 's'} em ${contasBoosters} conta${contasBoosters === 1 ? '' : 's'}</p>
            </div>` : ''}
        </div>`;

    const detalhesMetadados = renderizarMetadadosEvento(evento);

    if(eventoDetalheAba === 'overview') {
        container.innerHTML = `
            ${detalheBasico}
            <div class="bg-white p-4 rounded-xl border border-slate-200">
                <h3 class="font-bold text-slate-800 mb-3">Descrição e Detalhes</h3>
                <p class="text-sm text-slate-600 mb-4">${evento.descricao || 'Sem descrição disponível.'}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Término</p>
                        <p class="text-sm text-slate-700">${evento.dataFim || 'Não definido'}</p>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Status</p>
                        <p class="text-sm text-slate-700">${evento.dataFim ? (new Date(evento.dataFim) < new Date() ? 'Encerrado' : 'Ativo') : 'Sem data'}</p>
                    </div>
                </div>
            </div>
            ${detalhesMetadados}
        `;
        return;
    }

    if(eventoDetalheAba === 'personagens') {
        if(personagens.length === 0) {
            const emptyMessage = isBoosterEvento
                ? 'Nenhum personagem do evento booster foi cadastrado. Marque um personagem como Booster ao criar ou editar para vê-lo aqui.'
                : 'Nenhum personagem cadastrado. Adicione personagens às contas para vê-los aqui.';
            container.innerHTML = `<div class="text-center p-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">${emptyMessage}</div>`;
            return;
        }

        const cards = personagens.map(personagem => {
            const registrado = evento.personagensEvento[personagem.id] || 0;
            return `
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h4 class="font-bold text-slate-800">${personagem.nome}</h4>
                            <p class="text-xs text-slate-500">${personagem.classe} — Nv ${personagem.level}</p>
                            <p class="text-xs text-slate-500">Conta: ${personagem.contaEmail}</p>
                        </div>
                        <span class="text-xs font-semibold ${registrado ? 'text-indigo-700' : 'text-slate-500'}">${registrado} ${getEventoMoeda(evento)}</span>
                    </div>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-3">
                        <input id="evento-char-qty-${personagem.id}" type="number" min="1" value="1" class="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Quantidade" />
                        <button onclick="registrarFarmRapido('${evento.id}', '${personagem.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-sm font-semibold">Registrar</button>
                    </div>
                </div>`;
        }).join('');

        const infoHeading = isBoosterEvento ? 'Booster do Evento' : 'Personagens do Evento';
        const infoText = isBoosterEvento
            ? 'Todos os personagens marcados como Booster aparecem aqui. Use os botões para registrar o farm direto no evento.'
            : 'Todos os personagens cadastrados aparecem aqui. Nenhuma filtragem por Booster é aplicada neste evento.';

        container.innerHTML = `
            ${detalheBasico}
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p class="text-sm text-slate-500 font-semibold mb-2">${infoHeading}</p>
                <p class="text-sm text-slate-600 mb-3">${infoText}</p>
            </div>
            <div class="grid grid-cols-1 gap-4">${cards}</div>
        `;
        return;
    }

    if(eventoDetalheAba === 'farm') {
        if(personagens.length === 0) {
            const emptyMessage = isBoosterEvento
                ? 'Nenhum personagem do evento booster foi cadastrado. Marque um personagem como Booster ao criar ou editar para registrar farm aqui.'
                : 'Nenhum personagem cadastrado. Adicione personagens às contas para registrar farm neste evento.';
            container.innerHTML = `
                ${detalheBasico}
                <div class="text-center p-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
                    ${emptyMessage}
                </div>
            `;
            return;
        }

        const currentSelectedAccount = (window._lojaSelected && window._lojaSelected[evento.id]) || document.getElementById(`farm-account-${evento.id}`)?.value || '';
        const selectOpcoes = appState.contas.map(conta => {
            const eligibleCount = conta.personagens.filter(p => personagemElegivelParaEvento(p, evento)).length;
            return `<option value="${conta.email}"${currentSelectedAccount === conta.email ? ' selected' : ''}>${conta.email} (${eligibleCount} personagem${eligibleCount === 1 ? '' : 's'})</option>`;
        }).join('');

        const selectedAccount = appState.contas.find(c => c.email === currentSelectedAccount);
        const accountCharsHtml = selectedAccount
            ? selectedAccount.personagens.filter(p => personagemElegivelParaEvento(p, evento)).map(p => `<div class="text-sm text-slate-600">• ${p.nome} (${p.classe}) Nv ${p.level}</div>`).join('')
            : '<div class="text-sm text-slate-500">Selecione uma conta para ver os personagens elegíveis.</div>';

        // Lista de quests com checkbox e campo para moedas vindas da caixa
        const questsListHtml = (evento.quests || []).map((q, idx) => {
            const localTags = q.localizacoes ? q.localizacoes.map(loc => `
                        <button type="button" onclick="copiarParaClipboard('${loc.nav}', 'Comando /nav copiado')" class="mt-2 inline-flex items-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold hover:bg-slate-200 transition-all">${loc.label}</button>
                    `).join('') : '';
            return `
                <label class="flex items-start gap-3 bg-white p-3 rounded border border-slate-200">
                    <input type="checkbox" id="quest-${evento.id}-${idx}" data-recompensa="${(q.recompensa||'').replace(/"/g,'')}">
                    <div>
                        <div class="font-medium text-slate-800">${q.titulo}</div>
                        <div class="text-xs text-slate-500">${q.descricao || ''} <span class="font-semibold text-indigo-600">${q.recompensa || ''}</span>
                            <div class="flex flex-wrap gap-2 mt-2">${localTags}</div>
                        </div>
                    </div>
                </label>`;
        }).join('');

        container.innerHTML = `
            ${detalheBasico}
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Selecionar Conta</label>
                <select id="farm-account-${evento.id}" onchange="(window._lojaSelected=window._lojaSelected||{}),(window._lojaSelected['${evento.id}']=this.value),renderizarEventoDetalhe()" class="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-4">
                    <option value="">Selecione uma conta...</option>
                    ${selectOpcoes}
                </select>
                <div class="mb-3 p-3 rounded-xl bg-white border border-slate-200">
                    <div class="text-sm font-semibold text-slate-700 mb-2">Personagens elegíveis desta conta</div>
                    <div class="space-y-1">${accountCharsHtml}</div>
                </div>

                <div class="mb-3">
                    <p class="text-sm font-semibold text-slate-700 mb-2">Quests realizadas (marque as que a conta completou)</p>
                    <div class="grid gap-2">${questsListHtml}</div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 mb-4 items-end">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Moedas recebidas da Caixa de Apoio</label>
                        <input id="caixa-coins-${evento.id}" type="number" min="0" value="0" class="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                    </div>
                    <button onclick="registrarFarmRapido('${evento.id}')" class="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-sm font-semibold">Adicionar ao evento</button>
                </div>

                <p class="text-xs text-slate-500">Marque as quests concluídas e/ou informe as moedas recebidas ao abrir a caixa. O total será somado à conta selecionada.</p>
            </div>
        `;
        return;
    }

    if(eventoDetalheAba === 'caixas') {
        if(!evento.caixas?.length) {
            container.innerHTML = `${detalheBasico}<div class="text-center p-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">Nenhuma caixa evolutiva cadastrada para este evento.</div>`;
            return;
        }

        const caixasHtml = evento.caixas.map(caixa => {
            const rewards = caixa.recompensas && caixa.recompensas.length ? `<ul class="list-disc pl-5 mt-2 text-sm text-slate-600">${caixa.recompensas.map(r => `<li>${r}</li>`).join('')}</ul>` : '<p class="text-sm text-slate-600 mt-2">Recompensas não listadas.</p>';
            return `
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 class="font-bold text-slate-800">Nv ${caixa.nivel} — ${caixa.nome}</h4>
                    ${rewards}
                </div>`;
        }).join('');

        container.innerHTML = `${detalheBasico}<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">${caixasHtml}</div>`;
        return;
    }

    if(eventoDetalheAba === 'quests') {
        if(!evento.quests?.length) {
            container.innerHTML = `<div class="text-center p-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">Nenhuma quest cadastrada para este evento.</div>`;
            return;
        }

        const questsHtml = evento.quests.map(quest => `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 class="font-bold text-slate-800">${quest.titulo}</h4>
                <p class="text-sm text-slate-600 mt-2">${quest.descricao || 'Sem descrição'}</p>
                ${quest.localizacoes ? `<div class="mt-3 text-xs text-slate-500 font-semibold">Locais possíveis:</div><div class="flex flex-wrap gap-2 mt-2">${quest.localizacoes.map(loc => `<button type="button" onclick="copiarParaClipboard('${loc.nav}', 'Comando /nav copiado')" class="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 px-2 py-1 text-[11px] font-semibold hover:bg-slate-200 transition-all">${loc.label}</button>`).join('')}</div>` : ''}
                <p class="text-sm text-indigo-600 font-semibold mt-3">Recompensa: ${quest.recompensa || 'Não informada'}</p>
            </div>
        `).join('');

        container.innerHTML = `${detalheBasico}<div class="grid grid-cols-1 gap-4">${questsHtml}</div>`;
        return;
    }

    if(eventoDetalheAba === 'loja') {
        if(!evento.loja?.length) {
            container.innerHTML = `<div class="text-center p-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">Nenhum item de loja disponível para este evento.</div>`;
            return;
        }
        const isContaSaldoEvento = eventoUsaSaldoConta(evento);
        const currentSelectedLoja = (window._lojaSelected && window._lojaSelected[evento.id]) || (isContaSaldoEvento ? document.getElementById(`loja-account-${evento.id}`)?.value : document.getElementById(`loja-char-${evento.id}`)?.value) || '';
        const selectOpcoes = isContaSaldoEvento
            ? appState.contas.map(conta => {
                const eligibleCount = conta.personagens.filter(p => personagemElegivelParaEvento(p, evento)).length;
                return `<option value="${conta.email}"${currentSelectedLoja === conta.email ? ' selected' : ''}>${conta.email} (${eligibleCount} personagem${eligibleCount === 1 ? '' : 's'})</option>`;
            }).join('')
            : personagens.map(personagem => `<option value="${personagem.id}"${currentSelectedLoja === personagem.id ? ' selected' : ''}>${personagem.nome} (${personagem.classe})</option>`).join('');

        const filterValue = (document.getElementById(`loja-filter-${evento.id}`)?.value || '').toLowerCase();
        const categoriaFiltro = (document.getElementById(`loja-categoria-${evento.id}`)?.value || '');
        const subcategoriaFiltro = (document.getElementById(`loja-subcat-${evento.id}`)?.value || '');
        const categoriasDisponiveis = Array.from(new Set(evento.loja.map(item => (item.categoria || '').toString()).filter(Boolean))).sort();
        const subcategoriasDisponiveis = Array.from(new Set(evento.loja.map(item => (item.subcategoria || '').toString()).filter(Boolean))).sort();
        const categoriaOptions = categoriasDisponiveis.map(cat => `<option value="${cat}"${categoriaFiltro === cat ? ' selected' : ''}>${cat}</option>`).join('');
        const subcategoriaOptions = subcategoriasDisponiveis.map(sub => `<option value="${sub}"${subcategoriaFiltro === sub ? ' selected' : ''}>${sub}</option>`).join('');
        const filtrosAtivos = [];
        if(filterValue) filtrosAtivos.push(`Busca: "${filterValue}"`);
        if(categoriaFiltro) filtrosAtivos.push(`Categoria: ${categoriaFiltro}`);
        if(subcategoriaFiltro) filtrosAtivos.push(`Subcategoria: ${subcategoriaFiltro}`);
        const filtrosAtivosHtml = filtrosAtivos.length ? `<div class="text-xs text-slate-500 mt-2">Filtrando por: ${filtrosAtivos.join(' · ')}</div>` : '';

        const filterInput = `<div class="mb-3 flex flex-col gap-2">
            <div class="flex gap-2 items-center">
                <input id="loja-filter-${evento.id}" oninput="renderizarEventoDetalhe()" placeholder="Filtrar por nome, NPC ou texto..." class="flex-1 p-2 border border-slate-300 rounded text-sm bg-slate-50" />
                <select id="loja-categoria-${evento.id}" onchange="renderizarEventoDetalhe()" class="p-2 border border-slate-300 rounded text-sm bg-white">
                    <option value="">Todas categorias</option>
                    ${categoriaOptions}
                    <option value="Outros">Outros</option>
                </select>
                <select id="loja-subcat-${evento.id}" onchange="renderizarEventoDetalhe()" class="p-2 border border-slate-300 rounded text-sm bg-slate-50">
                    <option value="">Todas subcategorias</option>
                    ${subcategoriaOptions}
                </select>
            </div>
            
            ${filtrosAtivosHtml}
        </div>`;

        // Select de personagem (usado para compras) — mantém sincronização com window._lojaSelected
        const selectHtml = isContaSaldoEvento ? `
            <div class="mb-3">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Selecionar Conta</label>
                <select id="loja-account-${evento.id}" onchange="(window._lojaSelected=window._lojaSelected||{}),(window._lojaSelected['${evento.id}']=this.value),renderizarEventoDetalhe()" class="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                    <option value=''>Selecione uma conta...</option>
                    ${selectOpcoes}
                </select>
            </div>` : `
            <div class="mb-3">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Selecionar Personagem</label>
                <select id="loja-char-${evento.id}" onchange="(window._lojaSelected=window._lojaSelected||{}),(window._lojaSelected['${evento.id}']=this.value),renderizarEventoDetalhe()" class="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                    <option value=''>Selecione um personagem...</option>
                    ${selectOpcoes}
                </select>
            </div>`;

        // Render no estilo da loja dos Desbravadores (cards em grid)
        const selectedTarget = currentSelectedLoja || '';
        // buscar registro local do evento para saldo por personagem/conta
        const registroLocal = appState.eventos.find(e => e.id === evento.id) || { personagensEvento: {} };

        // Card do personagem ou conta selecionada (exibido acima dos filtros)
        let selectedCardHtml = '';
        if(isContaSaldoEvento) {
            const selectedConta = appState.contas.find(c => c.email === selectedTarget);
            const saldoConta = selectedTarget ? (registroLocal.personagensEvento[selectedTarget] || 0) : 0;
            if(selectedConta) {
                const eligibleChars = selectedConta.personagens.filter(p => personagemElegivelParaEvento(p, evento));
                const eligibleHtml = eligibleChars.length > 0
                    ? eligibleChars.map(p => `<div class="text-sm text-slate-600">• ${p.nome} (${p.classe}) Nv ${p.level}</div>`).join('')
                    : `<div class="text-sm text-slate-500">Nenhum personagem elegível nesta conta.</div>`;
                selectedCardHtml = `
                <div class="mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between gap-4 mb-3">
                        <div>
                            <div class="font-bold text-slate-800">Conta: ${selectedConta.email}</div>
                            <div class="text-sm text-slate-500">Saldo disponível: <span class="font-semibold text-indigo-600">${saldoConta} ${getEventoMoeda(evento)}</span></div>
                        </div>
                        <button onclick="(window._lojaSelected=window._lojaSelected||{}),(window._lojaSelected['${evento.id}']=''),renderizarEventoDetalhe()" class="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm">Limpar</button>
                    </div>
                    <div class="space-y-1">
                        <div class="text-sm font-semibold text-slate-700 mb-2">Personagens elegíveis</div>
                        ${eligibleHtml}
                    </div>
                </div>`;
            }
        } else {
            const selectedCharObj = selectedTarget ? encontrarPersonagem(selectedTarget) : null;
            if(selectedCharObj) {
                const gen = selectedCharObj.genero || 'M';
                const spriteCandidates = gerarCandidatosImagemClasse(selectedCharObj.classe, gen);
                const spriteFirst = spriteCandidates[0] || obterImagemClasse(selectedCharObj.classe, gen);
                const fallbackLarge = obterFallbackImagemClasse(selectedCharObj.classe, gen);
                selectedCardHtml = `
                <div class="mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div class="w-20 h-20 flex items-center justify-center bg-transparent">
                        <img src="${spriteFirst}" data-fallback="${fallbackLarge}" class="max-w-full max-h-full object-contain bg-transparent drop-shadow-md" onerror="handleImgError(this)">
                    </div>
                    <div class="flex-1">
                        <div class="font-bold text-slate-800">${selectedCharObj.nome}</div>
                        <div class="text-sm text-slate-500">${selectedCharObj.classe}</div>
                        <div class="text-sm mt-1">Saldo: <span class="font-bold text-indigo-600">${registroLocal.personagensEvento[selectedTarget] || 0} ${getEventoMoeda(evento)}</span></div>
                    </div>
                    <div class="flex flex-col gap-2 items-end">
                        <button onclick="(window._lojaSelected=window._lojaSelected||{}),(window._lojaSelected['${evento.id}']=''),renderizarEventoDetalhe()" class="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm">Limpar</button>
                    </div>
                </div>`;
            }
        }

        const filteredItems = evento.loja.map((item, idx) => {
            const nome = item.nome || '';
            const npc = item.npc ? `${item.npc.nome} — ${item.npc.local}` : '';
            const matches = (!filterValue || nome.toLowerCase().includes(filterValue) || npc.toLowerCase().includes(filterValue));
            // categoria: se selecionada, exige que item.categoria coincida (item sem categoria só aparece em "Todas categorias" ou "Outros" quando apropriado)
            let categoriaOK = true;
            const itemCategoria = (item.categoria || '').toString();
            if(categoriaFiltro) {
                if(categoriaFiltro === 'Outros') {
                    categoriaOK = !itemCategoria; // itens sem categoria explícita
                } else {
                    categoriaOK = itemCategoria && itemCategoria.toLowerCase() === categoriaFiltro.toLowerCase();
                }
            }
            // subcategoria filter (aplicável principalmente para Equipamentos)
            let subcatOK = true;
            const itemSubcat = (item.subcategoria || '').toString();
            if(subcategoriaFiltro) {
                subcatOK = itemSubcat && itemSubcat.toLowerCase() === subcategoriaFiltro.toLowerCase();
            }
            if(!matches || !categoriaOK) return '';
            if(!subcatOK) return '';

            // calcular custo efetivo em moedas: suporta custo direto (item.custo) ou custo por ticket (item.ticket + item.ticketQtd)
            let effectiveCoinCost = 0;
            let costLabel = '';
            if(item.ticket) {
                const ticketName = item.ticket;
                const ticketQty = item.ticketQtd || 1;
                const ticketEntry = evento.loja.find(it => it.nome === ticketName) || itensLoja.find(it => it.nome === ticketName);
                const ticketValue = ticketEntry ? (ticketEntry.custo || 0) : 0;
                effectiveCoinCost = ticketValue * ticketQty;
                costLabel = `${ticketQty} ${ticketName} (equiv. ${effectiveCoinCost} ${getEventoMoeda(evento)})`;
            } else {
                effectiveCoinCost = item.custo || 0;
                costLabel = `${effectiveCoinCost} ${getEventoMoeda(evento)}`;
            }
            if(item.slot) costLabel += ` — ${item.slot}`;

            const saldoTarget = selectedTarget ? (registroLocal.personagensEvento[selectedTarget] || 0) : 0;
            const qtdPossivel = effectiveCoinCost > 0 ? Math.floor(saldoTarget / effectiveCoinCost) : 0;
            const podeComprar = selectedTarget && qtdPossivel > 0;
            const corBorda = podeComprar ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 cursor-pointer shadow-sm hover:shadow-md transition-all' : 'border-slate-200 bg-slate-100 opacity-95';

            // class-specific visibility: if item.classes defined, require selected character or selected account to have a matching classe
            if(item.classes && item.classes.length > 0) {
                if(!selectedTarget) return '';
                const hasMatchingChar = isContaSaldoEvento
                    ? (appState.contas.find(c => c.email === selectedTarget)?.personagens || []).some(p => item.classes.includes(p.classe))
                    : (() => {
                        const selectedChar = encontrarPersonagem(selectedTarget);
                        return selectedChar ? item.classes.includes(selectedChar.classe || '') : false;
                    })();
                if(!hasMatchingChar) return '';
            }

            return `
                <div class="border-2 ${corBorda} p-4 mt-2 rounded-xl text-center flex flex-col justify-between relative group">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-slate-200 text-slate-700 border border-white whitespace-nowrap">
                        ${npc ? `<button type="button" onclick="copiarParaClipboard('${item.npc.nav || ''}', 'Comando /nav copiado')" class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 ${item.npc.nav ? 'cursor-pointer' : ''}"><i class="fa-solid fa-user-tie"></i> ${item.npc.nome}</button>` : 'Evento'}
                    </div>
                    <div class="mb-3 mt-2">
                        <span class="block text-sm font-bold text-slate-700">${nome}</span>
                        <span class="block text-xs font-medium text-slate-500 mt-1 bg-white inline-block px-2 py-0.5 rounded border border-slate-200">Custo: ${costLabel}</span>
                        ${npc ? `<div class="text-xs text-slate-500 mt-2">Vendedor: ${npc}</div>` : ''}
                    </div>
                    <div class="mt-auto">
                        ${podeComprar ? 
                            `<button onclick="comprarItem('${evento.id}', ${idx})" class="w-full bg-green-500 group-hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded shadow transition-colors flex items-center justify-center gap-2"><i class="fa-solid fa-bag-shopping"></i> Comprar</button>`
                            :
                            `<div class="w-full bg-slate-300 text-slate-500 text-sm font-bold py-2 px-3 rounded flex items-center justify-center gap-2"><i class="fa-solid fa-lock"></i> ${selectedTarget ? 'Saldo insuficiente' : (isContaSaldoEvento ? 'Selecione uma conta' : 'Selecione um personagem')}</div>`
                        }
                        <div class="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Limite: ${selectedTarget ? qtdPossivel : 0} un.</div>
                    </div>
                </div>`;
        });
        const lojaCards = filteredItems.filter(Boolean).join('');
        const itensExibidos = filteredItems.filter(Boolean).length;

        // saldo moved/removed from filters; selection preserved via window._lojaSelected

        const resultadoFiltro = `<div class="text-sm text-slate-500 mt-2">Exibindo <span class="font-bold text-slate-700">${itensExibidos}</span> item${itensExibidos === 1 ? '' : 's'}.</div>`;
        container.innerHTML = `${detalheBasico}${selectHtml}${selectedCardHtml}${filterInput}${resultadoFiltro}<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">${lojaCards || '<div class="col-span-full p-6 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">Nenhum item corresponde ao filtro.</div>'}</div>`;
        return;
        return;
    }
}

function renderizarEventosLocais() {
    const container = document.getElementById('lista-eventos');
    if(!container) return;

    if(appState.eventos.length === 0) {
        container.innerHTML = `
            <div class="text-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
                <i class="fa-solid fa-calendar-xmark text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-500 font-medium">Nenhum evento cadastrado.</p>
                <p class="text-xs text-slate-400 mt-1">Adicione um evento local acima ou carregue um evento do JSON.</p>
            </div>`;
        return;
    }

    container.innerHTML = appState.eventos.map(evento => {
        const dataFim = new Date(evento.dataFim);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataFim - hoje) / (1000 * 60 * 60 * 24));
        const statusClass = diasRestantes <= 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
        const statusText = diasRestantes <= 0 ? 'Encerrado' : `${diasRestantes} dias restantes`;
        const statusColor = diasRestantes <= 0 ? 'text-red-600' : 'text-blue-600';
        const detalhes = [
            evento.requisitos?.length ? `${evento.requisitos.length} requisitos` : '',
            evento.quests?.length ? `${evento.quests.length} quests` : '',
            evento.loja?.length ? `${evento.loja.length} itens na loja` : '',
            evento.itensFarmados?.length ? `${evento.itensFarmados.length} itens farmados` : ''
        ].filter(Boolean).join(' · ');

        // Não somar transferível — tratar saldos por personagem
        let totalMoedas = 0;
        Object.values(evento.personagensEvento).forEach(qty => totalMoedas += qty);
        const personagensComSaldo = Object.entries(evento.personagensEvento || {}).filter(([id,q]) => q > 0).length;

        let pessoasHtml = '';
        for(const [key, qtd] of Object.entries(evento.personagensEvento)) {
            if(evento.saldoPorConta) {
                const conta = appState.contas.find(c => c.email === key);
                if(conta) {
                    pessoasHtml += `
                        <div class="flex justify-between items-center bg-slate-100 p-2 rounded text-sm">
                            <span class="font-medium">Conta: ${conta.email}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-indigo-600 font-bold">${qtd}</span>
                                <button onclick="ajustarFarmEvento('${evento.id}', '${key}', -1)" class="text-red-600 hover:text-red-700 font-bold text-lg leading-none">−</button>
                                <button onclick="ajustarFarmEvento('${evento.id}', '${key}', 1)" class="text-green-600 hover:text-green-700 font-bold text-lg leading-none">+</button>
                                <button onclick="removerFarmEvento('${evento.id}', '${key}')" class="text-slate-400 hover:text-red-600" title="Remover"><i class="fa-solid fa-trash text-xs"></i></button>
                            </div>
                        </div>`;
                }
            } else {
                const char = encontrarPersonagem(key);
                if(char) {
                    pessoasHtml += `
                        <div class="flex justify-between items-center bg-slate-100 p-2 rounded text-sm">
                            <span class="font-medium">${char.nome}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-indigo-600 font-bold">${qtd}</span>
                                <button onclick="ajustarFarmEvento('${evento.id}', '${key}', -1)" class="text-red-600 hover:text-red-700 font-bold text-lg leading-none">−</button>
                                <button onclick="ajustarFarmEvento('${evento.id}', '${key}', 1)" class="text-green-600 hover:text-green-700 font-bold text-lg leading-none">+</button>
                                <button onclick="removerFarmEvento('${evento.id}', '${key}')" class="text-slate-400 hover:text-red-600" title="Remover"><i class="fa-solid fa-trash text-xs"></i></button>
                            </div>
                        </div>`;
                }
            }
        }

        if(!pessoasHtml) {
            pessoasHtml = '<p class="text-xs text-slate-500 p-2">Nenhum personagem registrado ainda.</p>';
        }

        return `
            <div class="bg-white border-l-4 border-indigo-500 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${statusClass}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-800">${evento.nome}</h3>
                        <p class="text-xs text-slate-500 mt-1">
                            <i class="fa-solid fa-coins text-yellow-500 mr-1"></i> ${evento.moeda}
                        </p>
                        ${evento.descricao ? `<p class="text-sm text-slate-500 mt-1">${evento.descricao}</p>` : ''}
                        ${detalhes ? `<p class="text-xs text-slate-500 mt-2">${detalhes}</p>` : ''}
                    </div>
                    <button onclick="removerEvento('${evento.id}')" class="text-slate-400 hover:text-red-600 transition-colors" title="Remover evento">
                        <i class="fa-solid fa-trash text-lg"></i>
                    </button>
                </div>

                ${renderizarMetadadosEvento(evento)}

                <div class="mb-3 flex items-center justify-between">
                    <span class="text-sm ${statusColor} font-medium"><i class="fa-solid fa-calendar-days mr-1"></i>${statusText}</span>
                    <span class="text-sm font-bold text-indigo-600"><i class="fa-solid fa-coins mr-1"></i>Personagens com saldo: ${personagensComSaldo}</span>
                </div>

                <div class="mb-3 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div class="bg-indigo-600 h-full" style="width: 0%"></div>
                </div>

                <div class="space-y-1 mb-3 text-sm">
                    ${pessoasHtml}
                </div>

                <div class="pt-2 border-t border-slate-200">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Registrar Farm Rápido</label>
                    <div class="flex gap-2">
                        <select id="char-select-${evento.id}" class="flex-1 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">Selecione um personagem...</option>
                            ${appState.contas.flatMap(conta => conta.personagens.map(char => 
                                `<option value="${char.id}">${char.nome} (${char.classe})</option>`
                            )).join('')}
                        </select>
                        <input type="number" id="qty-input-${evento.id}" value="1" min="1" class="w-16 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center">
                        <button onclick="registrarFarmRapido('${evento.id}')" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function encontrarPersonagem(charId) {
    for(const conta of appState.contas) {
        const char = conta.personagens.find(p => p.id === charId);
        if(char) return char;
    }
    return null;
}

function registrarFarmRapido(eventoId, charId = null) {
    const eventoModelo = getEventoAtivo(eventoId);
    if(!eventoModelo) return mostrarToast('Evento não encontrado.', 'error');

    const isContaSaldoEvento = eventoUsaSaldoConta(eventoModelo);
    let registroId = charId;

    if(!registroId) {
        const selectId = isContaSaldoEvento ? `farm-account-${eventoId}` : `char-select-${eventoId}`;
        const select = document.getElementById(selectId);
        if(select) registroId = select.value;

        if(!registroId) return mostrarToast(isContaSaldoEvento ? 'Selecione uma conta.' : 'Selecione um personagem.', 'error');

        // Sum coins from selected quests
        let totalFromQuests = 0;
        (eventoModelo.quests || []).forEach((q, idx) => {
            const checkbox = document.getElementById(`quest-${eventoId}-${idx}`);
            if(checkbox && checkbox.checked) {
                totalFromQuests += parseReward(checkbox.getAttribute('data-recompensa'));
            }
        });

        // Coins explicitly received from caixa
        const caixaInput = document.getElementById(`caixa-coins-${eventoId}`);
        const caixaCoins = caixaInput ? parseInt(caixaInput.value) || 0 : 0;

        var qtd = caixaCoins + totalFromQuests;
        if(qtd <= 0) return mostrarToast('Nenhuma moeda selecionada para adicionar.', 'error');
    } else {
        // existing quick-register path (from character card)
        const qtdInput = document.getElementById(`qty-input-${evento.id}`);
        var qtd = qtdInput ? parseInt(qtdInput.value) || 1 : 1;
    }

    let registro = appState.eventos.find(e => e.id === eventoId);
    if(!registro) {
        registro = {
            id: eventoId,
            personagensEvento: {}
        };
        appState.eventos.push(registro);
    }

    if(!registro.personagensEvento) {
        registro.personagensEvento = {};
    }

    if(!registro.personagensEvento[registroId]) {
        registro.personagensEvento[registroId] = 0;
    }
    registro.personagensEvento[registroId] += qtd;

    salvarDados();
    // registrar no histórico da conta ou do personagem
    let contaEmail = null;
    if(isContaSaldoEvento) {
        contaEmail = registroId;
    } else {
        for(const c of appState.contas) {
            if(c.personagens.some(p => p.id === registroId)) { contaEmail = c.email; break; }
        }
    }
    if(contaEmail) registrarNoHistorico(contaEmail, `Recebido no evento: ${eventoModelo.nome} (+${qtd} ${getEventoMoeda(eventoModelo)})`, qtd);
    renderizarEventos();
    mostrarToast(`+${qtd} ${getEventoMoeda(eventoModelo)} registradas!`);
}

function ajustarFarmEvento(eventoId, charId, delta) {
    const evento = appState.eventos.find(e => e.id === eventoId);
    if(!evento) return;

    if(!evento.personagensEvento[charId]) {
        evento.personagensEvento[charId] = 0;
    }

    evento.personagensEvento[charId] += delta;

    if(evento.personagensEvento[charId] <= 0) {
        delete evento.personagensEvento[charId];
    }

    salvarDados();
    renderizarEventos();
}

function comprarItem(eventoId, itemIndex) {
    const eventoModelo = getEventoAtivo(eventoId);
    if(!eventoModelo) return mostrarToast('Evento não encontrado.', 'error');

    const isContaSaldoEvento = eventoUsaSaldoConta(eventoModelo);
    const selectId = isContaSaldoEvento ? `loja-account-${eventoId}` : `loja-char-${eventoId}`;
    const select = document.getElementById(selectId);
    const selectedId = select ? select.value : null;
    if(!selectedId) return mostrarToast(isContaSaldoEvento ? 'Selecione uma conta para comprar.' : 'Selecione um personagem para comprar.', 'error');

    const item = eventoModelo.loja && eventoModelo.loja[itemIndex];
    if(!item) return mostrarToast('Item não encontrado.', 'error');

    // determina custo efetivo em moedas (suporta tickets)
    let custo = 0;
    if(item.ticket) {
        const ticketName = item.ticket;
        const ticketQty = item.ticketQtd || 1;
        const ticketEntry = eventoModelo.loja && eventoModelo.loja.find(it => it.nome === ticketName) || itensLoja.find(it => it.nome === ticketName);
        const ticketValue = ticketEntry ? (ticketEntry.custo || 0) : 0;
        custo = ticketValue * ticketQty;
    } else {
        custo = item.custo || 0;
    }

    // localizar registro de evento local (moedas por personagem ou conta)
    let registro = appState.eventos.find(e => e.id === eventoId);
    if(!registro) {
        return mostrarToast(isContaSaldoEvento ? 'Esta conta não possui moedas registradas para este evento.' : 'Este personagem não possui moedas registradas para este evento.', 'error');
    }
    if(!registro.personagensEvento) registro.personagensEvento = {};
    const saldo = registro.personagensEvento[selectedId] || 0;
    if(saldo < custo) return mostrarToast('Saldo insuficiente para comprar este item.', 'error');

    mostrarToastConfirmacao(
        `Confirmar compra de "${item.nome}" por ${custo} ${getEventoMoeda(eventoModelo)} para ${isContaSaldoEvento ? 'a conta selecionada' : 'o personagem selecionado'}?`,
        () => {
            registro.personagensEvento[selectedId] = saldo - custo;
            if(registro.personagensEvento[selectedId] <= 0) delete registro.personagensEvento[selectedId];

            // registrar no histórico da conta ou do personagem
            let contaEmail = null;
            let registroNome = '';
            if(isContaSaldoEvento) {
                contaEmail = selectedId;
                registroNome = selectedId;
            } else {
                for(const c of appState.contas) {
                    const encontrado = c.personagens.find(p => p.id === selectedId);
                    if(encontrado) { contaEmail = c.email; registroNome = encontrado.nome; break; }
                }
            }
            if(contaEmail) registrarNoHistorico(contaEmail, `Compra na loja do evento: ${item.nome} (${eventoModelo.nome}) — ${registroNome}`, -custo);

            salvarDados();
            renderizarEventoDetalhe();
            renderizarEventos();
            mostrarToast(`Compra realizada: ${item.nome} (-${custo} ${getEventoMoeda(eventoModelo)})`);
        },
        () => {
            mostrarToast('Compra cancelada.', 'info');
        },
        'info'
    );
}

function parseReward(recompensaStr) {
    if(!recompensaStr) return 0;
    // tenta extrair o primeiro inteiro presente na string
    const m = recompensaStr.match(/(\d+)/);
    if(m) return parseInt(m[1], 10);
    return 0;
}

function removerFarmEvento(eventoId, charId) {
    const evento = appState.eventos.find(e => e.id === eventoId);
    if(evento && evento.personagensEvento[charId]) {
        delete evento.personagensEvento[charId];
        salvarDados();
        renderizarEventos();
        mostrarToast('Registro removido.');
    }
}
