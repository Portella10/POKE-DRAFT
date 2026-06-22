import { useGameStore } from '../../store/gameStore';

export function StartScreen() {
  const startDraft = useGameStore((s) => s.startDraft);

  return (
    <section className="start">
      <h1>Poké Draft Cup</h1>
      <p className="lead">
        <strong>Monte um campeão</strong> escolhendo cada atributo de um Pokémon diferente e vença
        um campeonato eliminatório de 5 rodadas em duelos <strong>1v1 automáticos</strong>.
      </p>
      <ol className="how-to">
        <li>🧩 7 rodadas de escolha: pegue 1 atributo (Vida, Ataque, Defesa, Velocidade, Tipo, Habilidade ou Linha Evolutiva) de um dos 3 Pokémon.</li>
        <li>⚖️ Tudo conta: força, estilo (tipo), habilidade e se a evolução é boa.</li>
        <li>👁️ Veja o rival antes de cada duelo.</li>
        <li>⚔️ Assista ao duelo 1v1 automático — seu campeão evolui a cada rodada vencida.</li>
      </ol>
      <button type="button" className="primary big" onClick={() => startDraft()}>
        Começar
      </button>
    </section>
  );
}
