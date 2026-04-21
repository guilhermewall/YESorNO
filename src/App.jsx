import { useEffect, useState } from "react";

const introQuestion = "Me diga, está pronta?";

const storyLines = [
  "Pensei no momento com carinho, apesar de ter ficado em dúvida entre uns cinco lugares. Talvez a gente ainda visite os outros, mas isso deve ficar para outro momento.",
  "Dessa vez, não é você que vai se esforçar. Só aproveite, porém preciso de uma coisa.",
  "Lembra de quando saíamos e você sempre deitava no meu colo? Quero você despreocupada, esqueça de tudo por um momento e só aproveite.",
  "Nesta ocasião, vamos de preto e branco. Isso me faz lembrar da vez em que te vi arrumada em uma festa do buffet. Eu ainda estava trabalhando como garçom, mas não deixei de reparar em você.",
  "Ainda é inevitável, tento de muitas formas, não pensar, mas sempre volto.",
];

const proposalText =
  "Por isso, eu quero te fazer uma proposta, vamos tentar uma última vez?";

const confirmDurationMs = 4000;
const evadeLimit = 4;
const storyVisibleMs = 4000;
const storyTransitionMs = 1300;

const splitIntoPhrases = (text) =>
  (text.match(/[^,.!?]+[,.!?]?/g) ?? [])
    .map((phrase) => phrase.trim())
    .filter(Boolean);

const storyPhrases = storyLines.flatMap(splitIntoPhrases);

function App() {
  const [stage, setStage] = useState("intro");
  const [lineIndex, setLineIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [noAttempts, setNoAttempts] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [finalMessage, setFinalMessage] = useState("");
  const [yesFillPct, setYesFillPct] = useState(0);
  const [isHoldingYes, setIsHoldingYes] = useState(false);
  const [isEndingCinematic, setIsEndingCinematic] = useState(false);
  const [isEndingTextFading, setIsEndingTextFading] = useState(false);

  useEffect(() => {
    if (stage !== "story") return undefined;

    const fadeOutTimer = setTimeout(() => setVisible(false), storyVisibleMs);
    const nextLineTimer = setTimeout(() => {
      if (lineIndex >= storyPhrases.length - 1) {
        setStage("proposal");
        setVisible(true);
        return;
      }
      setLineIndex((prev) => prev + 1);
      setVisible(true);
    }, storyVisibleMs + storyTransitionMs);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextLineTimer);
    };
  }, [lineIndex, stage]);

  useEffect(() => {
    if (stage !== "proposal" || !isHoldingYes) return undefined;

    const startedAt = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / confirmDurationMs) * 100);
      setYesFillPct(pct);
    }, 40);

    const finishConfirm = setTimeout(() => {
      setYesFillPct(100);
      setIsHoldingYes(false);
      setStage("explosion");
    }, confirmDurationMs);

    return () => {
      clearInterval(tick);
      clearTimeout(finishConfirm);
    };
  }, [isHoldingYes, stage]);

  useEffect(() => {
    if (stage !== "explosion") return undefined;

    const timer = setTimeout(() => {
      setStage("ending");
      setFinalMessage(
        "Às 20h em ponto na sexta, estarei te esperando para o nosso primeiro passo.",
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "ending") {
      setIsEndingCinematic(false);
      setIsEndingTextFading(false);
      return undefined;
    }

    if (!finalMessage.startsWith("Às 20h")) return undefined;

    const cinematicTimer = setTimeout(() => {
      setIsEndingTextFading(true);
      setIsEndingCinematic(true);
    }, 5000);

    return () => clearTimeout(cinematicTimer);
  }, [finalMessage, stage]);

  const startStory = () => {
    setStage("story");
    setLineIndex(0);
    setVisible(true);
    setIsEndingCinematic(false);
    setIsEndingTextFading(false);
  };

  const introNo = () => {
    setStage("introDeclined");
  };

  const moveNoButton = () => {
    if (stage !== "proposal" || noAttempts >= evadeLimit) return;

    const maxX = window.innerWidth < 720 ? 90 : 140;
    const maxY = window.innerWidth < 720 ? 45 : 70;
    const x = Math.floor((Math.random() * 2 - 1) * maxX);
    const y = Math.floor((Math.random() * 2 - 1) * maxY);

    setNoPosition({ x, y });
    setNoAttempts((prev) => prev + 1);
  };

  const chooseNoProposal = () => {
    if (noAttempts < evadeLimit) {
      moveNoButton();
      return;
    }

    setFinalMessage(
      "Você foi rápida, não tenho mais o que dizer. Avise-me no WhatsApp.",
    );
    setStage("ending");
  };

  const holdStartYesProposal = () => {
    if (stage !== "proposal") return;
    setYesFillPct(0);
    setIsHoldingYes(true);
  };

  const holdCancelYesProposal = () => {
    if (!isHoldingYes || stage !== "proposal") return;
    setIsHoldingYes(false);
    setYesFillPct(0);
  };

  const isConfirming = stage === "proposal" && isHoldingYes;
  const isPositiveEnding = finalMessage.startsWith("Às 20h");

  return (
    <main
      className={`night-sky ${isConfirming || stage === "explosion" ? "shake-screen" : ""} ${isEndingCinematic ? "ending-cinematic" : ""}`}
      style={{
        "--blast-alpha": `${isConfirming ? 0.15 + yesFillPct / 120 : stage === "explosion" ? 0.75 : 0}`,
      }}
    >
      <div className="moon" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />
      <div className="nebula" aria-hidden="true" />

      <section className="scene">
        {stage === "intro" && (
          <div className="block enter">
            <h1>{introQuestion}</h1>
            <div className="actions">
              <button className="btn yes" onClick={startStory}>
                Sim
              </button>
              <button className="btn no" onClick={introNo}>
                Não
              </button>
            </div>
          </div>
        )}

        {stage === "introDeclined" && (
          <div className="block enter">
            <h2>Tudo bem, volte outra hora.</h2>
          </div>
        )}

        {stage === "story" && (
          <div className={`block ${visible ? "enter" : "leave"}`}>
            <p className="story-text">{storyPhrases[lineIndex]}</p>
          </div>
        )}

        {stage === "proposal" && (
          <div className="block enter">
            <p className="story-text">{proposalText}</p>
            <div className="actions proposal-actions">
              <button
                className={`btn yes ${isConfirming ? "loading" : ""}`}
                style={{ "--fill": `${yesFillPct}%` }}
                onMouseDown={holdStartYesProposal}
                onMouseUp={holdCancelYesProposal}
                onMouseLeave={holdCancelYesProposal}
                onTouchStart={holdStartYesProposal}
                onTouchEnd={holdCancelYesProposal}
                onTouchCancel={holdCancelYesProposal}
              >
                <span>Sim</span>
              </button>
              <button
                className="btn no runner"
                style={{
                  transform: `translate(${noPosition.x}px, ${noPosition.y}px)`,
                }}
                onMouseEnter={moveNoButton}
                onClick={chooseNoProposal}
                disabled={isConfirming}
              >
                Não
              </button>
            </div>
          </div>
        )}

        {stage === "explosion" && (
          <div className="block enter blast">
            <h2>Respira... agora vai.</h2>
          </div>
        )}

        {stage === "ending" && (
          <div
            className={`block enter ending ${isEndingTextFading ? "fading" : ""}`}
          >
            <h2 className={`ending-text ${isEndingTextFading ? "fading" : ""}`}>
              {finalMessage}
            </h2>
            {isPositiveEnding && (
              <div
                className={`ending-date ${isEndingTextFading ? "visible" : ""}`}
              >
                24.04
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
