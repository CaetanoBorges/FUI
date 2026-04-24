const CHAVE_USUARIOS = 'gyro.auth.users';
const CHAVE_SESSAO = 'gyro.auth.current';

const PERFIL_PADRAO = 'passageiro';

function lerJson(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor ? JSON.parse(valor) : padrao;
    } catch {
        return padrao;
    }
}

function escreverJson(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

function normalizarEmail(email = '') {
    return email.trim().toLowerCase();
}

function normalizarPerfil(perfil = '') {
    return perfil === 'motorista' ? 'motorista' : PERFIL_PADRAO;
}

function criarSessao(usuario) {
    return {
        name: usuario.name,
        email: usuario.email,
        role: normalizarPerfil(usuario.role)
    };
}

export function obterUsuarios() {
    return lerJson(CHAVE_USUARIOS, []);
}

export function obterUsuarioAtual() {
    return lerJson(CHAVE_SESSAO, null);
}

export function deslogarUsuario() {
    localStorage.removeItem(CHAVE_SESSAO);
}

export function registrarUsuario({ name, email, password, role, documentData }) {
    const nomeNormalizado = name.trim();
    const emailNormalizado = normalizarEmail(email);
    const senhaNormalizada = password.trim();
    const perfilNormalizado = normalizarPerfil(role);

    if (!nomeNormalizado || !emailNormalizado || !senhaNormalizada) {
        throw new Error('Preencha todos os campos.');
    }

    if (!documentData?.scanId) {
        throw new Error('Escaneie o bilhete antes de concluir o cadastro.');
    }

    if (senhaNormalizada.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    const usuarios = obterUsuarios();
    const existe = usuarios.some(usuario => usuario.email === emailNormalizado);

    if (existe) {
        throw new Error('Este e-mail já está cadastrado.');
    }

    const usuario = {
        id: Date.now(),
        name: nomeNormalizado,
        email: emailNormalizado,
        password: senhaNormalizada,
        role: perfilNormalizado,
        documentData,
        createdAt: new Date().toISOString()
    };

    usuarios.push(usuario);
    escreverJson(CHAVE_USUARIOS, usuarios);
    escreverJson(CHAVE_SESSAO, criarSessao(usuario));

    return criarSessao(usuario);
}

export function autenticarUsuario({ email, password }) {
    const emailNormalizado = normalizarEmail(email);
    const senhaNormalizada = password.trim();

    if (!emailNormalizado || !senhaNormalizada) {
        throw new Error('Informe e-mail e senha.');
    }

    const usuario = obterUsuarios().find(
        usuarioSalvo => usuarioSalvo.email === emailNormalizado && usuarioSalvo.password === senhaNormalizada
    );

    if (!usuario) {
        throw new Error('E-mail ou senha inválidos.');
    }

    const sessao = criarSessao(usuario);
    escreverJson(CHAVE_SESSAO, sessao);
    return sessao;
}

export function excluirUsuario({ email, password }) {
    const emailNormalizado = normalizarEmail(email);
    const senhaNormalizada = password.trim();

    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex(
        u => u.email === emailNormalizado && u.password === senhaNormalizada
    );

    if (indice === -1) throw new Error('Senha incorreta.');

    usuarios.splice(indice, 1);
    escreverJson(CHAVE_USUARIOS, usuarios);
    localStorage.removeItem(CHAVE_SESSAO);
}
