import Header from '../componentes/Header.js';

export default function Sobre(rotaAtual = '/sobre') {
    const randomQuotes = [
        'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
        'A melhor maneira de prever o futuro é criá-lo.',
        'Não espere pela oportunidade perfeita, crie-a.',
        'O código limpo sempre parece ter sido escrito por alguém que se importa.',
        'A programação é como uma arte, exige prática e paixão.'
    ];

    const randomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];
    const randomColor = `hsl(${Math.random() * 360}, 70%, 60%)`;

    return `
        ${Header("Sobre Nós", rotaAtual)}
        <main style="padding: 2rem; text-align: center;">
            <h1 style="color: ${randomColor}; font-size: 2.5rem;">
                Bem-vindo à Sobre Nós
            </h1>
            <p style="font-size: 1.2rem; margin-top: 2rem; font-style: italic;">
                "${randomQuote}"
            </p>
            <div style="margin-top: 3rem; padding: 1rem; background-color: #f0f0f0; border-radius: 8px;">
                <h2>Conteúdo Aleatório</h2>
                <p>ID da sessão: ${Math.random().toString(36).substring(7)}</p>
                <p>Hora: ${new Date().toLocaleTimeString()}</p>
            </div>
        </main>
    `;
}