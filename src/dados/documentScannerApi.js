const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '';

export async function scanBilhete({ frontImage, backImage }) {
    const formData = new FormData();
    formData.append('frontImage', frontImage);
    formData.append('backImage', backImage);

    let response;

    try {
        response = await fetch(`${API_BASE_URL}/api/ocr/bilhete`, {
            method: 'POST',
            body: formData
        });
    } catch {
        throw new Error('Não foi possível conectar ao OCR. Inicie a API local antes de escanear o bilhete.');
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível processar o bilhete agora.');
    }

    return payload;
}
