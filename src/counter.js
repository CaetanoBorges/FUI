export function configurarContador(elemento) {
  let contador = 0
  const definirContador = (contagem) => {
    contador = contagem
    elemento.innerHTML = `Contagem: ${contador}`
  }
  elemento.addEventListener('click', () => definirContador(contador + 1))
  definirContador(0)
}
