    // Generate board cells
    const boardEl = document.getElementById('board');
    for(let i=0;i<9;i++){
      const c = document.createElement('div');
      c.className='cell';
      c.dataset.index=i;
      c.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g class="x"><path d="M20 20 L80 80" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="o"><circle cx="50" cy="50" r="28" fill="none"/></g>
      </svg>`;
      boardEl.appendChild(c);
    }

    // Game state
    let board = Array(9).fill(null);
    let current = 'X';
    let gameOver=false;
    let scores={X:0,O:0,D:0};
    const turnLabel = document.getElementById('turnLabel');
    const scoreX = document.getElementById('scoreX');
    const scoreO = document.getElementById('scoreO');
    const scoreD = document.getElementById('scoreD');
    const winLine = document.getElementById('winLine');
    const confettiCanvas = document.getElementById('confetti');
    const modeSelect = document.getElementById('modeSelect');
    const speedInput = document.getElementById('speed');
    const undoBtn = document.getElementById('undo');
    const hintBtn = document.getElementById('hint');
    const restartBtn = document.getElementById('restart');

    let history = [];

    function render(){
      const cells = document.querySelectorAll('.cell');
      cells.forEach((cell,i)=>{
        cell.classList.toggle('disabled', !!board[i] || gameOver);
        const svg = cell.querySelector('svg');
        svg.querySelector('.x path').style.stroke = board[i]==='X'? 'var(--accent)' : 'transparent';
        svg.querySelector('.o circle').style.stroke = board[i]==='O'? 'var(--accent-2)' : 'transparent';
        if(board[i]==='X') svg.querySelector('.x path').classList.add('drawX');
        else svg.querySelector('.x path').classList.remove('drawX');
        if(board[i]==='O') svg.querySelector('.o circle').classList.add('drawO');
        else svg.querySelector('.o circle').classList.remove('drawO');
      });

      turnLabel.innerText = gameOver ? '—' : (current==='X' ? 'Player (X)' : (modeSelect.value.startsWith('ai') ? 'AI (O)' : 'Player (O)'));
      scoreX.innerText = scores.X; scoreO.innerText = scores.O; scoreD.innerText = scores.D;
    }

    function checkWinner(b){
      const wins = [ [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6] ];
      for(const w of wins){
        const [a,b1,c]=w;
        if(b[a] && b[a]===b[b1] && b[a]===b[c]) return {winner:b[a],line:w};
      }
      if(b.every(Boolean)) return {winner:'D'};
      return null;
    }

    function place(i,player,record=true){
      if(gameOver || board[i]) return false;
      if(record) history.push(board.slice());
      board[i]=player;
      animateCell(i,player);
      const res = checkWinner(board);
      if(res){
        gameOver=true;
        if(res.winner==='D'){ scores.D++; showDraw(); }
        else{ scores[res.winner]++; showWin(res); }
      }
      current = current==='X'? 'O' : 'X';
      render();
      return true;
    }

    // Click handling
    boardEl.addEventListener('click', e=>{
      const cell = e.target.closest('.cell'); if(!cell) return;
      const i = Number(cell.dataset.index);
      if(modeSelect.value.startsWith('ai') && current==='O') return; // block click when AI's turn
      if(place(i,current)){
        if(!gameOver && modeSelect.value==='ai_easy' && current==='O'){ setTimeout(()=> aiEasyMove(), 450); }
        if(!gameOver && modeSelect.value==='ai_hard' && current==='O'){ setTimeout(()=> aiBestMove(), 350); }
      }
    });

    // Animations
    function animateCell(i,player){
      const c = document.querySelector(`.cell[data-index='${i}']`);
      c.classList.add('pop');
      setTimeout(()=> c.classList.remove('pop'), 400);
    }

    // Win line and confetti
    function showWin({winner,line}){
      drawWinLine(line);
      runConfetti();
      setTimeout(()=>{alert(winner + ' wins!');},400);
    }
    function showDraw(){
      setTimeout(()=>{alert('Draw!');},200);
    }

    function drawWinLine(line){
      const cells = Array.from(document.querySelectorAll('.cell'));
      const a = cells[line[0]].getBoundingClientRect();
      const c = cells[line[1]].getBoundingClientRect();
      const b = cells[line[2]].getBoundingClientRect();
      const boardRect = boardEl.getBoundingClientRect();

      const mid1 = {x: a.left + a.width/2 - boardRect.left, y: a.top + a.height/2 - boardRect.top};
      const mid2 = {x: b.left + b.width/2 - boardRect.left, y: b.top + b.height/2 - boardRect.top};
      const x = (mid1.x + mid2.x)/2;
      const y = (mid1.y + mid2.y)/2;
      const dx = mid2.x - mid1.x;
      const dy = mid2.y - mid1.y;
      const len = Math.hypot(dx,dy);
      winLine.style.width = len + 'px';
      winLine.style.left = x - len/2 + 'px';
      winLine.style.top = y - 8 + 'px';
      winLine.style.transform = `rotate(${Math.atan2(dy,dx)}rad)`;
      winLine.style.opacity=1;
      setTimeout(()=> winLine.style.opacity=0,1800);
    }

    // Simple confetti implementation
    function runConfetti(){
      const ctx = confettiCanvas.getContext('2d');
      confettiCanvas.width = confettiCanvas.clientWidth = boardEl.clientWidth;
      confettiCanvas.height = confettiCanvas.clientHeight = boardEl.clientHeight;
      confettiCanvas.style.left = boardEl.offsetLeft + 'px';
      confettiCanvas.style.top = boardEl.offsetTop + 'px';
      const colours = ['#7c3aed','#06b6d4','#f59e0b','#ef4444','#10b981'];
      let particles=[];
      for(let i=0;i<60;i++) particles.push({x: Math.random()*confettiCanvas.width, y: Math.random()* -200, r: 6+Math.random()*8, vx: -2+Math.random()*4, vy:1+Math.random()*4, c: colours[Math.floor(Math.random()*colours.length)], rot: Math.random()*360});
      let t=0;
      function frame(){
        ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
        particles.forEach(p=>{ p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.rot+=4; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillStyle=p.c; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6); ctx.restore(); });
        t++; if(t<130) requestAnimationFrame(frame); else ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      }
      frame();
    }

    // AI: Easy random
    function aiEasyMove(){
      const empties = board.map((v,i)=>v?null:i).filter(v=>v!==null);
      if(!empties.length) return;
      const pick = empties[Math.floor(Math.random()*empties.length)];
      place(pick,'O');
    }

    // AI: Hard - minimax
    function aiBestMove(){
      const best = minimax(board.slice(), 'O').index;
      place(best,'O');
    }

    function minimax(newBoard, player){
      const avail = newBoard.map((v,i)=>v?null:i).filter(v=>v!==null);
      const res = checkWinner(newBoard);
      if(res){ if(res.winner==='X') return {score:-10}; if(res.winner==='O') return {score:10}; return {score:0}; }
      const moves = [];
      for(let i of avail){
        const move = {}; move.index=i;
        newBoard[i]=player;
        const result = minimax(newBoard, player==='O'?'X':'O');
        move.score = result.score;
        newBoard[i]=null;
        moves.push(move);
      }
      let bestMove;
      if(player==='O'){
        let bestScore=-Infinity; for(const m of moves) if(m.score>bestScore){bestScore=m.score;bestMove=m}
      } else {
        let bestScore=Infinity; for(const m of moves) if(m.score<bestScore){bestScore=m.score;bestMove=m}
      }
      return bestMove;
    }

    // Hint: show best next move briefly
    hintBtn.addEventListener('click', ()=>{
      if(gameOver) return; const mode = modeSelect.value; const copy = board.slice(); const best = (mode==='ai_hard' || mode==='ai_easy') && current==='X' ? minimax(copy,'X') : minimax(copy,current); const idx = best && best.index!==undefined ? best.index : null; if(idx===null) return;
      const cell = document.querySelector(`.cell[data-index='${idx}']`);
      cell.style.boxShadow = '0 0 0 6px rgba(124,58,237,0.14)';
      setTimeout(()=> cell.style.boxShadow='', 700);
    });

    // Undo
    undoBtn.addEventListener('click', ()=>{
      if(!history.length) return; board = history.pop(); gameOver=false; current = 'X'; render();
    });

    // Restart
    restartBtn.addEventListener('click', ()=>{ board = Array(9).fill(null); history=[]; gameOver=false; current='X'; winLine.style.opacity=0; render(); });

    // Mode change
    modeSelect.addEventListener('change', ()=>{ board = Array(9).fill(null); history=[]; gameOver=false; current='X'; render(); });

    // Speed control (not used heavily, kept for future)
    speedInput.addEventListener('input', ()=>{});

    render();

    // make responsive canvas position
    window.addEventListener('resize', ()=>{ confettiCanvas.style.left = boardEl.offsetLeft + 'px'; confettiCanvas.style.top = boardEl.offsetTop + 'px'; confettiCanvas.width = boardEl.clientWidth; confettiCanvas.height = boardEl.clientHeight; });

    // small initial fancy auto-move to feel magical (if user chooses ai_hard after first move it's optimal anyway)
    // Note: This game uses minimax for perfect play in hard mode; easy mode is random.
