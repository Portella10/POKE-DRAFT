# 🏆 Poké Draft Cup

Jogo web onde você **monta um campeão** escolhendo cada atributo de um Pokémon diferente e vence um
campeonato eliminatório de 5 rodadas em **duelos 1v1 automáticos e animados**.

Construído com **TDD estrito** e uma **pirâmide de testes** (base larga de unitários, camada média
de integração/componentes, topo fino de e2e).

## A ideia: monte seu campeão dentro de um orçamento

Sua **ficha** tem 7 slots: **Vida, Ataque, Defesa, Velocidade, Tipo, Habilidade e Linha Evolutiva**.
Em **7 rodadas de escolha**, aparecem **3 Pokémon** (com sprite e todos os atributos visíveis) e você
pega **um atributo ainda vazio** de **um** deles. Cada slot só uma vez → seu campeão é um
"Frankenstein" estratégico.

**O peso de cada atributo — o Orçamento de Draft.** Cada atributo tem um **custo em Pontos de Draft
(PD)** proporcional à sua força, e você começa com um orçamento fixo (`DRAFT_BUDGET`). Pegar tudo no
máximo custaria muito mais do que você tem, então **cada escolha é um trade-off real**: a Vida do
Snorlax te deixa sem PD para um Ataque alto; um tipo defensivo (Aço/Voador) é caro; uma linha de 3
estágios pesa no bolso. O custo de cada slot vive em [`src/game/cost.ts`](src/game/cost.ts), é puro e
testado, e nunca te deixa "travar" (sempre sobra PD para completar a ficha — basta gastar com cabeça).

**Tudo conta:** a força (os status que você pega), o estilo (Tipo), a Habilidade (efeito de batalha)
e **se a evolução é boa**. A Linha Evolutiva define o sprite e dá um **pico de poder** conforme você
avança — uma linha de 3 estágios evolui 2x (forte no fim), uma de 1 estágio não evolui. Detalhe: um
Pokémon pode ter status fracos mas uma evolução excelente (ex.: Magikarp → Gyarados), então pegar a
*linha* dele pode valer mais que os status (e o custo de PD reflete isso).

Depois, **duelos 1v1 automáticos e animados**: seu campeão montado enfrenta um rival golpe a golpe,
com tipos/efetividade, crítico e a **Habilidade** que você escolheu — com **investida, tremor de
impacto e números de dano flutuantes**. Você **evolui automaticamente** a cada rodada vencida (o
sprite muda). Na arena você vê o rival, suas barras de status comparadas e o **confronto de tipos**
antes do duelo.

**Dificuldade que acompanha você.** O rival não é mais um Pokémon aleatório fraco: a cada rodada ele é
escolhido para ter **poder próximo ao seu** (escalado por `difficulty`), subindo até a **GRANDE FINAL**,
onde o Mestre da Liga luta **acima do seu nível** (`bossLevelBonus`). Montar bem a ficha continua
decisivo — mas agora é uma luta de verdade, não um atropelo.

### Habilidades (8)

Fúria (+ATK com pouca vida), Couraça (−15% dano recebido), Ímpeto (+15% VEL), Sortudo (crítico 20%),
Regenerar (cura 6%/turno), Intimidar (−10% ATK do rival), Vampírico (cura 25% do dano), Precisão
(nunca erra).

## Stack

- **Vite + React 18 + TypeScript** (`strict`, `noUnusedLocals`, `noUnusedParameters`)
- **Zustand** com middleware `persist` (progresso salvo em `localStorage`)
- **Vitest + Testing Library + jsdom** e **@vitest/coverage-v8**
- **Playwright** (e2e — 1 fluxo feliz)
- **ESLint + Prettier + typescript-eslint**

Sem som e sem bibliotecas de UI pesadas. As imagens são **sprites pixel oficiais da PokéAPI**
(fallback para emoji por tipo se a imagem falhar).

## Como rodar

```bash
npm install            # instala dependências
npm run dev            # desenvolvimento (http://localhost:5173)
npm run build          # build de produção (tsc -b + vite build)
npm run preview        # serve o build

npm test               # toda a suíte (Vitest)
npm run test:watch     # Vitest em watch
npm run coverage       # cobertura (thresholds: 90% em data/game, 80% global)
npm run e2e            # end-to-end (Playwright)

npm run lint           # ESLint (0 warnings)
npm run typecheck      # tsc -b
```

