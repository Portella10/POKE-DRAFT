import { useGameStore } from '../../store/gameStore';

const ORBIT = [
  { e: '🔥', x: -180, d: '0s' },
  { e: '💧', x: -90, d: '0.6s' },
  { e: '⚡', x: 0, d: '1.2s' },
  { e: '🌿', x: 90, d: '0.3s' },
  { e: '🐉', x: 180, d: '0.9s' },
];

export function StartScreen() {
  const startDraft = useGameStore((s) => s.startDraft);

  return (
    <section className="start">
      <h1>Poké Draft Cup</h1>
      <div className="hero-orbit" aria-hidden>
        {ORBIT.map((o) => (
          <span key={o.e} style={{ marginLeft: o.x, animationDelay: o.d }}>
            {o.e}
          </span>
        ))}
      </div>
      <p className="lead">
        <strong>Monte um campeão Frankenstein</strong> escolhendo cada atributo de um Pokémon
        diferente — mas você tem um <strong>orçamento de Pontos de Draft</strong>. Não dá pra pegar
        tudo no máximo. Depois, vença um campeonato de 5 rodadas em duelos{' '}
        <strong>1v1 automáticos e animados</strong>.
      </p>
      <ol className="how-to">
        <li>🧩 7 escolhas: pegue 1 atributo (Vida, Ataque, Defesa, Velocidade, Tipo, Habilidade ou Linha Evolutiva).</li>
        <li>💰 Cada atributo custa <strong>PD</strong> conforme sua força — gaste com sabedoria.</li>
        <li>👁️ Veja o rival e o confronto de tipos antes de cada duelo.</li>
        <li>⚔️ Assista ao duelo — seu campeão evolui a cada rodada vencida.</li>
        <li>👑 A GRANDE FINAL é o Mestre da Liga, acima do seu nível.</li>
      </ol>
      <div>
        <button type="button" className="primary big" onClick={() => startDraft()}>
          Começar ⚔️
        </button>
      </div>
    </section>
  );
}
