import { useState, useEffect, useRef } from 'react';

const DINOS = [
  { name: "トリケラトプス", pt: 30, emoji: "🦖" },
  { name: "プテラノドン", pt: 60, emoji: "🦕" },
  { name: "ティラノサウルス", pt: 100, emoji: "🦖" },
  { name: "ブラキオサウルス", pt: 150, emoji: "🦕" },
  { name: "スピノサウルス", pt: 200, emoji: "👑" }
];

// ★ご自身の API Gateway URL に書き換えてください
const API_URL = "https://vv06qa0nw9.execute-api.ap-northeast-1.amazonaws.com/score";

export default function App() {
  const [gameState, setGameState] = useState('start'); // 'start' | 'game' | 'result'
  const [totalPoints, setTotalPoints] = useState(() => {
    return parseInt(localStorage.getItem('kids_math_total_points')) || 0;
  });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [question, setQuestion] = useState({ text: '', ans: 0 });
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [resultData, setResultData] = useState({ newlyHatched: null, nextDino: null, gained: 0 });

  const inputRef = useRef(null);

  // ローカルストレージ保存
  useEffect(() => {
    localStorage.getItem('kids_math_total_points');
  }, [totalPoints]);

  // タイマー処理
  useEffect(() => {
    let timer;
    if (gameState === 'game' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'game' && timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const generateQuestion = () => {
    const isAddition = Math.random() > 0.5;
    let num1, num2, ans, text;
    if (isAddition) {
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      ans = num1 + num2;
      text = `${num1} + ${num2} = ?`;
    } else {
      num1 = Math.floor(Math.random() * 10) + 5;
      num2 = Math.floor(Math.random() * num1) + 1;
      ans = num1 - num2;
      text = `${num1} - ${num2} = ?`;
    }
    setQuestion({ text, ans });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setFeedback({ text: '', type: '' });
    setInputVal('');
    generateQuestion();
    setGameState('game');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const checkAnswer = () => {
    const userAns = parseInt(inputVal);
    if (isNaN(userAns)) return;

    if (userAns === question.ans) {
      setScore(prev => prev + 1);
      setTotalPoints(prev => {
        const nextPt = prev + 10;
        localStorage.setItem('kids_math_total_points', nextPt);
        return nextPt;
      });
      setFeedback({ text: "○ せいかい！ 🍖GET", type: "correct" });
    } else {
      setFeedback({ text: "× おしい！", type: "wrong" });
    }
    setInputVal('');
    generateQuestion();
    inputRef.current?.focus();
  };

  const endGame = async () => {
    setGameState('result');
    const gained = score * 10;
    const previousTotal = totalPoints - gained;

    const newlyHatched = DINOS.find(dino => previousTotal < dino.pt && totalPoints >= dino.pt);
    const nextDino = DINOS.find(dino => totalPoints < dino.pt);

    setResultData({ newlyHatched, nextDino, gained });

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'child1', points: totalPoints, score })
      });
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div class="card">
      <h1>🦖 きょうりゅう さんすう パーク 🦕</h1>

      {gameState === 'start' && (
        <div>
          <p>1ねんせいの さんすう もんだい（30びょう）</p>
          <p>せいかいして ポイントをためると<br /><b>きょうりゅうの たまご</b> が われるよ！</p>
          <p>ぜんぶの ポイント: <span class="points" style={{ fontWeight: 'bold' }}>{totalPoints}</span> pt</p>
          <button onClick={startGame}>ゲットしにいく！</button>

          <h3 style={{ marginTop: '20px', fontSize: '16px' }}>まいにちの きょうりゅうずかん</h3>
          <div class="dino-collection">
            {DINOS.map((dino, idx) => {
              const isUnlocked = totalPoints >= dino.pt;
              return (
                <div key={idx} class={`dino-badge ${isUnlocked ? '' : 'locked'}`} title={`${dino.name} (${dino.pt}pt必要)`}>
                  {isUnlocked ? dino.emoji : "🥚"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'game' && (
        <div>
          <div class="stats">
            <div>のこり: <span class="timer">{timeLeft}</span>びょう</div>
            <div>ポイント: <span class="points">{totalPoints}</span> pt</div>
          </div>
          <div class="question">{question.text}</div>
          <input
            ref={inputRef}
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            autoFocus
          />
          <br />
          <button onClick={checkAnswer}>こたえる</button>
          <div class={`feedback ${feedback.type}`}>{feedback.text}</div>
        </div>
      )}

      {gameState === 'result' && (
        <div>
          <h2>タイムアップ！</h2>
          <p>せいかいすう: <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}</span> もん</p>
          <p>かくとくポイント: <span class="points" style={{ fontSize: '24px', fontWeight: 'bold' }}>{resultData.gained}</span> pt</p>
          <p>ごうけいポイント: <span class="points" style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalPoints}</span> pt</p>

          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', margin: '10px 0' }}>
            {resultData.newlyHatched && `🎉 たまごが われて 【${resultData.newlyHatched.name}】 を ゲットしたよ！`}
            {!resultData.newlyHatched && resultData.nextDino && `つぎの たまごが われるまで あと ${resultData.nextDino.pt - totalPoints} pt！`}
            {!resultData.newlyHatched && !resultData.nextDino && `✨ すべての きょうりゅうを コンプリートしたよ！ ✨`}
          </div>

          <div class="dino-display">
            {resultData.newlyHatched ? resultData.newlyHatched.emoji : resultData.nextDino ? "🥚" : "👑🦖🦕"}
          </div>

          <div>
            <button onClick={() => setGameState('start')}>ずかんを みる（スタートへ）</button>
            <button onClick={startGame} class="btn-secondary">すぐ もういちど あそぶ</button>
          </div>
        </div>
      )}
    </div>
  );
}
