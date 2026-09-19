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
  const [gameState, setGameState] = useState('start');
  const [totalPoints, setTotalPoints] = useState(() => {
    return parseInt(localStorage.getItem('kids_math_total_points')) || 0;
  });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [question, setQuestion] = useState({ num1: 0, num2: 0, isAddition: true, ans: 0 });
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [resultData, setResultData] = useState({ newlyHatched: null, nextDino: null, gained: 0 });

  const inputRef = useRef(null);

  useEffect(() => {
    let timer;
    if (gameState === 'game' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'game' && timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // 5歳児向けの問題生成（答えが最大10まで）
  const generateQuestion = () => {
    const isAddition = Math.random() > 0.4; // 6割は足し算
    let num1, num2, ans;

    if (isAddition) {
      // 答えが 2 〜 10 に収まるように設定
      num1 = Math.floor(Math.random() * 5) + 1; // 1〜5
      num2 = Math.floor(Math.random() * 5) + 1; // 1〜5
      ans = num1 + num2;
    } else {
      // 5〜9 から 1〜4 を引く形
      num1 = Math.floor(Math.random() * 5) + 3; // 3〜7
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1 〜 (num1-1)
      ans = num1 - num2;
    }
    setQuestion({ num1, num2, isAddition, ans });
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
      setFeedback({ text: "× おしい！ もういちど かぞえてみよう", type: "wrong" });
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

  const resetProgress = () => {
    if (window.confirm("ずかんを リセットして さいしょから あそぶ？")) {
      localStorage.removeItem('kids_math_total_points');
      setTotalPoints(0);
    }
  };

  // りんご（絵文字）を敷き詰めて表示する関数
  const renderApples = () => {
    const { num1, num2, isAddition } = question;

    if (isAddition) {
      // 足し算：左の群と右の群を分かりやすく分けて表示
      return (
        <div style={{ fontSize: '36px', margin: '15px 0', lineHeight: '1.4', wordBreak: 'break-all' }}>
          <span style={{ backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '10px' }}>
            {"🍎".repeat(num1)}
          </span>
          <span style={{ fontSize: '28px', margin: '0 8px', fontWeight: 'bold' }}>＋</span>
          <span style={{ backgroundColor: '#e0e7ff', padding: '4px 8px', borderRadius: '10px' }}>
            {"🍎".repeat(num2)}
          </span>
        </div>
      );
    } else {
      // 引き算：残るりんごと、ひく分のりんご（食べたイメージ）を区別
      const remaining = num1 - num2;
      return (
        <div style={{ fontSize: '36px', margin: '15px 0', lineHeight: '1.4', wordBreak: 'break-all' }}>
          <span style={{ backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '10px' }}>
            {"🍎".repeat(remaining)}
          </span>
          <span style={{ opacity: 0.3, padding: '4px 4px' }} title="たべちゃった！">
            {"🍽️".repeat(num2)}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="card">
      <h1>🦖 きょうりゅう さんすう パーク 🦕</h1>

      {gameState === 'start' && (
        <div>
          <p style={{ fontSize: '16px', fontWeight: 'bold' }}>りんごを かぞえて みよう！（30びょう）</p>
          <p>せいかいして ポイントをためると<br /><b>きょうりゅうの たまご</b> が われるよ！</p>
          <p>ぜんぶの ポイント: <span className="points" style={{ fontWeight: 'bold' }}>{totalPoints}</span> pt</p>
          <button onClick={startGame}>ゲットしにいく！</button>

          <h3 style={{ marginTop: '20px', fontSize: '16px' }}>まいにちの きょうりゅうずかん</h3>
          <div className="dino-collection">
            {DINOS.map((dino, idx) => {
              const isUnlocked = totalPoints >= dino.pt;
              return (
                <div key={idx} className={`dino-badge ${isUnlocked ? '' : 'locked'}`} title={`${dino.name} (${dino.pt}pt必要)`}>
                  {isUnlocked ? dino.emoji : "🥚"}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '25px' }}>
            <button 
              onClick={resetProgress} 
              style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#9ca3af', borderRadius: '8px' }}
            >
              🔄 ずかんを リセットする
            </button>
          </div>
        </div>
      )}

      {gameState === 'game' && (
        <div>
          <div className="stats">
            <div>のこり: <span className="timer">{timeLeft}</span>びょう</div>
            <div>ポイント: <span className="points">{totalPoints}</span> pt</div>
          </div>

          {/* 数式テキスト */}
          <div className="question">
            {question.num1} {question.isAddition ? '+' : '-'} {question.num2} = ?
          </div>

          {/* ★ 指で数えられる りんご表示エリア */}
          {renderApples()}

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
          <div className={`feedback ${feedback.type}`}>{feedback.text}</div>
        </div>
      )}

      {gameState === 'result' && (
        <div>
          <h2>タイムアップ！</h2>
          <p>せいかいすう: <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}</span> もん</p>
          <p>かくとくポイント: <span className="points" style={{ fontSize: '24px', fontWeight: 'bold' }}>{resultData.gained}</span> pt</p>
          <p>ごうけいポイント: <span className="points" style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalPoints}</span> pt</p>

          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626', margin: '10px 0' }}>
            {resultData.newlyHatched && `🎉 たまごが われて 【${resultData.newlyHatched.name}】 を ゲットしたよ！`}
            {!resultData.newlyHatched && resultData.nextDino && `つぎの たまごが われるまで あと ${resultData.nextDino.pt - totalPoints} pt！`}
            {!resultData.newlyHatched && !resultData.nextDino && `✨ すべての きょうりゅうを コンプリートしたよ！ ✨`}
          </div>

          <div className="dino-display">
            {resultData.newlyHatched ? resultData.newlyHatched.emoji : resultData.nextDino ? "🥚" : "👑🦖🦕"}
          </div>

          <div>
            <button onClick={() => setGameState('start')}>ずかんを みる（スタートへ）</button>
            <button onClick={startGame} className="btn-secondary">すぐ もういちど あそぶ</button>
          </div>
        </div>
      )}
    </div>
  );
}
