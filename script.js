(function () {
  'use strict';

  // =====================================================================
  // CONSTANTES
  // =====================================================================
  const WORKOUT_STORAGE_KEY = 'protect_workout_session';

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
          { name: 'Overhead Press',        search: 'Overhead Press Barbell',  sets: 3, reps: '6-8'   },
          { name: 'Elevação Lateral Halter', search: 'Lateral Raise Dumbbell', sets: 3, reps: '12-15' },
          { name: 'Crucifixo Invertido',   search: 'Reverse Fly Dumbbell',    sets: 3, reps: '12-15' },
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
          { name: 'Leg Press Pesado',       search: 'Leg Press',    sets: 3, reps: '6-8'  },
          { name: 'Hack Squat Controlado',  search: 'Hack Squat',   sets: 2, reps: '8-10' },
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
  // ESTADO
  // =====================================================================
  let workoutSession = null;
  let timerInterval = null;

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
  async function createRoutinesInHevy() {
    const btn = document.getElementById('create-hevy-routines-btn');
    const statusEl = document.getElementById('hevy-routines-status');

    btn.disabled = true;
    statusEl.className = 'hevy-routines-status info';
    statusEl.textContent = 'Buscando exercícios no Hevy…';

    // Coletar exercícios únicos por search term
    const uniqueSearches = {};
    MY_ROUTINE.forEach(day => {
      day.groups.forEach(g => {
        g.exercises.forEach(ex => {
          if (!uniqueSearches[ex.search]) uniqueSearches[ex.search] = null;
        });
      });
    });

    // Buscar ID de cada exercício
    const notFound = [];
    const searchTerms = Object.keys(uniqueSearches);
    for (let i = 0; i < searchTerms.length; i++) {
      const term = searchTerms[i];
      statusEl.textContent = `Buscando exercício ${i + 1}/${searchTerms.length}: ${term}…`;
      try {
        const data = await hevyGet('/v1/exercise_templates?page=1&pageSize=5&search_term=' + encodeURIComponent(term));
        const items = toArr(data.exercise_templates || data.data || data);
        if (items.length) {
          uniqueSearches[term] = items[0].id;
        } else {
          notFound.push(term);
        }
      } catch (_) {
        notFound.push(term);
      }
    }

    // Construir mapa exercício por nome → template_id
    const exIdMap = {};
    MY_ROUTINE.forEach(day => {
      day.groups.forEach(g => {
        g.exercises.forEach(ex => {
          exIdMap[ex.name] = uniqueSearches[ex.search] || null;
        });
      });
    });

    // Criar as 4 rotinas no Hevy
    const created = [];
    const failed = [];
    for (const day of MY_ROUTINE) {
      statusEl.textContent = `Criando rotina ${day.day} – ${day.name}…`;
      const exercises = [];
      day.groups.forEach(g => {
        g.exercises.forEach(ex => {
          const tid = exIdMap[ex.name];
          if (!tid) return; // pular se não encontrou
          const repRange = parseReps(ex.reps);
          exercises.push({
            exercise_template_id: tid,
            superset_id: null,
            rest_seconds: 90,
            notes: null,
            sets: Array.from({ length: ex.sets }, () => ({
              type: 'normal',
              weight_kg: null,
              reps: repRange.start,
              rep_range: repRange,
              distance_meters: null,
              duration_seconds: null,
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
      } catch (err) {
        failed.push(day.day);
      }
    }

    // Resultado final
    btn.disabled = false;
    let msg = '';
    if (created.length) msg += '✓ Rotinas criadas: ' + created.join(', ') + '. ';
    if (failed.length)  msg += '✗ Falha: ' + failed.join(', ') + '. ';
    if (notFound.length) msg += 'Exercícios não encontrados: ' + notFound.join(', ') + '.';

    statusEl.className = 'hevy-routines-status ' + (failed.length ? 'warn' : 'ok');
    statusEl.textContent = msg || 'Concluído.';

    // Recarregar lista de rotinas
    if (created.length) document.getElementById('refresh-routines-btn').click();
  }

  document.getElementById('create-hevy-routines-btn').addEventListener('click', function () {
    if (!confirm('Criar as 4 rotinas (D1, D2, D3, D4) direto no seu Hevy? Isso vai adicionar novas rotinas à sua conta.')) return;
    createRoutinesInHevy();
  });

  // =====================================================================
  // RENDERIZAR GRADE DE ROTINA
  // =====================================================================
  function renderRoutineDays() {
    const grid = document.getElementById('routine-days-grid');
    grid.innerHTML = MY_ROUTINE.map(function (day, idx) {
      const totalEx = day.groups.reduce((n, g) => n + g.exercises.length, 0);
      const exList = day.groups.map(g =>
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
        const card = this.closest('.rday-card');
        const list = card.querySelector('.rday-exercises');
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

  function startWorkoutFromRoutine(dayIdx) {
    const day = MY_ROUTINE[dayIdx];
    workoutSession = {
      title: day.day + ' – ' + day.name,
      startTime: new Date().toISOString(),
      exercises: [],
      routineDayIdx: dayIdx,
    };
    saveSession();
    showWorkoutPanel();
    startTimer();
    renderRoutineReference(dayIdx);
  }

  function renderRoutineReference(dayIdx) {
    const panel = document.getElementById('routine-ref-panel');
    const list = document.getElementById('routine-ref-list');
    if (dayIdx == null) { panel.classList.add('hidden'); return; }
    const day = MY_ROUTINE[dayIdx];
    panel.classList.remove('hidden');
    list.innerHTML = day.groups.map(g =>
      '<div class="rref-group"><div class="rref-group-name">' + esc(g.name) + '</div>' +
      g.exercises.map(ex =>
        '<div class="rref-ex"><span>' + esc(ex.name) + '</span>' +
        '<span class="rref-sets">' + ex.sets + 'x ' + esc(ex.reps) + '</span></div>'
      ).join('') + '</div>'
    ).join('');
  }

  // =====================================================================
  // TREINOS RECENTES
  // =====================================================================
  document.getElementById('refresh-workouts-btn').addEventListener('click', function () {
    const el = document.getElementById('workouts-list');
    el.innerHTML = '<p class="loading-msg">Carregando treinos…</p>';
    hevyGet('/v1/workouts?page=1&pageSize=15').then(data => {
      const workouts = toArr(data.workouts || data.data || data);
      if (!workouts.length) { el.innerHTML = '<p class="empty">Nenhum treino encontrado.</p>'; return; }
      el.innerHTML = workouts.slice(0, 15).map(w => {
        const exs = toArr(w.exercises).slice(0, 4).map(e => e.title || '').filter(Boolean).join(', ');
        return '<div class="workout-item"><h3>' + esc(w.title || 'Treino') + '</h3>' +
          '<div class="meta">' + fmtDate(w.start_time) + '</div>' +
          (exs ? '<div class="ex-list">' + esc(exs) + '</div>' : '') + '</div>';
      }).join('');
    }).catch(err => { el.innerHTML = '<p class="error-msg">Erro: ' + esc(err.message) + '</p>'; });
  });

  // =====================================================================
  // ROTINAS DO HEVY
  // =====================================================================
  document.getElementById('refresh-routines-btn').addEventListener('click', function () {
    const el = document.getElementById('routines-list');
    el.innerHTML = '<p class="loading-msg">Carregando rotinas…</p>';
    hevyGet('/v1/routines?page=1&pageSize=30').then(data => {
      const routines = toArr(data.routines || data.data || data);
      if (!routines.length) { el.innerHTML = '<p class="empty">Nenhuma rotina encontrada.</p>'; return; }
      el.innerHTML = routines.map(r => {
        const n = toArr(r.exercises).length;
        return '<div class="routine-item"><h3>' + esc(r.title || 'Rotina') + '</h3>' +
          '<div class="meta">' + n + ' exercício(s)</div></div>';
      }).join('');
    }).catch(err => { el.innerHTML = '<p class="error-msg">Erro: ' + esc(err.message) + '</p>'; });
  });

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
    const now = new Date();
    const label = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) +
      ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    workoutSession = { title: 'Treino ' + label, startTime: now.toISOString(), exercises: [] };
    saveSession();
    showWorkoutPanel();
    startTimer();
  }

  function showWorkoutPanel() {
    document.getElementById('start-workout-card').classList.add('hidden');
    document.getElementById('active-workout-panel').classList.remove('hidden');
    document.getElementById('workout-title-input').value = workoutSession.title;
    renderExercises();
    if (workoutSession.routineDayIdx != null) renderRoutineReference(workoutSession.routineDayIdx);
  }

  function hideWorkoutPanel() {
    document.getElementById('active-workout-panel').classList.add('hidden');
    document.getElementById('start-workout-card').classList.remove('hidden');
    document.getElementById('routine-ref-panel').classList.add('hidden');
    stopTimer();
  }

  function startTimer() {
    const el = document.getElementById('workout-timer');
    function tick() {
      if (!workoutSession) return;
      const sec = Math.floor((Date.now() - new Date(workoutSession.startTime)) / 1000);
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
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

  document.getElementById('start-workout-btn').addEventListener('click', startWorkout);

  document.getElementById('workout-title-input').addEventListener('input', function () {
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
    btn.disabled = true;
    btn.textContent = 'Salvando…';

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
            weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : null,
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
      alert('Treino salvo no Hevy!');
      document.getElementById('refresh-workouts-btn').click();
    }).catch(err => {
      alert('Erro ao salvar: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Finalizar treino';
    });
  });

  // =====================================================================
  // RENDERIZAR EXERCÍCIOS DO TREINO ATIVO
  // =====================================================================
  function renderExercises() {
    const container = document.getElementById('workout-exercises-list');
    if (!workoutSession || !workoutSession.exercises.length) { container.innerHTML = ''; return; }
    container.innerHTML = workoutSession.exercises.map(ex => {
      const setsRows = ex.sets.map((s, idx) => {
        const opts = SET_TYPES.map(t =>
          '<option value="' + t.value + '"' + (s.type === t.value ? ' selected' : '') + '>' + t.label + '</option>'
        ).join('');
        return '<tr class="' + (s.completed ? 'set-completed' : '') + '" data-set-id="' + s.id + '">' +
          '<td><span class="set-num">' + (idx + 1) + '</span></td>' +
          '<td><select class="set-type-select" data-field="type">' + opts + '</select></td>' +
          '<td><input type="number" class="set-input" data-field="weight_kg" placeholder="kg" min="0" step="0.5" value="' + (s.weight_kg || '') + '"></td>' +
          '<td><input type="number" class="set-input" data-field="reps" placeholder="reps" min="0" step="1" value="' + (s.reps || '') + '"></td>' +
          '<td><button type="button" class="set-complete-btn' + (s.completed ? ' done' : '') + '">&#x2713;</button></td>' +
          '<td><button type="button" class="set-delete-btn">&#x2715;</button></td>' +
          '</tr>';
      }).join('');
      return '<div class="exercise-card" data-ex-id="' + ex.id + '">' +
        '<div class="exercise-card-header">' +
          '<span class="ex-name">' + esc(ex.title) + '</span>' +
          (ex.muscle ? '<span class="ex-muscle">' + esc(ex.muscle) + '</span>' : '') +
          '<button type="button" class="ex-delete">&#x2715;</button>' +
        '</div>' +
        '<div class="exercise-notes"><textarea class="ex-notes" rows="1" placeholder="Notas">' + esc(ex.notes || '') + '</textarea></div>' +
        '<table class="sets-table"><thead><tr><th>#</th><th>Tipo</th><th>Kg</th><th>Reps</th><th></th><th></th></tr></thead>' +
        '<tbody>' + setsRows + '</tbody></table>' +
        '<div class="add-set-row"><button type="button" class="add-set-btn">+ Série</button></div>' +
        '</div>';
    }).join('');

    // Eventos
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
        const exId = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) { ex.sets = ex.sets.filter(s => s.id !== setId); saveSession(); renderExercises(); }
      });
    });
    container.querySelectorAll('.set-complete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const setId = this.closest('tr').getAttribute('data-set-id');
        const exId = this.closest('.exercise-card').getAttribute('data-ex-id');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) { const s = ex.sets.find(s => s.id === setId); if (s) { s.completed = !s.completed; saveSession(); renderExercises(); } }
      });
    });
    container.querySelectorAll('.set-type-select, .set-input').forEach(input => {
      input.addEventListener('change', function () {
        const setId = this.closest('tr').getAttribute('data-set-id');
        const exId = this.closest('.exercise-card').getAttribute('data-ex-id');
        const field = this.getAttribute('data-field');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) { const s = ex.sets.find(s => s.id === setId); if (s) { s[field] = this.value; saveSession(); } }
      });
    });
  }

  // =====================================================================
  // MODAL: BUSCA DE EXERCÍCIO (filtro client-side)
  // =====================================================================

  // Tradução português → termos de busca em inglês
  const PT_EN = [
    ['pulldown aberto',       'lat pulldown'],
    ['pulldown unilateral',   'lat pulldown'],
    ['puxada',                'lat pulldown'],
    ['remada',                'row'],
    ['supino',                'bench press'],
    ['crucifixo inclinado',   'incline dumbbell fly'],
    ['crucifixo invertido',   'reverse fly'],
    ['crucifixo',             'fly'],
    ['elevação lateral',      'lateral raise'],
    ['desenvolvimento',       'overhead press'],
    ['overhead',              'overhead press'],
    ['agachamento',           'squat'],
    ['extensora',             'leg extension'],
    ['flexora',               'leg curl'],
    ['panturrilha',           'calf raise'],
    ['stiff',                 'romanian deadlift'],
    ['rosca',                 'curl'],
    ['tríceps',               'tricep'],
    ['triceps',               'tricep'],
    ['hack squat',            'hack squat'],
    ['leg press',             'leg press'],
    ['bulgarian',             'bulgarian'],
    ['straight arm',          'straight arm pulldown'],
    ['crossover',             'cable fly'],
    ['terra',                 'deadlift'],
    ['bíceps',                'bicep'],
    ['biceps',                'bicep'],
    ['peito',                 'chest'],
    ['costas',                'back'],
    ['ombro',                 'shoulder'],
  ];

  function ptToEn(q) {
    const lower = q.toLowerCase();
    for (const [pt, en] of PT_EN) {
      if (lower.includes(pt)) return en;
    }
    return lower;
  }

  // Cache de todos os exercícios (carregado uma vez)
  let allExercises = null;
  let loadingExercises = false;

  async function loadAllExercises(onProgress) {
    if (allExercises) return allExercises;
    if (loadingExercises) return null; // já carregando
    loadingExercises = true;
    allExercises = [];
    let page = 1;
    while (true) {
      onProgress && onProgress(allExercises.length);
      const data = await hevyGet('/v1/exercise_templates?page=' + page + '&pageSize=100');
      const items = toArr(data.exercise_templates || data.data || data);
      if (!items.length) break;
      allExercises = allExercises.concat(items);
      if (items.length < 100) break; // última página
      page++;
      if (page > 15) break; // limite de segurança: 1500 exercícios
    }
    loadingExercises = false;
    return allExercises;
  }

  function filterExercises(q) {
    if (!allExercises) return [];
    const term = ptToEn(q).toLowerCase();
    const original = q.toLowerCase();
    return allExercises.filter(ex => {
      const title = (ex.title || '').toLowerCase();
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
    const input = document.getElementById('exercise-search-input');
    const resultsEl = document.getElementById('exercise-results');
    input.value = '';
    resultsEl.innerHTML = '<p class="loading-msg">Carregando exercícios…</p>';
    document.getElementById('exercise-modal').classList.remove('hidden');
    input.focus();

    loadAllExercises(function (count) {
      if (!input.value) resultsEl.innerHTML = '<p class="loading-msg">Carregando… (' + count + ' carregados)</p>';
    }).then(function () {
      if (!input.value) resultsEl.innerHTML = '<p class="empty">Digite para buscar entre ' + (allExercises ? allExercises.length : 0) + ' exercícios.</p>';
    });
  });

  document.getElementById('close-exercise-modal').addEventListener('click', function () {
    document.getElementById('exercise-modal').classList.add('hidden');
  });

  document.getElementById('exercise-modal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
  });

  let exTimer = null;
  document.getElementById('exercise-search-input').addEventListener('input', function () {
    clearTimeout(exTimer);
    const q = this.value.trim();
    const el = document.getElementById('exercise-results');
    if (!q) {
      el.innerHTML = '<p class="empty">Digite para buscar.</p>';
      return;
    }
    if (!allExercises) {
      el.innerHTML = '<p class="loading-msg">Aguarde, carregando exercícios…</p>';
      return;
    }
    exTimer = setTimeout(() => renderExerciseResults(filterExercises(q)), 200);
  });

  function addExerciseToWorkout(templateId, title, muscle) {
    if (!workoutSession) return;
    workoutSession.exercises.push({
      id: uid(), template_id: templateId, title, muscle, notes: '',
      sets: [{ id: uid(), type: 'normal', weight_kg: '', reps: '', completed: false }],
    });
    saveSession();
    renderExercises();
    document.getElementById('exercise-modal').classList.add('hidden');
  }

  // =====================================================================
  // INICIALIZAÇÃO
  // =====================================================================
  renderRoutineDays();

  loadSession();
  if (workoutSession) {
    showWorkoutPanel();
    startTimer();
  }

})();
