/* NAV */
const pages = document.querySelectorAll('.page');
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.querySelector(a.getAttribute('href')).classList.add('active');
    if (a.getAttribute('href') === '#saved') renderSaved();
  });
});

/* GENERATOR */
let currentColors = [], copiedColors = [];
const nameTag = document.getElementById('paletteNameTag');
const NAMES = ["NUDE","SAND & STONE","SUNSET GLOW","OCEAN MIST","FOREST CALM","BLUSH BREEZE","EARTH TONES","LAVENDER HAZE"];

function hslToHex(h,s,l){
  s/=100; l/=100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h/30) % 12;
    const c = l - a * Math.max(Math.min(k-3, 9-k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function generateCohesive7(){
  const base = Math.random() * 360;
  const arr = [];
  for (let i=0;i<7;i++){
    const h = (base + (Math.random()*10 - 5) + 360) % 360;
    arr.push(hslToHex(h, 40 + Math.random()*25, 20 + i*10));
  }
  return arr;
}

function renderPalette(cols){
  const p = document.getElementById('palette'); p.innerHTML = ''; currentColors = cols;
  cols.forEach(c => {
    const d = document.createElement('div');
    d.className = 'swatch-vertical';
    d.style.background = c;
    d.innerHTML = `<div class="hex-chip">${c}</div>`;
    d.onclick = () => {
      navigator.clipboard.writeText(c);
      if (!copiedColors.includes(c)) copiedColors.push(c);
      alert(c + ' copied');
    };
    p.appendChild(d);
  });
}

function newName(){ nameTag.textContent = '— • ' + NAMES[Math.floor(Math.random()*NAMES.length)] + ' • —'; }
function generateAndRender(){ newName(); renderPalette(generateCohesive7()); }

document.getElementById('generateBtn').onclick = generateAndRender;
document.getElementById('tool-generate').onclick = () => { document.querySelector('a[href="#home"]').click(); generateAndRender(); };
document.getElementById('copyAllBtn').onclick = () => { if (!currentColors.length) return; navigator.clipboard.writeText(currentColors.join(', ')); alert('All copied!'); };

/* QUICKVIEW */
const quick = document.getElementById('quickView'), quickGrid = document.getElementById('quickGrid');
document.getElementById('openQuickBtn').onclick = () => {
  quickGrid.innerHTML = '';
  if (!copiedColors.length) {
    quickGrid.innerHTML = '<p>No copied colors yet.</p>';
  } else {
    copiedColors.forEach(c => {
      const a = document.createElement('div');
      a.className = 'arc';
      a.style.background = c;
      a.textContent = c;
      a.onclick = () => navigator.clipboard.writeText(c);
      quickGrid.appendChild(a);
    });
  }
  quick.classList.add('show');
};
document.getElementById('closeQuick').onclick = () => quick.classList.remove('show');

document.getElementById('saveBtn').onclick = () => {
  const nm = (document.getElementById('saveName').value || 'Saved Palette').trim();
  if (!copiedColors.length) return alert('Copy colors first!');
  const all = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
  all.push({ id: Date.now(), name: nm, colors: [...copiedColors], createdAt: new Date().toISOString() });
  localStorage.setItem('savedPalettes', JSON.stringify(all));
  alert('Saved ' + nm);
};

/* SAVED PAGE */
function renderSaved(){
  const all = (JSON.parse(localStorage.getItem('savedPalettes') || '[]') || []).reverse();
  const grid = document.getElementById('savedGrid'); grid.innerHTML = '';
  if (!all.length) { grid.innerHTML = '<p style="text-align:center">No saved palettes yet.</p>'; return; }
  all.forEach(item => {
    const card = document.createElement('div'); card.className = 'saved-card';
    const meta = document.createElement('div');
    meta.innerHTML = `<strong>${item.name}</strong><div style="font-size:12px;color:#6b5b53">${new Date(item.createdAt).toLocaleString()}</div>`;
    const sw = document.createElement('div'); sw.className = 'saved-swatches';
    item.colors.forEach(hex => {
      const chip = document.createElement('div'); chip.className = 'chip'; chip.style.background = hex; chip.title = hex;
      chip.onclick = () => navigator.clipboard.writeText(hex);
      sw.appendChild(chip);
    });
    const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.justifyContent='flex-end';
    const load = document.createElement('button'); load.className='btn btn-outline'; load.textContent='Load';
    load.onclick = () => { document.querySelector('a[href="#home"]').click(); nameTag.textContent = '— • ' + item.name + ' • —'; renderPalette(item.colors); };
    const del = document.createElement('button'); del.className='btn btn-danger'; del.textContent='Delete';
    del.onclick = () => { if (!confirm('Delete this palette?')) return; const rest = JSON.parse(localStorage.getItem('savedPalettes')||'[]').filter(x => x.id !== item.id); localStorage.setItem('savedPalettes', JSON.stringify(rest)); renderSaved(); };
    actions.append(load, del);
    card.append(meta, sw, actions); grid.appendChild(card);
  });
}
document.getElementById('refreshSavedBtn').onclick = renderSaved;
document.getElementById('clearAllSavedBtn').onclick = () => { if (confirm('Clear all saved palettes?')) { localStorage.removeItem('savedPalettes'); renderSaved(); } };

/* CONTRAST */
const contrastWrap = document.getElementById('contrastWrap');
document.getElementById('tool-contrast').onclick = () => { document.querySelector('a[href="#home"]').click(); contrastWrap.classList.toggle('show'); };
function relLum(hex){ const n = parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255; [r,g,b]=[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}); return r*.2126+g*.7152+b*.0722; }
function getContrast(a,b){ const L1 = relLum(a), L2 = relLum(b); return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05); }
document.getElementById('checkBtn').onclick = () => { const c1 = document.getElementById('c1').value, c2 = document.getElementById('c2').value; document.getElementById('contrastResult').textContent = 'Contrast ratio: ' + getContrast(c1,c2).toFixed(2) + ' : 1'; };

