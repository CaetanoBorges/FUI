const URL_BASE_API = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '';

export async function scanBilhete({ frontImage, backImage }) {
    const dadosFormulario = new FormData();
    dadosFormulario.append('frontImage', frontImage);
    dadosFormulario.append('backImage', backImage);

    let resposta;

    try {
        resposta = await fetch(`${URL_BASE_API}/api/ocr/bilhete`, {
            method: 'POST',
            body: dadosFormulario
        });
    } catch {
        throw new Error('Não foi possível conectar ao OCR. Inicie a API local antes de escanear o bilhete.');
    }

    const resultado = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(resultado.error || 'Não foi possível processar o bilhete agora.');
    }

    return resultado;
}
