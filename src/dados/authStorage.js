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
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        phone: usuario.phone ?? null,
        role: normalizarPerfil(usuario.role),
        createdAt: usuario.createdAt,
        documentData: usuario.documentData ?? null,
        emailVerified: usuario.emailVerified ?? false,
        phoneVerified: usuario.phoneVerified ?? false,
        avatar: usuario.avatar ?? null,
        subscriptionStart: usuario.subscriptionStart ?? null,
        subscriptionEnd: usuario.subscriptionEnd ?? null,
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
        createdAt: new Date().toISOString(),
        emailVerified: false,
        phoneVerified: false
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

export function atualizarDadosConta({ emailAtual, novoEmail, telefone }) {
    const emailNormalizado = normalizarEmail(emailAtual);
    const novoEmailNormalizado = normalizarEmail(novoEmail || emailAtual);
    const telefoneLimpo = (telefone || '').trim();

    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex(u => u.email === emailNormalizado);

    if (indice === -1) throw new Error('Utilizador não encontrado.');

    if (novoEmailNormalizado !== emailNormalizado) {
        const emailOcupado = usuarios.some((u, i) => i !== indice && u.email === novoEmailNormalizado);
        if (emailOcupado) throw new Error('Este e-mail já está em uso.');
    }

    const emailMudou = novoEmailNormalizado !== emailNormalizado;
    const telefoneMudou = (telefoneLimpo || null) !== (usuarios[indice].phone || null);
    usuarios[indice] = {
        ...usuarios[indice],
        email: novoEmailNormalizado,
        phone: telefoneLimpo || null,
        emailVerified: emailMudou ? false : (usuarios[indice].emailVerified ?? false),
        phoneVerified: telefoneMudou ? false : (usuarios[indice].phoneVerified ?? false)
    };
    escreverJson(CHAVE_USUARIOS, usuarios);
    const sessao = criarSessao(usuarios[indice]);
    escreverJson(CHAVE_SESSAO, sessao);
    return sessao;
}

export function marcarComoVerificado({ email, campo }) {
    const emailNormalizado = normalizarEmail(email);
    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex(u => u.email === emailNormalizado);
    if (indice === -1) throw new Error('Utilizador não encontrado.');
    const update = campo === 'email' ? { emailVerified: true } : { phoneVerified: true };
    usuarios[indice] = { ...usuarios[indice], ...update };
    escreverJson(CHAVE_USUARIOS, usuarios);
    const sessao = criarSessao(usuarios[indice]);
    escreverJson(CHAVE_SESSAO, sessao);
    return sessao;
}

export function alterarSenha({ email, senhaAtual, novaSenha }) {
    const emailNormalizado = normalizarEmail(email);
    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex(u => u.email === emailNormalizado);
    if (indice === -1) throw new Error('Utilizador não encontrado.');
    if (usuarios[indice].password !== senhaAtual.trim()) throw new Error('Senha atual incorreta.');
    if (novaSenha.trim().length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    usuarios[indice] = { ...usuarios[indice], password: novaSenha.trim() };
    escreverJson(CHAVE_USUARIOS, usuarios);
}

export function atualizarAvatar({ email, avatar }) {
    const emailNormalizado = normalizarEmail(email);
    const usuarios = obterUsuarios();
    const indice = usuarios.findIndex(u => u.email === emailNormalizado);
    if (indice === -1) throw new Error('Utilizador não encontrado.');
    usuarios[indice] = { ...usuarios[indice], avatar };
    escreverJson(CHAVE_USUARIOS, usuarios);
    const sessao = criarSessao(usuarios[indice]);
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