/* UPLOAD (K-MEANS) */
const uploadBtn = document.getElementById('tool-upload');
const pickImageBtn = document.getElementById('pickImageBtn');
const uploadInput = document.getElementById('uploadInput');
const uploadPalette = document.getElementById('uploadPalette');
const uploadMsg = document.getElementById('uploadMsg');

function setMsg(t, ok=false){
  if (!uploadMsg) return;
  uploadMsg.textContent = t;
  uploadMsg.classList.remove('error','ok');
  uploadMsg.classList.add(ok ? 'ok' : (t ? 'error' : ''));
}

uploadBtn.addEventListener('click', () => uploadInput.click());
pickImageBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', e => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  const link = document.querySelector('a[href="#upload"]'); if (link) link.click();
  setMsg('Reading image…'); uploadPalette.innerHTML = '';
  const url = URL.createObjectURL(file);
  const img = new Image(); img.crossOrigin = 'anonymous';

  img.onload = async () => {
    setMsg('Decoding & sampling…');
    try { if (img.decode) await img.decode(); } catch(_){}
    const MAX = 320;
    let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h){ setMsg('Could not read image size. Try a PNG or JPG.', false); URL.revokeObjectURL(url); return; }
    const scale = Math.min(1, MAX / Math.max(w,h)); w = Math.max(1, Math.round(w*scale)); h = Math.max(1, Math.round(h*scale));
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img,0,0,w,h);

    let data;
    try { const im = ctx.getImageData(0,0,w,h); data = im.data; } catch(err){ setMsg('⚠️ Browser blocked pixel read. Try PNG/JPG (not HEIC).', false); URL.revokeObjectURL(url); return; }

    const samples = []; const stride = 4*5;
    for (let i=0;i<data.length;i+=stride){
      const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
      if (a<10) continue; samples.push([r,g,b]);
      if (samples.length >= 2500) break;
    }
    if (!samples.length) { setMsg('No visible colors found...', false); URL.revokeObjectURL(url); return; }

    const k = 7, iters = 12;
    const centers = initKMeansPP(samples, k);
    kmeans(samples, centers, iters);

    const hexes = centers.map(c => toHex(c[0], c[1], c[2])).filter((v,i,self)=>self.indexOf(v)===i).slice(0,7);
    if (!hexes.length) { setMsg('Could not extract colors.', false); URL.revokeObjectURL(url); return; }

    uploadPalette.innerHTML = ''; currentColors = hexes;
    hexes.forEach(hex => {
      const sw = document.createElement('div');
      sw.className = 'swatch-vertical';
      sw.style.background = hex;
      sw.innerHTML = `<div class="hex-chip">${hex}</div>`;
      sw.title = 'Click to copy';
      sw.onclick = () => {
        navigator.clipboard.writeText(hex);
        if (!copiedColors.includes(hex)) copiedColors.push(hex);
        setMsg(`${hex} copied & added to Quick View.`, true);
      };
      uploadPalette.appendChild(sw);
    });
    setMsg('Extracted 7 dominant colors ✔', true);
    URL.revokeObjectURL(url);
  };

  img.onerror = () => { setMsg('Could not load this file. Use PNG/JPG/WEBP.', false); URL.revokeObjectURL(url); };
  img.src = url;
});

