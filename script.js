(function () {
  'use strict';

  // =====================================================================
  // CONSTANTES
  // =====================================================================
  const WORKOUT_STORAGE_KEY  = 'protect_workout_session';
  const SETTINGS_STORAGE_KEY = 'protect_settings';

  const MY_ROUTINE = [
    {
      day: 'D1', name: 'Largura + Lateral', color: '#6366f1',
      groups: [
        { name: 'Costas Largura', exercises: [
          { name: 'Pulldown Aberto',       search: 'Lat Pulldown',               sets: 3, reps: '6-8'   },
          { name: 'Pulldown Unilateral',   search: 'Lat Pulldown Single Arm',    sets: 3, reps: '8-10'  },
          { name: 'Straight Arm Pulldown', search: 'Straight Arm Pulldown',      sets: 2, reps: '10-12' },
        ]},
        { name: 'Lateral (volume alto)', exercises: [
          { name: 'Elevação Lateral Halter', search: 'Lateral Raise Dumbbell',   sets: 4, reps: '12-15' },
          { name: 'Elevação Lateral Cabo',   search: 'Lateral Raise Cable',      sets: 3, reps: '12-15' },
        ]},
        { name: 'Peito (manutenção)', exercises: [
          { name: 'Supino Inclinado 15–30°',  search: 'Incline Bench Press Barbell', sets: 3, reps: '6-8'   },
          { name: 'Crucifixo Inclinado Leve', search: 'Incline Dumbbell Fly',        sets: 2, reps: '10-12' },
        ]},
      ],
    },
    {
      day: 'D2', name: 'Quad Sweep', color: '#22c55e',
      groups: [
        { name: 'Quadríceps', exercises: [
          { name: 'Hack Squat',                search: 'Hack Squat',              sets: 3, reps: '6-8'   },
          { name: 'Leg Press (pés baixos)',     search: 'Leg Press',               sets: 3, reps: '8-10'  },
          { name: 'Bulgarian Split Squat',      search: 'Bulgarian Split Squat',   sets: 2, reps: '8-10'  },
          { name: 'Extensora',                  search: 'Leg Extension',           sets: 3, reps: '12-15' },
          { name: 'Flexora',                    search: 'Leg Curl',                sets: 2, reps: '8-10'  },
        ]},
        { name: 'Panturrilha', exercises: [
          { name: 'Panturrilha', search: 'Calf Raise', sets: 3, reps: '12-15' },
        ]},
      ],
    },
    {
      day: 'D3', name: 'Espessura + Ombro 3D', color: '#f59e0b',
      groups: [
        { name: 'Costas Espessura', exercises: [
          { name: 'Remada Pesada',     search: 'Bent Over Row Barbell', sets: 3, reps: '6-8'  },
          { name: 'Remada Unilateral', search: 'Single Arm Row',        sets: 2, reps: '8-10' },
        ]},
        { name: 'Ombro', exercises: [
          { name: 'Overhead Press',          search: 'Overhead Press Barbell',  sets: 3, reps: '6-8'   },
          { name: 'Elevação Lateral Halter', search: 'Lateral Raise Dumbbell',  sets: 3, reps: '12-15' },
          { name: 'Crucifixo Invertido',     search: 'Reverse Fly Dumbbell',    sets: 3, reps: '12-15' },
        ]},
        { name: 'Peito + Tríceps', exercises: [
          { name: 'Supino Declinado / Convergente', search: 'Decline Bench Press Barbell', sets: 3, reps: '6-8'   },
          { name: 'Crossover de Cima para Baixo',  search: 'Cable Fly High',               sets: 2, reps: '10-12' },
          { name: 'Tríceps',                        search: 'Tricep Pushdown',              sets: 2, reps: '8-10'  },
        ]},
      ],
    },
    {
      day: 'D4', name: 'Densidade Perna + Posterior', color: '#a855f7',
      groups: [
        { name: 'Perna', exercises: [
          { name: 'Leg Press Pesado',      search: 'Leg Press',   sets: 3, reps: '6-8'  },
          { name: 'Hack Squat Controlado', search: 'Hack Squat',  sets: 2, reps: '8-10' },
        ]},
        { name: 'Posterior', exercises: [
          { name: 'Stiff / Romanian Deadlift', search: 'Romanian Deadlift', sets: 3, reps: '6-8'   },
          { name: 'Flexora',                   search: 'Leg Curl',          sets: 2, reps: '8-10'  },
          { name: 'Extensora',                 search: 'Leg Extension',     sets: 2, reps: '12-15' },
        ]},
        { name: 'Panturrilha', exercises: [
          { name: 'Panturrilha', search: 'Calf Raise', sets: 3, reps: '12-15' },
        ]},
      ],
    },
  ];

  const SET_TYPES = [
    { value: 'normal',  label: 'Normal' },
    { value: 'warmup',  label: 'Aquec.'  },
    { value: 'dropset', label: 'Drop'    },
    { value: 'failure', label: 'Falha'   },
  ];

  // =====================================================================
  // CONFIGURAÇÕES
  // =====================================================================
  const DEFAULT_SETTINGS = {
    theme: 'dark',
    units: 'kg',
    defaultRest: 90,
    sound: true,
    vibration: true,
    avatarUrl: '/avatar.svg',
  };

  let settings = Object.assign({}, DEFAULT_SETTINGS);

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (_) {}
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  // =====================================================================
  // TEMA (DARK / LIGHT)
  // =====================================================================
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) toggleBtn.textContent = isDark ? '🌙' : '☀️';
    const toggleCheck = document.getElementById('dark-mode-toggle');
    if (toggleCheck) toggleCheck.checked = isDark;
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', isDark ? '#0f0f12' : '#6366f1');
  }

  document.getElementById('theme-toggle-btn').addEventListener('click', function () {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(settings.theme);
    saveSettings();
  });

  document.getElementById('dark-mode-toggle').addEventListener('change', function () {
    settings.theme = this.checked ? 'dark' : 'light';
    applyTheme(settings.theme);
    saveSettings();
  });

  // =====================================================================
  // NAVEGAÇÃO INFERIOR
  // =====================================================================
  document.querySelectorAll('.bnav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const section = this.getAttribute('data-section');
      document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      const el = document.getElementById('section-' + section);
      if (el) el.classList.add('active');
    });
  });

  // Clicar no avatar leva para config
  document.getElementById('avatar-btn').addEventListener('click', function () {
    document.querySelector('.bnav-btn[data-section="config"]').click();
  });

  // =====================================================================
  // PERFIL / AVATAR
  // =====================================================================
  function applyAvatar(url) {
    document.getElementById('avatar-img').src = url;
    document.getElementById('settings-avatar-img').src = url;
  }

  document.getElementById('save-avatar-btn').addEventListener('click', function () {
    const url = document.getElementById('custom-avatar-url').value.trim();
    if (!url) return;
    settings.avatarUrl = url;
    saveSettings();
    applyAvatar(url);
    document.getElementById('custom-avatar-url').value = '';
    alert('Foto de perfil salva!');
  });

  // =====================================================================
  // UNIDADES (kg / lb)
  // =====================================================================
  function toDisplay(kgVal) {
    if (kgVal == null || kgVal === '') return '';
    const n = parseFloat(kgVal);
    if (isNaN(n)) return kgVal;
    if (settings.units === 'lb') return Math.round(n * 2.2046 * 4) / 4;
    return n;
  }

  function fromDisplay(val) {
    if (val == null || val === '') return '';
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    if (settings.units === 'lb') return Math.round((n / 2.2046) * 4) / 4;
    return n;
  }

  function unitLabel() { return settings.units === 'lb' ? 'lb' : 'kg'; }

  function applyUnitUI() {
    document.getElementById('unit-kg').classList.toggle('active', settings.units === 'kg');
    document.getElementById('unit-lb').classList.toggle('active', settings.units === 'lb');
    if (workoutSession) renderExercises();
  }

  document.querySelectorAll('[data-unit]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      settings.units = this.getAttribute('data-unit');
      saveSettings();
      applyUnitUI();
    });
  });

  // =====================================================================
  // DESCANSO PADRÃO
  // =====================================================================
  function applyRestUI() {
    const r = settings.defaultRest;
    document.querySelectorAll('[data-rest]').forEach(function (btn) {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-rest')) === r);
    });
    const descs = { 60: '1 minuto', 90: '1 minuto e 30 segundos', 120: '2 minutos', 180: '3 minutos' };
    const descEl = document.getElementById('global-rest-desc');
    if (descEl) descEl.textContent = descs[r] || r + ' segundos';
  }

  document.querySelectorAll('[data-rest]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      settings.defaultRest = parseInt(this.getAttribute('data-rest'));
      saveSettings();
      applyRestUI();
    });
  });

  // =====================================================================
  // SOM / VIBRAÇÃO
  // =====================================================================
  document.getElementById('sound-toggle').addEventListener('change', function () {
    settings.sound = this.checked;
    saveSettings();
  });

  document.getElementById('vibration-toggle').addEventListener('change', function () {
    settings.vibration = this.checked;
    saveSettings();
  });

  function applySoundVibrationUI() {
    document.getElementById('sound-toggle').checked = settings.sound;
    document.getElementById('vibration-toggle').checked = settings.vibration;
  }

  // =====================================================================
  // CALCULADORA DE ANILHAS
  // =====================================================================
  function calcPlates(target, bar) {
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
    let remaining = (target - bar) / 2;
    if (remaining < 0) return null;
    const result = [];
    for (const p of plates) {
      while (remaining >= p - 0.001) {
        result.push(p);
        remaining = Math.round((remaining - p) * 1000) / 1000;
      }
    }
    return result;
  }

  document.getElementById('calc-plates-btn').addEventListener('click', function () {
    const target = parseFloat(document.getElementById('plate-target').value);
    const bar    = parseFloat(document.getElementById('plate-bar').value) || 20;
    const resultEl = document.getElementById('plate-result');

    if (isNaN(target) || target <= 0) {
      resultEl.innerHTML = '<p class="error-msg">Informe uma carga válida.</p>';
      resultEl.classList.remove('hidden');
      return;
    }

    const plates = calcPlates(target, bar);
    if (!plates) {
      resultEl.innerHTML = '<p class="error-msg">Carga menor que a barra (' + bar + 'kg).</p>';
      resultEl.classList.remove('hidden');
      return;
    }

    // Agrupar por tamanho
    const counts = {};
    plates.forEach(function (p) { counts[p] = (counts[p] || 0) + 1; });

    const chips = Object.entries(counts).map(function ([p, n]) {
      return '<span class="plate-chip">' + n + '×' + p + 'kg</span>';
    }).join('');

    resultEl.innerHTML =
      '<div class="plate-result-title">Por lado (barra ' + bar + 'kg, total ' + target + 'kg):</div>' +
      '<div class="plate-chips"><span class="plate-chip bar">Barra</span>' + chips + '</div>';
    resultEl.classList.remove('hidden');
  });

  // =====================================================================
  // PWA INSTALL
  // =====================================================================
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('install-pwa-btn').classList.remove('hidden');
  });

  document.getElementById('install-pwa-btn').addEventListener('click', function () {
    if (!deferredInstallPrompt) {
      alert('Para instalar: use o menu do navegador → "Adicionar à tela inicial".');
      return;
    }
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(function () { deferredInstallPrompt = null; });
  });

  // Registrar service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  // =====================================================================
  // ESTADO DE TREINO
  // =====================================================================
  let workoutSession = null;
  let timerInterval  = null;

  // =====================================================================
  // UTILS
  // =====================================================================
  function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  function esc(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function toArr(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  function parseReps(repsStr) {
    const m = String(repsStr).match(/(\d+)[–\-](\d+)/);
    if (m) return { start: parseInt(m[1]), end: parseInt(m[2]) };
    const s = String(repsStr).match(/(\d+)/);
    if (s) return { start: parseInt(s[1]), end: parseInt(s[1]) };
    return { start: 10, end: 10 };
  }

  // =====================================================================
  // HEVY API (via proxy Vercel /api/hevy)
  // =====================================================================
  function hevyGet(path) {
    return fetch('/api/hevy?endpoint=' + encodeURIComponent(path))
      .then(r => r.json());
  }

  function hevyPost(path, body) {
    return fetch('/api/hevy?endpoint=' + encodeURIComponent(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json());
  }

  // =====================================================================
  // CRIAR ROTINAS NO HEVY
  // =====================================================================
  function findBestMatch(searchTerm) {
    if (!allExercises || !allExercises.length) return null;
    const term  = searchTerm.toLowerCase();
    const words = term.split(' ').filter(w => w.length > 2);

    let found = allExercises.find(ex => ex.title.toLowerCase().startsWith(term));
    if (found) return found;

    found = allExercises.find(ex => ex.title.toLowerCase().includes(term));
    if (found) return found;

    found = allExercises.find(ex => {
      const t = ex.title.toLowerCase();
      return words.every(w => t.includes(w));
    });
    if (found) return found;

    if (words.length > 1) {
      found = allExercises.find(ex => {
        const t = ex.title.toLowerCase();
        return words.filter(w => t.includes(w)).length >= Math.ceil(words.length * 0.6);
      });
    }
    return found || null;
  }

  async function createRoutinesInHevy() {
    const btn      = document.getElementById('create-hevy-routines-btn');
    const statusEl = document.getElementById('hevy-routines-status');

    btn.disabled = true;
    statusEl.className   = 'hevy-routines-status info';
    statusEl.textContent = 'Carregando lista de exercícios do Hevy…';
    statusEl.classList.remove('hidden');

    if (!allExercises) {
      await loadAllExercises(function (count) {
        statusEl.textContent = 'Carregando exercícios… (' + count + ' carregados)';
      });
    }

    statusEl.textContent = allExercises.length + ' exercícios carregados. Mapeando rotinas…';

    const exIdMap  = {};
    const notFound = [];
    MY_ROUTINE.forEach(day => {
      day.groups.forEach(g => {
        g.exercises.forEach(ex => {
          if (exIdMap[ex.name] !== undefined) return;
          const match = findBestMatch(ex.search);
          if (match) exIdMap[ex.name] = match.id;
          else { exIdMap[ex.name] = null; notFound.push(ex.name + ' (buscado: ' + ex.search + ')'); }
        });
      });
    });

    const created = [], failed = [];
    for (const day of MY_ROUTINE) {
      statusEl.textContent = 'Criando rotina ' + day.day + ' – ' + day.name + '…';
      const exercises = [];
      day.groups.forEach(g => {
        g.exercises.forEach(ex => {
          const tid = exIdMap[ex.name];
          if (!tid) return;
          const repRange = parseReps(ex.reps);
          exercises.push({
            exercise_template_id: tid,
            superset_id: null,
            rest_seconds: settings.defaultRest,
            notes: null,
            sets: Array.from({ length: ex.sets }, () => ({
              type: 'normal', weight_kg: null, reps: repRange.start,
              distance_meters: null, duration_seconds: null,
            })),
          });
        });
      });
      if (!exercises.length) { failed.push(day.day); continue; }
      try {
        const res = await hevyPost('/v1/routines', {
          routine: {
            title: day.day + ' – ' + day.name,
            folder_id: null,
            notes: 'Criado pelo Protect Training',
            exercises,
          },
        });
        if (res.error) failed.push(day.day + ' (' + (res.error.message || res.error) + ')');
        else created.push(day.day);
      } catch (_) { failed.push(day.day); }
    }

    btn.disabled = false;
    let msg = '';
    if (created.length)  msg += '✓ Rotinas criadas: ' + created.join(', ') + '. ';
    if (failed.length)   msg += '✗ Falha: ' + failed.join(', ') + '. ';
    if (notFound.length) msg += 'Não encontrados: ' + notFound.join(', ') + '.';
    statusEl.className   = 'hevy-routines-status ' + (failed.length ? 'warn' : 'ok');
    statusEl.textContent = msg || 'Concluído.';
  }

  document.getElementById('create-hevy-routines-btn').addEventListener('click', function () {
    if (!confirm('Criar as 4 rotinas (D1–D4) direto no seu Hevy?')) return;
    createRoutinesInHevy();
  });

  // =====================================================================
  // RENDERIZAR GRADE DE ROTINA
  // =====================================================================
  function renderRoutineDays() {
    const grid = document.getElementById('routine-days-grid');
    grid.innerHTML = MY_ROUTINE.map(function (day, idx) {
      const totalEx = day.groups.reduce((n, g) => n + g.exercises.length, 0);
      const exList  = day.groups.map(g =>
        '<div class="rday-group-name">' + esc(g.name) + '</div>' +
        g.exercises.map(ex =>
          '<div class="rday-ex"><span class="rday-ex-name">' + esc(ex.name) + '</span>' +
          '<span class="rday-ex-sets">' + ex.sets + 'x ' + esc(ex.reps) + '</span></div>'
        ).join('')
      ).join('');

      return '<div class="rday-card" style="--day-color:' + day.color + '">' +
        '<div class="rday-header">' +
          '<span class="rday-badge">' + esc(day.day) + '</span>' +
          '<span class="rday-name">' + esc(day.name) + '</span>' +
          '<span class="rday-count">' + totalEx + ' ex.</span>' +
        '</div>' +
        '<div class="rday-exercises hidden">' + exList + '</div>' +
        '<div class="rday-footer">' +
          '<button type="button" class="rday-toggle-btn">Ver exercícios</button>' +
          '<button type="button" class="rday-start-btn" data-idx="' + idx + '">Iniciar ' + esc(day.day) + '</button>' +
        '</div>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('.rday-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const card     = this.closest('.rday-card');
        const list     = card.querySelector('.rday-exercises');
        const expanded = !list.classList.contains('hidden');
        list.classList.toggle('hidden', expanded);
        this.textContent = expanded ? 'Ver exercícios' : 'Ocultar';
      });
    });

    grid.querySelectorAll('.rday-start-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        startWorkoutFromRoutine(parseInt(this.getAttribute('data-idx')));
      });
    });
  }

  async function startWorkoutFromRoutine(dayIdx) {
    const day = MY_ROUTINE[dayIdx];
    const btn = document.querySelector('.rday-start-btn[data-idx="' + dayIdx + '"]');
    const grid = document.getElementById('routine-days-grid');

    if (btn) { btn.disabled = true; btn.textContent = 'Carregando…'; }

    if (!allExercises) {
      const msg = document.createElement('p');
      msg.className = 'loading-msg'; msg.id = 'routine-load-msg';
      msg.textContent = 'Carregando exercícios do Hevy…';
      grid.prepend(msg);
      await loadAllExercises(function (count) {
        msg.textContent = 'Carregando… (' + count + ' encontrados)';
      });
      document.getElementById('routine-load-msg')?.remove();
    }

    const exercises = [];
    const notFound  = [];

    for (const g of day.groups) {
      for (const ex of g.exercises) {
        const match = findBestMatch(ex.search);
        if (!match) { notFound.push(ex.name); continue; }
        const repRange = parseReps(ex.reps);
        let lastSets = [], lastDate = null;
        try {
          const hist     = await fetchExerciseHistory(match.id);
          const sessions = groupBySession(hist);
          if (sessions.length) {
            const last = sessions[sessions.length - 1];
            lastDate   = last.date;
            lastSets   = last.sets
              .filter(s => s.set_type === 'normal' && s.weight_kg > 0)
              .map(s => ({ weight_kg: s.weight_kg, reps: s.reps || repRange.start }));
          }
        } catch (_) {}

        exercises.push({
          id: uid(),
          template_id: match.id,
          title: match.title,
          ptName: ex.name,
          muscle: match.primary_muscle_group || '',
          notes: '',
          lastDate,
          lastSets,
          restSeconds: settings.defaultRest,
          sets: Array.from({ length: ex.sets }, function (_, i) {
            const prev = lastSets[i] || lastSets[lastSets.length - 1] || null;
            return {
              id: uid(), type: 'normal',
              weight_kg: prev ? String(prev.weight_kg) : '',
              reps: prev ? String(prev.reps) : String(repRange.start),
              completed: false,
            };
          }),
        });
      }
    }

    workoutSession = {
      title: day.day + ' – ' + day.name,
      startTime: new Date().toISOString(),
      exercises,
      routineDayIdx: dayIdx,
    };
    saveSession();

    if (btn) { btn.disabled = false; btn.textContent = 'Iniciar ' + day.day; }

    // Navegar para aba treino
    document.querySelector('.bnav-btn[data-section="treino"]').click();
    showWorkoutPanel();
    startTimer();

    if (notFound.length) {
      alert('Exercícios não encontrados (adicione manualmente):\n• ' + notFound.join('\n• '));
    }
  }

  function renderRoutineReference(dayIdx) {
    const panel = document.getElementById('routine-ref-panel');
    if (dayIdx == null) { panel.classList.add('hidden'); return; }
    const day = MY_ROUTINE[dayIdx];
    panel.classList.remove('hidden');
    panel.innerHTML =
      '<div class="routine-ref-header">📋 Referência: ' + esc(day.day) + ' – ' + esc(day.name) + '</div>' +
      day.groups.map(g =>
        '<div class="rref-group"><div class="rref-group-name">' + esc(g.name) + '</div>' +
        g.exercises.map(ex =>
          '<div class="rref-ex"><span>' + esc(ex.name) + '</span>' +
          '<span class="rref-sets">' + ex.sets + 'x ' + esc(ex.reps) + '</span></div>'
        ).join('') + '</div>'
      ).join('');
  }

  // =====================================================================
  // SESSÃO DE TREINO
  // =====================================================================
  function saveSession() {
    if (workoutSession) localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workoutSession));
    else localStorage.removeItem(WORKOUT_STORAGE_KEY);
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(WORKOUT_STORAGE_KEY);
      if (raw) workoutSession = JSON.parse(raw);
    } catch (_) { workoutSession = null; }
  }

  function startWorkout() {
    const now   = new Date();
    const label = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) +
      ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    workoutSession = { title: 'Treino ' + label, startTime: now.toISOString(), exercises: [] };
    saveSession();
    showWorkoutPanel();
    startTimer();
  }

  function showWorkoutPanel() {
    document.getElementById('start-card').classList.add('hidden');
    document.getElementById('active-workout-panel').classList.remove('hidden');
    document.getElementById('workout-title').value = workoutSession.title;
    renderExercises();
    if (workoutSession.routineDayIdx != null) renderRoutineReference(workoutSession.routineDayIdx);
  }

  function hideWorkoutPanel() {
    document.getElementById('active-workout-panel').classList.add('hidden');
    document.getElementById('start-card').classList.remove('hidden');
    document.getElementById('routine-ref-panel').classList.add('hidden');
    stopTimer();
  }

  function startTimer() {
    const el = document.getElementById('workout-timer');
    function tick() {
      if (!workoutSession) return;
      const sec = Math.floor((Date.now() - new Date(workoutSession.startTime)) / 1000);
      const h   = Math.floor(sec / 3600);
      const m   = Math.floor((sec % 3600) / 60);
      const s   = sec % 60;
      el.textContent = (h ? String(h).padStart(2, '0') + ':' : '') +
        String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    tick();
    timerInterval = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    document.getElementById('workout-timer').textContent = '00:00';
  }

  document.getElementById('start-free-workout-btn').addEventListener('click', startWorkout);

  document.getElementById('workout-title').addEventListener('input', function () {
    if (workoutSession) { workoutSession.title = this.value; saveSession(); }
  });

  document.getElementById('discard-workout-btn').addEventListener('click', function () {
    if (!confirm('Descartar este treino? Nada será salvo.')) return;
    workoutSession = null;
    saveSession();
    hideWorkoutPanel();
  });

  document.getElementById('finish-workout-btn').addEventListener('click', function () {
    if (!workoutSession) return;
    const completed = workoutSession.exercises.flatMap(e => e.sets.filter(s => s.completed));
    if (!completed.length) { alert('Complete pelo menos uma série antes de finalizar.'); return; }

    const btn = this;
    btn.disabled = true; btn.textContent = 'Salvando…';

    hevyPost('/v1/workouts', {
      workout: {
        title: workoutSession.title || 'Treino',
        description: null,
        start_time: workoutSession.startTime,
        end_time: new Date().toISOString(),
        is_private: false,
        exercises: workoutSession.exercises.map(ex => ({
          exercise_template_id: ex.template_id,
          superset_id: null,
          notes: ex.notes || null,
          sets: ex.sets.filter(s => s.completed).map(s => ({
            type: s.type,
            weight_kg: s.weight_kg ? parseFloat(fromDisplay(s.weight_kg)) : null,
            reps: s.reps ? parseInt(s.reps) : null,
            distance_meters: null, duration_seconds: null, rpe: null,
          })),
        })),
      },
    }).then(res => {
      if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
      workoutSession = null;
      saveSession();
      hideWorkoutPanel();
      alert('Treino salvo no Hevy! 💪');
    }).catch(err => {
      alert('Erro ao salvar: ' + err.message);
      btn.disabled = false; btn.textContent = '✓ Finalizar';
    });
  });

  // =====================================================================
  // RENDERIZAR EXERCÍCIOS DO TREINO ATIVO
  // =====================================================================
  function renderExercises() {
    const container = document.getElementById('exercises-list');
    if (!workoutSession || !workoutSession.exercises.length) { container.innerHTML = ''; return; }

    const unitLbl = unitLabel();

    container.innerHTML = workoutSession.exercises.map(ex => {
      const restSec   = ex.restSeconds != null ? ex.restSeconds : settings.defaultRest;
      const restLabel = restSec === 0 ? 'Off' : (restSec >= 60
        ? Math.floor(restSec / 60) + 'm' + (restSec % 60 ? (restSec % 60) + 's' : '')
        : restSec + 's');

      const setsRows = ex.sets.map((s, idx) => {
        const opts    = SET_TYPES.map(t =>
          '<option value="' + t.value + '"' + (s.type === t.value ? ' selected' : '') + '>' + t.label + '</option>'
        ).join('');
        const prevSet = (ex.lastSets && (ex.lastSets[idx] || ex.lastSets[ex.lastSets.length - 1])) || null;
        const prevDisp = prevSet ? toDisplay(prevSet.weight_kg) : null;
        const prevBadge = prevSet
          ? '<span class="set-prev-badge">' + prevDisp + unitLbl + '×' + (prevSet.reps || '–') + '</span>'
          : '<span class="set-prev-badge set-prev-none">–</span>';

        const dispWeight = s.weight_kg ? toDisplay(s.weight_kg) : '';

        return '<tr class="' + (s.completed ? 'set-completed' : '') + '" data-set-id="' + s.id + '">' +
          '<td><span class="set-num">' + (idx + 1) + '</span></td>' +
          '<td><select class="set-type-select" data-field="type">' + opts + '</select></td>' +
          '<td class="set-prev-cell">' + prevBadge + '</td>' +
          '<td><input type="number" class="set-input" data-field="weight_kg" placeholder="' + unitLbl + '" min="0" step="0.5" value="' + dispWeight + '"></td>' +
          '<td><input type="number" class="set-input" data-field="reps" placeholder="reps" min="0" step="1" value="' + (s.reps || '') + '"></td>' +
          '<td><button type="button" class="set-complete-btn' + (s.completed ? ' done' : '') + '">&#x2713;</button></td>' +
          '<td><button type="button" class="set-delete-btn">&#x2715;</button></td>' +
          '</tr>';
      }).join('');

      return '<div class="exercise-card" data-ex-id="' + ex.id + '">' +
        '<div class="exercise-card-header">' +
          '<button type="button" class="rest-time-btn" data-seconds="' + restSec + '">⏱ ' + restLabel + '</button>' +
          '<div class="ex-name-block">' +
            '<span class="ex-name">' + esc(ex.ptName || ex.title) + '</span>' +
            (ex.ptName && ex.ptName !== ex.title ? '<span class="ex-name-en">' + esc(ex.title) + '</span>' : '') +
            (ex.lastSets && ex.lastSets.length
              ? '<span class="ex-last-session">Última (' +
                  new Date(ex.lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + '): ' +
                  ex.lastSets.map(s => toDisplay(s.weight_kg) + unitLbl + '×' + s.reps).join(' · ') +
                '</span>'
              : '<span class="ex-last-session ex-last-none">Sem histórico</span>') +
          '</div>' +
          (ex.muscle ? '<span class="ex-muscle">' + esc(ex.muscle) + '</span>' : '') +
          '<button type="button" class="ex-delete">&#x2715;</button>' +
        '</div>' +
        '<div class="exercise-notes"><textarea class="ex-notes" rows="1" placeholder="Notas">' + esc(ex.notes || '') + '</textarea></div>' +
        '<table class="sets-table"><thead><tr><th>#</th><th>Tipo</th><th>Ant.</th><th>' + unitLbl + '</th><th>Reps</th><th></th><th></th></tr></thead>' +
        '<tbody>' + setsRows + '</tbody></table>' +
        '<div class="add-set-row"><button type="button" class="add-set-btn">+ Série</button></div>' +
        '</div>';
    }).join('');

    // === EVENTOS ===
    container.querySelectorAll('.ex-delete').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.closest('.exercise-card').getAttribute('data-ex-id');
        workoutSession.exercises = workoutSession.exercises.filter(e => e.id !== id);
        saveSession(); renderExercises();
      });
    });

    container.querySelectorAll('.ex-notes').forEach(ta => {
      ta.addEventListener('input', function () {
        const id = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex = workoutSession.exercises.find(e => e.id === id);
        if (ex) { ex.notes = this.value; saveSession(); }
      });
    });

    container.querySelectorAll('.add-set-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex = workoutSession.exercises.find(e => e.id === id);
        if (ex) { ex.sets.push({ id: uid(), type: 'normal', weight_kg: '', reps: '', completed: false }); saveSession(); renderExercises(); }
      });
    });

    container.querySelectorAll('.set-delete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const setId = this.closest('tr').getAttribute('data-set-id');
        const exId  = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex    = workoutSession.exercises.find(e => e.id === exId);
        if (ex) { ex.sets = ex.sets.filter(s => s.id !== setId); saveSession(); renderExercises(); }
      });
    });

    container.querySelectorAll('.set-complete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const setId = this.closest('tr').getAttribute('data-set-id');
        const exId  = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex    = workoutSession.exercises.find(e => e.id === exId);
        if (!ex) return;
        const s = ex.sets.find(s => s.id === setId);
        if (!s) return;
        s.completed = !s.completed;
        saveSession(); renderExercises();
        if (s.completed) {
          const rest = ex.restSeconds != null ? ex.restSeconds : settings.defaultRest;
          if (rest > 0) startRestTimer(rest);
          if (settings.vibration && navigator.vibrate) navigator.vibrate([50]);
        }
      });
    });

    container.querySelectorAll('.rest-time-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const exId = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex   = workoutSession.exercises.find(e => e.id === exId);
        if (!ex) return;
        const options = [60, 90, 120, 180, 0];
        const cur  = ex.restSeconds != null ? ex.restSeconds : settings.defaultRest;
        ex.restSeconds = options[(options.indexOf(cur) + 1) % options.length];
        saveSession(); renderExercises();
      });
    });

    container.querySelectorAll('.set-type-select').forEach(input => {
      input.addEventListener('change', function () {
        const setId = this.closest('tr').getAttribute('data-set-id');
        const exId  = this.closest('.exercise-card').getAttribute('data-ex-id');
        const field = this.getAttribute('data-field');
        const ex    = workoutSession.exercises.find(e => e.id === exId);
        if (ex) { const s = ex.sets.find(s => s.id === setId); if (s) { s[field] = this.value; saveSession(); } }
      });
    });

    container.querySelectorAll('.set-input').forEach(input => {
      input.addEventListener('change', function () {
        const setId = this.closest('tr').getAttribute('data-set-id');
        const exId  = this.closest('.exercise-card').getAttribute('data-ex-id');
        const field = this.getAttribute('data-field');
        const ex    = workoutSession.exercises.find(e => e.id === exId);
        if (ex) {
          const s = ex.sets.find(s => s.id === setId);
          if (s) {
            // se campo de peso e unidade é lb, converter de volta para kg internamente
            s[field] = (field === 'weight_kg') ? String(fromDisplay(this.value)) : this.value;
            saveSession();
          }
        }
      });
    });
  }

  // =====================================================================
  // MODAL: BUSCA DE EXERCÍCIO (filtro client-side)
  // =====================================================================
  const PT_EN = [
    ['pulldown aberto',     'lat pulldown'],
    ['pulldown unilateral', 'lat pulldown'],
    ['puxada',              'lat pulldown'],
    ['remada',              'row'],
    ['supino',              'bench press'],
    ['crucifixo inclinado', 'incline dumbbell fly'],
    ['crucifixo invertido', 'reverse fly'],
    ['crucifixo',           'fly'],
    ['elevação lateral',    'lateral raise'],
    ['desenvolvimento',     'overhead press'],
    ['overhead',            'overhead press'],
    ['agachamento',         'squat'],
    ['extensora',           'leg extension'],
    ['flexora',             'leg curl'],
    ['panturrilha',         'calf raise'],
    ['stiff',               'romanian deadlift'],
    ['rosca',               'curl'],
    ['tríceps',             'tricep'],
    ['triceps',             'tricep'],
    ['hack squat',          'hack squat'],
    ['leg press',           'leg press'],
    ['bulgarian',           'bulgarian'],
    ['straight arm',        'straight arm pulldown'],
    ['crossover',           'cable fly'],
    ['terra',               'deadlift'],
    ['bíceps',              'bicep'],
    ['biceps',              'bicep'],
    ['peito',               'chest'],
    ['costas',              'back'],
    ['ombro',               'shoulder'],
  ];

  function ptToEn(q) {
    const lower = q.toLowerCase();
    for (const [pt, en] of PT_EN) { if (lower.includes(pt)) return en; }
    return lower;
  }

  let allExercises   = null;
  let loadingExercises = false;

  async function loadAllExercises(onProgress) {
    if (allExercises) return allExercises;
    if (loadingExercises) return null;
    loadingExercises = true;
    allExercises = [];
    let page = 1;
    while (true) {
      onProgress && onProgress(allExercises.length);
      const data  = await hevyGet('/v1/exercise_templates?page=' + page + '&pageSize=100');
      const items = toArr(data.exercise_templates || data.data || data);
      if (!items.length) break;
      allExercises = allExercises.concat(items);
      if (items.length < 100) break;
      page++;
      if (page > 15) break;
    }
    loadingExercises = false;
    return allExercises;
  }

  function filterExercises(q) {
    if (!allExercises) return [];
    const term     = ptToEn(q).toLowerCase();
    const original = q.toLowerCase();
    return allExercises.filter(ex => {
      const title  = (ex.title || '').toLowerCase();
      const muscle = (ex.primary_muscle_group || '').toLowerCase();
      return title.includes(term) || title.includes(original) || muscle.includes(original);
    }).slice(0, 30);
  }

  function renderExerciseResults(items) {
    const el = document.getElementById('exercise-results');
    if (!items.length) { el.innerHTML = '<p class="empty">Nenhum exercício encontrado.</p>'; return; }
    el.innerHTML = items.map(ex =>
      '<div class="exercise-result-item" data-id="' + esc(ex.id) + '" data-title="' + esc(ex.title) + '" data-muscle="' + esc(ex.primary_muscle_group || '') + '">' +
      '<span class="er-name">' + esc(ex.title) + '</span>' +
      (ex.primary_muscle_group ? '<span class="er-muscle">' + esc(ex.primary_muscle_group) + '</span>' : '') +
      '<button type="button" class="er-add">+ Add</button></div>'
    ).join('');
    el.querySelectorAll('.exercise-result-item').forEach(item => {
      item.addEventListener('click', function () {
        addExerciseToWorkout(this.getAttribute('data-id'), this.getAttribute('data-title'), this.getAttribute('data-muscle'));
      });
    });
  }

  document.getElementById('add-exercise-btn').addEventListener('click', function () {
    const input    = document.getElementById('exercise-search-input');
    const resultsEl = document.getElementById('exercise-results');
    input.value    = '';
    resultsEl.innerHTML = '<p class="loading-msg">Carregando exercícios…</p>';
    document.getElementById('exercise-modal').classList.remove('hidden');
    input.focus();
    loadAllExercises(function (count) {
      if (!input.value) resultsEl.innerHTML = '<p class="loading-msg">Carregando… (' + count + ')</p>';
    }).then(function () {
      if (!input.value) resultsEl.innerHTML = '<p class="empty">Digite para buscar entre ' + (allExercises ? allExercises.length : 0) + ' exercícios.</p>';
    });
  });

  document.getElementById('exercise-modal-close').addEventListener('click', function () {
    document.getElementById('exercise-modal').classList.add('hidden');
  });
  document.getElementById('exercise-modal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
  });

  let exTimer = null;
  document.getElementById('exercise-search-input').addEventListener('input', function () {
    clearTimeout(exTimer);
    const q  = this.value.trim();
    const el = document.getElementById('exercise-results');
    if (!q) { el.innerHTML = '<p class="empty">Digite para buscar.</p>'; return; }
    if (!allExercises) { el.innerHTML = '<p class="loading-msg">Aguarde, carregando exercícios…</p>'; return; }
    exTimer = setTimeout(() => renderExerciseResults(filterExercises(q)), 200);
  });

  function addExerciseToWorkout(templateId, title, muscle) {
    if (!workoutSession) return;
    workoutSession.exercises.push({
      id: uid(), template_id: templateId, title, muscle, notes: '',
      lastSets: [], lastDate: null, restSeconds: settings.defaultRest,
      sets: [{ id: uid(), type: 'normal', weight_kg: '', reps: '', completed: false }],
    });
    saveSession(); renderExercises();
    document.getElementById('exercise-modal').classList.add('hidden');
  }

  // =====================================================================
  // TIMER DE DESCANSO
  // =====================================================================
  let restInterval  = null;
  let restRemaining = 0;
  let restTotal     = 0;

  // Som de bip ao terminar o descanso
  function playBeep() {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 200, 400].forEach(function (delay) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.2);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.25);
      });
    } catch (_) {}
  }

  function startRestTimer(seconds) {
    clearInterval(restInterval);
    restRemaining = seconds;
    restTotal     = seconds;
    document.getElementById('rest-timer-panel').classList.remove('hidden');
    updateRestDisplay();
    restInterval = setInterval(function () {
      restRemaining--;
      updateRestDisplay();
      if (restRemaining <= 0) {
        clearInterval(restInterval);
        playBeep();
        if (settings.vibration && navigator.vibrate) navigator.vibrate([300, 100, 300]);
        setTimeout(function () {
          document.getElementById('rest-timer-panel').classList.add('hidden');
        }, 800);
      }
    }, 1000);
  }

  function updateRestDisplay() {
    const m = Math.floor(restRemaining / 60);
    const s = restRemaining % 60;
    document.getElementById('rest-timer-display').textContent =
      m > 0 ? m + ':' + String(s).padStart(2, '0') : s + 's';
    const pct = restTotal > 0 ? (restRemaining / restTotal) * 100 : 0;
    const bar = document.getElementById('rest-timer-bar');
    bar.style.width = pct + '%';
    bar.style.background = pct > 50 ? '#6366f1' : pct > 20 ? '#f59e0b' : '#ef4444';
  }

  document.getElementById('rest-skip-btn').addEventListener('click', function () {
    clearInterval(restInterval);
    document.getElementById('rest-timer-panel').classList.add('hidden');
  });
  document.getElementById('rest-minus-btn').addEventListener('click', function () {
    restRemaining = Math.max(0, restRemaining - 15);
    updateRestDisplay();
  });
  document.getElementById('rest-plus-btn').addEventListener('click', function () {
    restRemaining += 15;
    restTotal = Math.max(restTotal, restRemaining);
    updateRestDisplay();
  });

  // =====================================================================
  // EVOLUÇÃO & PROJEÇÃO DE CARGAS
  // =====================================================================
  let evoChartInstance = null;

  function fetchExerciseHistory(templateId) {
    return hevyGet('/v1/exercise_history/' + templateId + '?page=1&pageSize=200')
      .then(data => toArr(data.exercise_history || data.history || data.data || data));
  }

  function groupBySession(entries) {
    const map = {};
    entries.forEach(e => {
      if (!e.workout_id) return;
      if (!map[e.workout_id]) map[e.workout_id] = { date: e.workout_start_time, sets: [] };
      map[e.workout_id].sets.push(e);
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function calcProjection(sessions, repRange) {
    const normal = sessions.filter(s => s.sets.some(x => x.set_type === 'normal' && x.weight_kg > 0));
    if (!normal.length) return null;
    const last       = normal[normal.length - 1];
    const normalSets = last.sets.filter(s => s.set_type === 'normal' && s.weight_kg > 0 && s.reps > 0);
    if (!normalSets.length) return null;
    const maxWeight = Math.max(...normalSets.map(s => parseFloat(s.weight_kg) || 0));
    const avgReps   = normalSets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) / normalSets.length;
    let nextWeight = maxWeight, arrow = '→', tip = '';
    if (Math.round(avgReps) >= repRange.end) {
      const inc = maxWeight >= 60 ? 2.5 : 1.25;
      nextWeight = maxWeight + inc; arrow = '↑'; tip = '+' + inc + 'kg';
    } else if (Math.round(avgReps) >= repRange.start) {
      tip = 'Mais reps antes de aumentar';
    } else {
      tip = 'Foco na técnica';
    }
    const chartPoints = normal.map(s => {
      const best = s.sets.filter(x => x.set_type === 'normal' && x.weight_kg > 0 && x.reps > 0);
      if (!best.length) return null;
      const top = best.reduce((a, b) =>
        parseFloat(a.weight_kg) * (1 + a.reps / 30) >= parseFloat(b.weight_kg) * (1 + b.reps / 30) ? a : b
      );
      return { date: s.date, weight: parseFloat(top.weight_kg), reps: top.reps,
        e1rm: Math.round(parseFloat(top.weight_kg) * (1 + top.reps / 30)) };
    }).filter(Boolean);
    return { lastDate: last.date, lastWeight: maxWeight, lastReps: Math.round(avgReps), nextWeight, arrow, tip, chartPoints };
  }

  async function loadProjectionForDay(dayIdx) {
    const el = document.getElementById('projection-table');
    el.innerHTML = '<p class="loading-msg">Carregando histórico…</p>';
    if (!allExercises) { el.innerHTML = '<p class="loading-msg">Aguardando exercícios…</p>'; await loadAllExercises(); }
    const day  = MY_ROUTINE[dayIdx];
    const allExs = day.groups.flatMap(g => g.exercises);
    const rows = [];
    for (const ex of allExs) {
      const match = findBestMatch(ex.search);
      if (!match) { rows.push({ name: ex.name, error: 'Não mapeado' }); continue; }
      try {
        const history  = await fetchExerciseHistory(match.id);
        const sessions = groupBySession(history);
        const proj     = calcProjection(sessions, parseReps(ex.reps));
        rows.push({ name: ex.name, proj, repRange: ex.reps });
      } catch (_) { rows.push({ name: ex.name, error: 'Erro ao carregar' }); }
    }
    if (!rows.length) { el.innerHTML = '<p class="empty">Nenhum dado.</p>'; return; }
    el.innerHTML = '<table class="proj-table"><thead><tr><th>Exercício</th><th>Último</th><th>Sugestão</th><th>Range</th></tr></thead><tbody>' +
      rows.map(r => {
        if (r.error) return '<tr><td>' + esc(r.name) + '</td><td colspan="3" class="proj-na">' + esc(r.error) + '</td></tr>';
        if (!r.proj) return '<tr><td>' + esc(r.name) + '</td><td colspan="3" class="proj-na">Sem histórico</td></tr>';
        const cls = r.proj.arrow === '↑' ? 'proj-up' : 'proj-same';
        return '<tr><td class="proj-name">' + esc(r.name) + '</td>' +
          '<td class="proj-last">' + r.proj.lastWeight + 'kg × ' + r.proj.lastReps + '</td>' +
          '<td class="proj-next ' + cls + '">' + r.proj.arrow + ' ' + r.proj.nextWeight + 'kg</td>' +
          '<td class="proj-range">' + esc(r.repRange) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  document.getElementById('evo-day-select').addEventListener('change', function () {
    if (this.value === '') { document.getElementById('projection-table').innerHTML = ''; return; }
    loadProjectionForDay(parseInt(this.value));
  });

  function populateExerciseSelect() {
    const sel = document.getElementById('evo-day-select');
    MY_ROUTINE.forEach(function (day, idx) {
      const opt = document.createElement('option');
      opt.value = String(idx); opt.textContent = day.day + ' – ' + day.name;
      sel.appendChild(opt);
    });

    const exSel = document.getElementById('evo-exercise-select');
    MY_ROUTINE.forEach(function (day) {
      const grp = document.createElement('optgroup');
      grp.label = day.day + ' – ' + day.name;
      day.groups.forEach(function (g) {
        g.exercises.forEach(function (ex) {
          const opt = document.createElement('option');
          opt.value = ex.search; opt.textContent = ex.name;
          grp.appendChild(opt);
        });
      });
      exSel.appendChild(grp);
    });
  }

  async function loadEvolutionChart(searchTerm) {
    const wrap = document.getElementById('evo-chart-wrap');
    wrap.innerHTML = '<p class="loading-msg">Carregando dados…</p>';
    if (!allExercises) await loadAllExercises();
    const match = findBestMatch(searchTerm);
    if (!match) { wrap.innerHTML = '<p class="empty">Exercício não mapeado.</p>'; return; }
    let history;
    try { history = await fetchExerciseHistory(match.id); } catch (_) { wrap.innerHTML = '<p class="error-msg">Erro ao carregar histórico.</p>'; return; }
    const sessions = groupBySession(history);
    const proj     = calcProjection(sessions, { start: 6, end: 12 });
    if (!proj || !proj.chartPoints.length) { wrap.innerHTML = '<p class="empty">Sem histórico suficiente.</p>'; return; }
    wrap.innerHTML = '<canvas id="evo-chart" height="200"></canvas>';

    const pts      = proj.chartPoints.slice(-20);
    const labels   = pts.map(p => new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    const isDark   = settings.theme === 'dark';
    const gridCol  = isDark ? '#2d2d35' : '#e1e4e8';
    const tickCol  = isDark ? '#8888a0' : '#6b7280';

    if (evoChartInstance) evoChartInstance.destroy();
    const ctx = document.getElementById('evo-chart').getContext('2d');
    evoChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '1RM estimado (kg)',
            data: pts.map(p => p.e1rm),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.12)',
            fill: true, tension: 0.35, pointBackgroundColor: '#6366f1', pointRadius: 4,
          },
          {
            label: 'Carga máxima (kg)',
            data: pts.map(p => p.weight),
            borderColor: '#22c55e',
            backgroundColor: 'transparent',
            borderDash: [5, 4], tension: 0.35, pointBackgroundColor: '#22c55e', pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: tickCol, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.raw + ' kg' } },
        },
        scales: {
          x: { ticks: { color: tickCol, font: { size: 10 } }, grid: { color: gridCol } },
          y: { ticks: { color: tickCol, font: { size: 10 } }, grid: { color: gridCol } },
        },
      },
    });
  }

  document.getElementById('evo-exercise-select').addEventListener('change', function () {
    if (!this.value) { document.getElementById('evo-chart-wrap').innerHTML = '<canvas id="evo-chart" height="200"></canvas>'; return; }
    loadEvolutionChart(this.value);
  });

  // =====================================================================
  // INICIALIZAÇÃO
  // =====================================================================
  loadSettings();
  applyTheme(settings.theme);
  applyUnitUI();
  applyRestUI();
  applySoundVibrationUI();
  applyAvatar(settings.avatarUrl);
  populateExerciseSelect();
  renderRoutineDays();
  loadSession();
  if (workoutSession) { showWorkoutPanel(); startTimer(); }

})();
