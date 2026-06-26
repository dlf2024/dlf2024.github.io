(function(){
  const cfg = window.DLF_CHATBOT_CONFIG || {};
  const API = (cfg.apiBase || "http://localhost:8001") + "/chat";
  let sessionId = null;

  function scrollToId(id) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openPortfolioTab(tabId) {
    scrollToId('#Portofolio');
    if (typeof window.showPortofolioTab === 'function') {
      window.showPortofolioTab(tabId, document.createElement('button'));
      return;
    }
    document.querySelectorAll('.portofolio_tab_scrollable').forEach(el => el.style.display = 'none');
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
  }

  function openSkillsTab(tabId) {
    scrollToId('#Skills');
    if (typeof window.showSkillTab === 'function') {
      window.showSkillTab(tabId, document.createElement('button'));
      return;
    }
    document.querySelectorAll('.skills_tab_scrollable').forEach(el => el.style.display = 'none');
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
  }

  function openBioTab(tabId) {
    scrollToId('#Biography');
    if (typeof window.showBioTab === 'function') {
      window.showBioTab(tabId, document.createElement('button'));
      return;
    }
    document.querySelectorAll('.infobox_tab_scrollable').forEach(el => el.style.display = 'none');
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
  }

  const QUICK_ACTIONS = {
    "Work with Me": () => openBioTab("workwithme"),
    "ML projects": () => openPortfolioTab("ML"),
    "Wheat Big Data": () => openPortfolioTab("bigdata"),
    "Bioinformatics": () => openSkillsTab("bioinformatics"),
    "Coding skills": () => openSkillsTab("programming"),
    "Storytelling": () => openSkillsTab("storytelling"),
    "Biography": () => scrollToId('#Biography')
  };

  const style = document.createElement('style');
  style.textContent = `
  .dlf-chat-launch {position:fixed; right:18px; bottom:18px; width:56px; height:56px; border-radius:50%; background:#3F007E; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 10px 20px rgba(0,0,0,.2); font-weight:700; z-index:9999;}
  .dlf-chat {position:fixed; right:18px; bottom:86px; width:min(340px, calc(100vw - 36px)); max-height:65vh; background:#fff; border:1px solid #eee; border-radius:16px; box-shadow:0 12px 24px rgba(0,0,0,.18); display:none; flex-direction:column; overflow:hidden; z-index:9999;}
  .dlf-chat.open {display:flex}
  .dlf-head {padding:10px 12px; background:#3F007E; color:#fff; font-size:15px;}
  .dlf-body {padding:10px; overflow:auto; flex:1}
  .dlf-msg {margin:8px 0; font-size:14px; line-height:1.4}
  .dlf-msg.user {text-align:right}
  .dlf-bot {background:#F7F2FF; border-radius:10px; padding:8px}
  .dlf-input {display:flex; gap:6px; padding:10px; border-top:1px solid #eee}
  .dlf-input input {flex:1; padding:8px; border:1px solid #ddd; border-radius:8px}
  .dlf-input button {padding:8px 10px; border:0; background:#3F007E; color:#fff; border-radius:8px; cursor:pointer}
  .dlf-suggestions {display:flex; flex-wrap:wrap; gap:6px; margin-top:6px}
  .dlf-suggestions button {border:1px solid #ddd; background:#fff; border-radius:999px; padding:6px 10px; cursor:pointer}
  `;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.className = 'dlf-chat-launch';
  bubble.title = 'Chat';
  bubble.textContent = '💬';

  const panel = document.createElement('div');
  panel.className = 'dlf-chat';
  panel.innerHTML = `
    <div class="dlf-head">Chat with Delphine’s site bot</div>
    <div class="dlf-body"></div>
    <div class="dlf-input">
      <input type="text" placeholder="Ask about services, skills, projects..."/>
      <button>Send</button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  const body = panel.querySelector('.dlf-body');
  const input = panel.querySelector('input');
  const sendBtn = panel.querySelector('button');

  function addMsg(text, cls){
    const wrap = document.createElement('div');
    wrap.className = 'dlf-msg ' + (cls || '');
    const b = document.createElement('div');
    b.className = cls === 'user' ? '' : 'dlf-bot';
    b.innerHTML = text;
    wrap.appendChild(b);
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function addSuggestions(sugs){
    if(!sugs || !sugs.length) return;
    const row = document.createElement('div');
    row.className = 'dlf-suggestions';
    sugs.forEach(s => {
      const btn = document.createElement('button');
      btn.textContent = s;
      btn.onclick = () => {
        const label = s.trim();
        if (QUICK_ACTIONS[label]) {
          QUICK_ACTIONS[label]();
          addMsg(`Opened: <em>${label}</em>`, 'bot');
        } else {
          input.value = label;
          send();
        }
      };
      row.appendChild(btn);
    });
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }

  async function send(){
    const text = input.value.trim();
    if(!text) return;
    addMsg(text, 'user');
    input.value = '';
    addMsg('<em>Searching the site...</em>', 'bot');
    const loadingNode = body.lastElementChild;

    try{
      const res = await fetch(API, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: text, session_id: sessionId })
      });
      const data = await res.json();
      sessionId = data.session_id || sessionId;
      if (loadingNode) loadingNode.remove();
      addMsg(data.reply || 'I could not find a good answer. Try asking about services, skills, projects, publications, or resume.', 'bot');
      addSuggestions(data.suggestions);
    } catch(e) {
      if (loadingNode) loadingNode.remove();
      addMsg('Hmm, I could not reach the server. Please try again later.', 'bot');
    }
  }

  sendBtn.onclick = send;
  input.addEventListener('keydown', (e) => { if(e.key === 'Enter') send(); });

  bubble.onclick = () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && body.childElementCount === 0) {
      addMsg('Hi! I can help you find Delphine’s services, skills, portfolio projects, publications, resume, and Work with Me section.', 'bot');
      addSuggestions(Object.keys(QUICK_ACTIONS));
    }
  };
})();