/* K-MEANS helpers */
function toHex(r,g,b){ const t = v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); return ('#'+t(r)+t(g)+t(b)).toUpperCase(); }
function dist2(a,b){ const dr=a[0]-b[0], dg=a[1]-b[1], db=a[2]-b[2]; return dr*dr+dg*dg+db*db; }
function mean(arr){ if(!arr.length) return [0,0,0]; let r=0,g=0,b=0; for(const p of arr){ r+=p[0]; g+=p[1]; b+=p[2]; } return [r/arr.length, g/arr.length, b/arr.length]; }
function initKMeansPP(data,k){
  const n=data.length, centers=[ data[Math.floor(Math.random()*n)] ];
  while(centers.length<k){
    const dists = data.map(p => centers.reduce((m,c)=>Math.min(m,dist2(p,c)), Infinity));
    const sum = dists.reduce((a,b)=>a+b,0);
    if (!sum){ while(centers.length<k) centers.push(data[Math.floor(Math.random()*n)]); break; }
    let r = Math.random()*sum, idx=0;
    for (let i=0;i<dists.length;i++){ r -= dists[i]; if (r <= 0){ idx = i; break; } }
    centers.push(data[idx]);
  }
  return centers.map(c => [...c]);
}
function kmeans(data, centers, iters){
  for (let it=0; it<iters; it++){
    const buckets = Array.from({length: centers.length}, ()=>[]);
    for (const p of data){
      let best=0, bestD=Infinity;
      for (let i=0;i<centers.length;i++){ const d = dist2(p, centers[i]); if (d < bestD){ bestD = d; best = i; } }
      buckets[best].push(p);
    }
    for (let i=0;i<centers.length;i++){ if (buckets[i].length) centers[i] = mean(buckets[i]); }
  }
}

/* AUTH (mock) */
const modal = document.getElementById('authModal'), loginBtn = document.getElementById('loginBtn'), logoutBtn = document.getElementById('logoutBtn');
const authTitle = document.getElementById('authTitle'), authName = document.getElementById('authName'), authEmail = document.getElementById('authEmail'), authPass = document.getElementById('authPass'), authSubmit = document.getElementById('authSubmit'), authToggle = document.getElementById('authToggle'), authClose = document.getElementById('authClose');
let isSignup = false;
function openAuth(){ modal.classList.add('show'); }
function closeAuth(){ modal.classList.remove('show'); }
loginBtn.onclick = openAuth; authClose.onclick = closeAuth;
authToggle.onclick = () => { isSignup = !isSignup; authTitle.textContent = isSignup ? 'Sign Up' : 'Login'; authSubmit.textContent = authTitle.textContent; authName.classList.toggle('hidden', !isSignup); authToggle.textContent = isSignup ? 'Already have an account? Login' : 'Don’t have an account? Sign up'; };
authSubmit.onclick = () => { if (!authEmail.value || !authPass.value) return alert('Enter credentials'); localStorage.setItem('user', authEmail.value); loginBtn.classList.add('hidden'); logoutBtn.classList.remove('hidden'); alert(isSignup ? 'Account created! (mock)' : 'Logged in! (mock)'); closeAuth(); };
logoutBtn.onclick = () => { localStorage.removeItem('user'); logoutBtn.classList.add('hidden'); loginBtn.classList.remove('hidden'); alert('Logged out'); };

/* INIT */
function init(){ newName(); renderPalette(generateCohesive7()); }
init();
