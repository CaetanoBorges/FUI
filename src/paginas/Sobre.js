import Header from '../componentes/Header.js';
import './Sobre.css';

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
        <main class="sobre-main">
            <h1 class="sobre-title" style="color: ${randomColor};">
                Bem-vindo à Sobre Nós
            </h1>
            <p class="sobre-quote">
                "${randomQuote}"
            </p>
            <div class="sobre-random-box">
                <h2>Conteúdo Aleatório</h2>
                <p>ID da sessão: ${Math.random().toString(36).substring(7)}</p>
                <p>Hora: ${new Date().toLocaleTimeString()}</p>
            </div>
        </main>
    `;
}