CI local: `npm run lint && npm run typecheck && npm run coverage && npm run e2e`.

## Arquitetura

Separação estrita **dados / lógica / store / UI**. A lógica é pura, determinística e 100% testável.

```
src/
  data/      # dados puros, sem lógica de jogo
    types.ts     # 18 tipos, rótulos PT, cores, emojis, tabela de efetividade Gen 6+
    species.ts   # SPECIES/CHAINS/BASE_TO_CHAIN/DRAFT_POOL — GERADO da PokéAPI (id, tipos, base{hp,atk,def,spd}, ability)
    abilities.ts # catálogo de 8 habilidades + seus efeitos numéricos
    sprites.ts   # URLs de sprite (front/back) a partir do id da Pokédex
    moves.ts     # pool de golpes fraco/forte por tipo + moveForType()
    rounds.ts    # config do campeonato (5 rodadas, chefe final)
  game/      # regras puras (sem React, sem DOM)
    rng.ts       # Rng + mulberry32 (PRNG semeado)
    sheet.ts     # a ficha de 7 slots: emptySlots/isComplete/takeAttribute
    cost.ts      # o "peso" de cada atributo em PD: slotCost/canAfford/DRAFT_BUDGET + powerOf (escala do rival)
    champion.ts  # da ficha aos números: stats com habilidade, estágio por rodada, moves
    draft.ts     # rollChoices (3 por rodada) + genRivalSheet (rival escalado ao seu poder)
    battle.ts    # duelo 1v1 automático imutável: buildChampion/calcDamage/aiChoose/autoTurn (+ habilidades)
  store/
    gameStore.ts # Zustand + persist: telas, ficha, rodadas de escolha, arena, duelo
  components/     # Topbar, TypeBadge, AbilityBadge, Sprite, ChampionPanel + screens/ (Start, Draft, Arena, Battle, Result)
```

### Determinismo (pré-requisito de testabilidade)

Nenhuma regra chama `Math.random()` diretamente: toda função com aleatoriedade recebe
`rng: Rng = Math.random`. Nos testes injetamos `mulberry32(seed)`, então até o "dano aleatório" e o
duelo automático inteiro são reproduzíveis. O `gameStore` guarda um inteiro `seed` e o avança a cada
uso, de modo que **um jogo salvo continua de forma reproduzível**.

### Dados e sprites

`src/data/species.ts` é **gerado uma única vez** da [PokéAPI](https://pokeapi.co) (id, tipos, stats
base incluindo HP, e uma habilidade por linha) e depois é totalmente estático — jogo e testes rodam
offline e deterministicamente. Os sprites pixel são montados a partir do id e carregados do CDN da
PokéAPI em runtime. Para regenerar:

```bash
node scripts/gen-species.mjs
```

### Calibração do duelo

```bash
npx vite-node scripts/sim-battle.ts
```

Reporta a duração média do duelo (alvo ~5–7 turnos, assistível) e confirma que **um campeão bem
montado vence rivais aleatórios** — ou seja, montar bem a ficha é decisivo.

## Fluxo do jogo

1. **Draft de atributos** — 7 escolhas; pegue 1 atributo vazio de 1 dos 3 Pokémon. Pense na sinergia
   (força + tipo + habilidade + qualidade da evolução).
2. **Arena** — veja seu campeão e o rival lado a lado e ajuste a estratégia.
3. **Duelo 1v1 automático** — assista golpe a golpe (1x/2x/4x, pausar, pular).
4. **Campeonato** — 5 rodadas (níveis 18→42); seu campeão evolui a cada vitória. A GRANDE FINAL é um
   Mestre da Liga totalmente evoluído. Perdeu = eliminado.

## Acessibilidade

Foco visível (`:focus-visible`), `prefers-reduced-motion` respeitado, `lang="pt-BR"`, ficha e chips
de atributo navegáveis por teclado com `aria-label` descritivo, barras de HP com `role="meter"`, log
com `aria-live` e sprites com `alt` (fallback para emoji).
