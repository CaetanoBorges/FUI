import HeaderMotorista from '../componentes/HeaderMotorista.js';
import './SobreMotorista.css';

export default function SobreMotorista(rotaAtual = '/motorista/sobre') {
    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="smot-shell">
            <div class="smot-container">

                <!-- Hero -->
                <div class="smot-hero">
                    <div class="smot-hero-icon">
                        <i class="fa-solid fa-car"></i>
                    </div>
                    <h1 class="smot-hero-title">Gyro <span>Motorista</span></h1>
                    <p class="smot-hero-sub">A plataforma que conecta motoristas a passageiros de forma rápida, segura e eficiente.</p>
                </div>

                <!-- Estatísticas da plataforma -->
                <div class="smot-stats-row">
                    <div class="smot-stat">
                        <span class="smot-stat-num">12 mil+</span>
                        <span class="smot-stat-lbl">Motoristas ativos</span>
                    </div>
                    <div class="smot-stat">
                        <span class="smot-stat-num">98%</span>
                        <span class="smot-stat-lbl">Satisfação</span>
                    </div>
                    <div class="smot-stat">
                        <span class="smot-stat-num">18</span>
                        <span class="smot-stat-lbl">Províncias</span>
                    </div>
                </div>

                <!-- Como funciona -->
                <section class="smot-section">
                    <h2 class="smot-section-title">Como funciona</h2>
                    <div class="smot-steps">
                        <div class="smot-step">
                            <div class="smot-step-num">1</div>
                            <div class="smot-step-content">
                                <span class="smot-step-title">Fica online</span>
                                <span class="smot-step-desc">Ativa o modo online quando estiveres disponível para receber pedidos.</span>
                            </div>
                        </div>
                        <div class="smot-step">
                            <div class="smot-step-num">2</div>
                            <div class="smot-step-content">
                                <span class="smot-step-title">Recebe pedidos</span>
                                <span class="smot-step-desc">O sistema encontra passageiros próximos e envia-te pedidos em tempo real.</span>
                            </div>
                        </div>
                        <div class="smot-step">
                            <div class="smot-step-num">3</div>
                            <div class="smot-step-content">
                                <span class="smot-step-title">Aceita e conduz</span>
                                <span class="smot-step-desc">Aceita a corrida, embarca o passageiro e navega até ao destino.</span>
                            </div>
                        </div>
                        <div class="smot-step">
                            <div class="smot-step-num">4</div>
                            <div class="smot-step-content">
                                <span class="smot-step-title">Recebe o pagamento</span>
                                <span class="smot-step-desc">O valor é creditado automaticamente na tua conta após cada corrida concluída.</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Vantagens -->
                <section class="smot-section">
                    <h2 class="smot-section-title">As tuas vantagens</h2>
                    <div class="smot-cards">
                        <div class="smot-card">
                            <div class="smot-card-icon"><i class="fa-solid fa-wallet"></i></div>
                            <div class="smot-card-body">
                                <span class="smot-card-title">Ganhos competitivos</span>
                                <span class="smot-card-desc">Recebes uma percentagem justa por cada corrida, com bónus semanais por desempenho.</span>
                            </div>
                        </div>
                        <div class="smot-card">
                            <div class="smot-card-icon"><i class="fa-solid fa-clock"></i></div>
                            <div class="smot-card-body">
                                <span class="smot-card-title">Horário flexível</span>
                                <span class="smot-card-desc">Trabalha quando quiseres. Não tens mínimo de horas exigido.</span>
                            </div>
                        </div>
                        <div class="smot-card">
                            <div class="smot-card-icon"><i class="fa-solid fa-shield-halved"></i></div>
                            <div class="smot-card-body">
                                <span class="smot-card-title">Segurança garantida</span>
                                <span class="smot-card-desc">Seguro de viagem incluído e equipa de suporte disponível 24h.</span>
                            </div>
                        </div>
                        <div class="smot-card">
                            <div class="smot-card-icon"><i class="fa-solid fa-star"></i></div>
                            <div class="smot-card-body">
                                <span class="smot-card-title">Sistema de avaliação</span>
                                <span class="smot-card-desc">A tua reputação abre acesso a mais pedidos e melhores tarifas.</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Contacto / suporte -->
                <section class="smot-section">
                    <h2 class="smot-section-title">Suporte</h2>
                    <div class="smot-contact-list">
                        <a href="tel:+244900000000" class="smot-contact-item">
                            <div class="smot-contact-icon"><i class="fa-solid fa-phone"></i></div>
                            <div class="smot-contact-info">
                                <span class="smot-contact-label">Linha de apoio</span>
                                <span class="smot-contact-value">+244 900 000 000</span>
                            </div>
                            <i class="fa-solid fa-chevron-right smot-contact-arrow"></i>
                        </a>
                        <a href="mailto:motoristas@gyro.ao" class="smot-contact-item">
                            <div class="smot-contact-icon"><i class="fa-solid fa-envelope"></i></div>
                            <div class="smot-contact-info">
                                <span class="smot-contact-label">E-mail de suporte</span>
                                <span class="smot-contact-value">motoristas@gyro.ao</span>
                            </div>
                            <i class="fa-solid fa-chevron-right smot-contact-arrow"></i>
                        </a>
                        <div class="smot-contact-item">
                            <div class="smot-contact-icon"><i class="fa-solid fa-circle-info"></i></div>
                            <div class="smot-contact-info">
                                <span class="smot-contact-label">Versão da aplicação</span>
                                <span class="smot-contact-value">Gyro v1.0.0</span>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    `;

    return { html, init() {} };
}
