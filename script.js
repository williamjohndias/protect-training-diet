(function () {
  'use strict';

  // =====================================================================
  // CONSTANTES & ESTADO
  // =====================================================================
  const WORKOUT_STORAGE_KEY = 'protect_workout_session';

  const MEAL_LABELS = {
    cafe: 'Café da manhã',
    lanche_manha: 'Lanche manhã',
    almoco: 'Almoço',
    lanche_tarde: 'Lanche tarde',
    jantar: 'Jantar',
    ceia: 'Ceia',
  };
  const MEAL_ORDER = ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'];

  const SET_TYPES = [
    { value: 'normal',  label: 'Normal' },
    { value: 'warmup',  label: 'Aquec.' },
    { value: 'dropset', label: 'Drop'   },
    { value: 'failure', label: 'Falha'  },
  ];

  let workoutSession = null; // objeto com estado do treino ativo
  let timerInterval = null;
  let currentFoodData = null; // alimento selecionado para adicionar ao diário

  // =====================================================================
  // SUPABASE
  // =====================================================================
  const sb = window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  // =====================================================================
  // UTILS
  // =====================================================================
  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

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

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function toArr(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  function round1(n) {
    return Math.round((n || 0) * 10) / 10;
  }

  // =====================================================================
  // ABAS
  // =====================================================================
  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const panel = document.getElementById(tab);
      if (panel) panel.classList.add('active');
    });
  });

  // =====================================================================
  // HEVY API (via proxy Vercel)
  // =====================================================================
  function hevyGet(path) {
    return fetch('/api/hevy?endpoint=' + encodeURIComponent(path))
      .then(function (r) { return r.json(); });
  }

  function hevyPost(path, body) {
    return fetch('/api/hevy?endpoint=' + encodeURIComponent(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }

  // =====================================================================
  // CARREGAR TREINOS RECENTES
  // =====================================================================
  document.getElementById('refresh-workouts-btn').addEventListener('click', function () {
    const el = document.getElementById('workouts-list');
    el.innerHTML = '<p class="loading-msg">Carregando treinos…</p>';
    hevyGet('/v1/workouts?page=1&pageSize=15')
      .then(function (data) {
        const workouts = toArr(data.workouts || data.data || data);
        if (!workouts.length) { el.innerHTML = '<p class="empty">Nenhum treino encontrado.</p>'; return; }
        el.innerHTML = workouts.slice(0, 15).map(function (w) {
          const date = fmtDate(w.start_time);
          const exs = toArr(w.exercises).slice(0, 4).map(e => e.title || '').filter(Boolean).join(', ');
          return '<div class="workout-item"><h3>' + esc(w.title || 'Treino') + '</h3>' +
            '<div class="meta">' + date + '</div>' +
            (exs ? '<div class="ex-list">' + esc(exs) + '</div>' : '') +
            '</div>';
        }).join('');
      })
      .catch(function (err) {
        el.innerHTML = '<p class="error-msg">Erro: ' + esc(err.message) + '</p>';
      });
  });

  // =====================================================================
  // CARREGAR ROTINAS
  // =====================================================================
  document.getElementById('refresh-routines-btn').addEventListener('click', function () {
    const el = document.getElementById('routines-list');
    el.innerHTML = '<p class="loading-msg">Carregando rotinas…</p>';
    hevyGet('/v1/routines?page=1&pageSize=20')
      .then(function (data) {
        const routines = toArr(data.routines || data.data || data);
        if (!routines.length) { el.innerHTML = '<p class="empty">Nenhuma rotina.</p>'; return; }
        el.innerHTML = routines.map(function (r) {
          const n = toArr(r.exercises).length;
          return '<div class="routine-item"><h3>' + esc(r.title || 'Rotina') + '</h3>' +
            '<div class="meta">' + n + ' exercício(s)</div></div>';
        }).join('');
      })
      .catch(function (err) {
        el.innerHTML = '<p class="error-msg">Erro: ' + esc(err.message) + '</p>';
      });
  });

  // =====================================================================
  // SESSÃO DE TREINO
  // =====================================================================
  function saveSession() {
    if (workoutSession) {
      localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workoutSession));
    } else {
      localStorage.removeItem(WORKOUT_STORAGE_KEY);
    }
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
    workoutSession = {
      title: 'Treino ' + label,
      startTime: now.toISOString(),
      exercises: [],
    };
    saveSession();
    showWorkoutPanel();
    startTimer();
  }

  function showWorkoutPanel() {
    document.getElementById('start-workout-card').classList.add('hidden');
    document.getElementById('active-workout-panel').classList.remove('hidden');
    document.getElementById('workout-title-input').value = workoutSession.title;
    renderExercises();
  }

  function hideWorkoutPanel() {
    document.getElementById('active-workout-panel').classList.add('hidden');
    document.getElementById('start-workout-card').classList.remove('hidden');
    stopTimer();
  }

  function startTimer() {
    const timerEl = document.getElementById('workout-timer');
    function tick() {
      if (!workoutSession) return;
      const elapsed = Math.floor((Date.now() - new Date(workoutSession.startTime)) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      timerEl.textContent = (h > 0 ? String(h).padStart(2,'0') + ':' : '') +
        String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
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

  document.getElementById('finish-workout-btn').addEventListener('click', finishWorkout);

  function finishWorkout() {
    if (!workoutSession) return;
    const completedSets = workoutSession.exercises.flatMap(e =>
      e.sets.filter(s => s.completed)
    );
    if (!completedSets.length) {
      alert('Complete pelo menos uma série antes de finalizar.');
      return;
    }

    const btn = document.getElementById('finish-workout-btn');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    const endTime = new Date().toISOString();
    const payload = {
      workout: {
        title: workoutSession.title || 'Treino',
        description: '',
        start_time: workoutSession.startTime,
        end_time: endTime,
        is_private: false,
        exercises: workoutSession.exercises.map(function (ex, idx) {
          return {
            exercise_template_id: ex.template_id,
            superset_id: null,
            notes: ex.notes || '',
            sets: ex.sets.filter(s => s.completed).map(function (s) {
              return {
                type: s.type,
                weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : null,
                reps: s.reps ? parseInt(s.reps) : null,
                distance_meters: null,
                duration_seconds: null,
                rpe: null,
              };
            }),
          };
        }),
      },
    };

    hevyPost('/v1/workouts', payload)
      .then(function (res) {
        if (res.error) throw new Error(res.error);
        workoutSession = null;
        saveSession();
        hideWorkoutPanel();
        alert('Treino salvo no Hevy!');
        document.getElementById('refresh-workouts-btn').click();
      })
      .catch(function (err) {
        alert('Erro ao salvar: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Finalizar treino';
      });
  }

  // =====================================================================
  // RENDERIZAÇÃO DO TREINO ATIVO
  // =====================================================================
  function renderExercises() {
    const container = document.getElementById('workout-exercises-list');
    if (!workoutSession || !workoutSession.exercises.length) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = workoutSession.exercises.map(function (ex) {
      return renderExerciseCard(ex);
    }).join('');
    bindExerciseEvents(container);
  }

  function renderExerciseCard(ex) {
    const setsRows = ex.sets.map(function (s, idx) {
      const typeOptions = SET_TYPES.map(t =>
        '<option value="' + t.value + '"' + (s.type === t.value ? ' selected' : '') + '>' + t.label + '</option>'
      ).join('');
      const doneClass = s.completed ? ' done' : '';
      const rowClass = s.completed ? ' set-completed' : '';
      return '<tr class="' + rowClass + '" data-set-id="' + s.id + '">' +
        '<td><span class="set-num">' + (idx + 1) + '</span></td>' +
        '<td><select class="set-type-select" data-field="type">' + typeOptions + '</select></td>' +
        '<td><input type="number" class="set-input set-weight" data-field="weight_kg" placeholder="kg" min="0" step="0.5" value="' + (s.weight_kg || '') + '"></td>' +
        '<td><input type="number" class="set-input set-reps" data-field="reps" placeholder="reps" min="0" step="1" value="' + (s.reps || '') + '"></td>' +
        '<td><button type="button" class="set-complete-btn' + doneClass + '" title="Marcar">&#x2713;</button></td>' +
        '<td><button type="button" class="set-delete-btn" title="Remover">&#x2715;</button></td>' +
        '</tr>';
    }).join('');

    return '<div class="exercise-card" data-ex-id="' + ex.id + '">' +
      '<div class="exercise-card-header">' +
        '<span class="ex-name">' + esc(ex.title) + '</span>' +
        (ex.muscle ? '<span class="ex-muscle">' + esc(ex.muscle) + '</span>' : '') +
        '<button type="button" class="ex-delete" title="Remover exercício">&#x2715;</button>' +
      '</div>' +
      '<div class="exercise-notes"><textarea class="ex-notes" rows="1" placeholder="Notas (opcional)">' + esc(ex.notes || '') + '</textarea></div>' +
      '<table class="sets-table">' +
        '<thead><tr><th>#</th><th>Tipo</th><th>Kg</th><th>Reps</th><th></th><th></th></tr></thead>' +
        '<tbody>' + setsRows + '</tbody>' +
      '</table>' +
      '<div class="add-set-row"><button type="button" class="add-set-btn">+ Série</button></div>' +
      '</div>';
  }

  function bindExerciseEvents(container) {
    // Remover exercício
    container.querySelectorAll('.ex-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const card = this.closest('.exercise-card');
        const exId = card.getAttribute('data-ex-id');
        workoutSession.exercises = workoutSession.exercises.filter(e => e.id !== exId);
        saveSession();
        renderExercises();
      });
    });

    // Notas do exercício
    container.querySelectorAll('.ex-notes').forEach(function (ta) {
      ta.addEventListener('input', function () {
        const card = this.closest('.exercise-card');
        const exId = card.getAttribute('data-ex-id');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) { ex.notes = this.value; saveSession(); }
      });
    });

    // Adicionar série
    container.querySelectorAll('.add-set-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const card = this.closest('.exercise-card');
        const exId = card.getAttribute('data-ex-id');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) {
          ex.sets.push({ id: uid(), type: 'normal', weight_kg: '', reps: '', completed: false });
          saveSession();
          renderExercises();
        }
      });
    });

    // Remover série
    container.querySelectorAll('.set-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const row = this.closest('tr');
        const card = this.closest('.exercise-card');
        const exId = card.getAttribute('data-ex-id');
        const setId = row.getAttribute('data-set-id');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) {
          ex.sets = ex.sets.filter(s => s.id !== setId);
          saveSession();
          renderExercises();
        }
      });
    });

    // Marcar série como completa
    container.querySelectorAll('.set-complete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const row = this.closest('tr');
        const card = this.closest('.exercise-card');
        const exId = card.getAttribute('data-ex-id');
        const setId = row.getAttribute('data-set-id');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) {
          const s = ex.sets.find(s => s.id === setId);
          if (s) { s.completed = !s.completed; saveSession(); renderExercises(); }
        }
      });
    });

    // Atualizar campos das séries (sem re-renderizar)
    container.querySelectorAll('.set-type-select, .set-input').forEach(function (input) {
      input.addEventListener('change', function () {
        const row = this.closest('tr');
        const card = this.closest('.exercise-card');
        const exId = card.getAttribute('data-ex-id');
        const setId = row.getAttribute('data-set-id');
        const field = this.getAttribute('data-field');
        const ex = workoutSession.exercises.find(e => e.id === exId);
        if (ex) {
          const s = ex.sets.find(s => s.id === setId);
          if (s) { s[field] = this.value; saveSession(); }
        }
      });
    });
  }

  // =====================================================================
  // MODAL: BUSCA DE EXERCÍCIO
  // =====================================================================
  document.getElementById('add-exercise-btn').addEventListener('click', function () {
    document.getElementById('exercise-search-input').value = '';
    document.getElementById('exercise-results').innerHTML = '';
    document.getElementById('exercise-modal').classList.remove('hidden');
    document.getElementById('exercise-search-input').focus();
  });

  document.getElementById('close-exercise-modal').addEventListener('click', function () {
    document.getElementById('exercise-modal').classList.add('hidden');
  });

  document.getElementById('exercise-modal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
  });

  let exSearchTimer = null;
  document.getElementById('exercise-search-input').addEventListener('input', function () {
    clearTimeout(exSearchTimer);
    const q = this.value.trim();
    if (!q) { document.getElementById('exercise-results').innerHTML = ''; return; }
    exSearchTimer = setTimeout(() => searchExercises(q), 350);
  });

  function searchExercises(q) {
    const el = document.getElementById('exercise-results');
    el.innerHTML = '<p class="loading-msg">Buscando…</p>';
    hevyGet('/v1/exercise_templates?page=1&pageSize=20&search_term=' + encodeURIComponent(q))
      .then(function (data) {
        const items = toArr(data.exercise_templates || data.data || data);
        if (!items.length) { el.innerHTML = '<p class="empty">Nenhum exercício encontrado.</p>'; return; }
        el.innerHTML = items.map(function (ex) {
          return '<div class="exercise-result-item" data-id="' + esc(ex.id) + '" data-title="' + esc(ex.title) + '" data-muscle="' + esc(ex.primary_muscle_group || '') + '">' +
            '<span class="er-name">' + esc(ex.title) + '</span>' +
            (ex.primary_muscle_group ? '<span class="er-muscle">' + esc(ex.primary_muscle_group) + '</span>' : '') +
            '<button type="button" class="er-add">+ Add</button>' +
            '</div>';
        }).join('');
        el.querySelectorAll('.exercise-result-item').forEach(function (item) {
          item.addEventListener('click', function () {
            addExerciseToWorkout(
              this.getAttribute('data-id'),
              this.getAttribute('data-title'),
              this.getAttribute('data-muscle')
            );
          });
        });
      })
      .catch(function () { el.innerHTML = '<p class="error-msg">Erro ao buscar exercícios.</p>'; });
  }

  function addExerciseToWorkout(templateId, title, muscle) {
    if (!workoutSession) return;
    workoutSession.exercises.push({
      id: uid(),
      template_id: templateId,
      title: title,
      muscle: muscle,
      notes: '',
      sets: [{ id: uid(), type: 'normal', weight_kg: '', reps: '', completed: false }],
    });
    saveSession();
    renderExercises();
    document.getElementById('exercise-modal').classList.add('hidden');
  }

  // =====================================================================
  // FATSECRET — BUSCA DE ALIMENTOS
  // =====================================================================
  function fsSearch(method, params) {
    return fetch('/api/fatsecret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, ...params }),
    }).then(r => r.json());
  }

  function doFoodSearch() {
    const q = document.getElementById('food-search-input').value.trim();
    if (!q) return;
    const el = document.getElementById('food-results');
    el.innerHTML = '<p class="loading-msg">Buscando alimentos…</p>';
    fsSearch('foods.search', { search_expression: q, max_results: '10', page_number: '0', language: 'pt', region: 'BR' })
      .then(function (data) {
        if (data.error) throw new Error(data.error);
        const foods = toArr((data.foods || {}).food);
        if (!foods.length) { el.innerHTML = '<p class="empty">Nenhum alimento encontrado.</p>'; return; }
        el.innerHTML = foods.map(function (food) {
          const servings = toArr((food.servings || {}).serving);
          const s = servings[0] || {};
          const kcal = s.calories ? Math.round(s.calories) + ' kcal' : '';
          const desc = s.serving_description || '';
          const macros = [
            s.protein ? 'P:' + round1(s.protein) + 'g' : '',
            s.carbohydrate ? 'C:' + round1(s.carbohydrate) + 'g' : '',
            s.fat ? 'G:' + round1(s.fat) + 'g' : '',
          ].filter(Boolean).join(' · ');
          return '<div class="food-card">' +
            '<div class="food-card-info">' +
              '<div class="food-card-name" title="' + esc(food.food_name) + '">' + esc(food.food_name) + '</div>' +
              '<div class="food-card-sub">' + esc(desc) + (macros ? ' · ' + macros : '') + '</div>' +
            '</div>' +
            '<span class="food-card-kcal">' + kcal + '</span>' +
            '<button type="button" class="food-add-btn" title="Adicionar ao diário" data-food=\'' + escFoodAttr(food) + '\'>+</button>' +
            '</div>';
        }).join('');
        el.querySelectorAll('.food-add-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            try {
              const food = JSON.parse(this.getAttribute('data-food'));
              openAddFoodModal(food);
            } catch (_) {}
          });
        });
      })
      .catch(function (err) {
        el.innerHTML = '<p class="error-msg">Erro: ' + esc(err.message) + '</p>';
      });
  }

  function escFoodAttr(food) {
    return JSON.stringify(food).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }

  document.getElementById('food-search-btn').addEventListener('click', doFoodSearch);
  document.getElementById('food-search-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doFoodSearch();
  });

  // =====================================================================
  // MODAL: ADICIONAR ALIMENTO AO DIÁRIO
  // =====================================================================
  function openAddFoodModal(food) {
    currentFoodData = food;
    document.getElementById('add-food-modal-title').textContent = food.food_name || 'Adicionar ao diário';

    // Preencher select de porções
    const servings = toArr((food.servings || {}).serving);
    const servSelect = document.getElementById('add-food-serving-select');
    servSelect.innerHTML = servings.map(function (s, i) {
      return '<option value="' + i + '">' + esc(s.serving_description || 'Porção ' + (i + 1)) + '</option>';
    }).join('');

    document.getElementById('add-food-qty-input').value = '1';
    updateNutritionPreview();
    document.getElementById('add-food-modal').classList.remove('hidden');
  }

  function updateNutritionPreview() {
    if (!currentFoodData) return;
    const servings = toArr((currentFoodData.servings || {}).serving);
    const idx = parseInt(document.getElementById('add-food-serving-select').value) || 0;
    const s = servings[idx] || {};
    const qty = parseFloat(document.getElementById('add-food-qty-input').value) || 1;
    const kcal = round1((parseFloat(s.calories) || 0) * qty);
    const prot = round1((parseFloat(s.protein) || 0) * qty);
    const carb = round1((parseFloat(s.carbohydrate) || 0) * qty);
    const fat  = round1((parseFloat(s.fat) || 0) * qty);
    document.getElementById('add-food-nutrition-preview').innerHTML =
      '<div class="np-item"><span class="np-value">' + kcal + '</span><span class="np-label">kcal</span></div>' +
      '<div class="np-item"><span class="np-value">' + prot + 'g</span><span class="np-label">proteína</span></div>' +
      '<div class="np-item"><span class="np-value">' + carb + 'g</span><span class="np-label">carbs</span></div>' +
      '<div class="np-item"><span class="np-value">' + fat + 'g</span><span class="np-label">gordura</span></div>';
  }

  document.getElementById('add-food-serving-select').addEventListener('change', updateNutritionPreview);
  document.getElementById('add-food-qty-input').addEventListener('input', updateNutritionPreview);

  document.getElementById('close-food-modal').addEventListener('click', function () {
    document.getElementById('add-food-modal').classList.add('hidden');
    currentFoodData = null;
  });

  document.getElementById('add-food-modal').addEventListener('click', function (e) {
    if (e.target === this) { this.classList.add('hidden'); currentFoodData = null; }
  });

  document.getElementById('confirm-add-food-btn').addEventListener('click', function () {
    if (!currentFoodData || !sb) { alert('Supabase não configurado.'); return; }
    const servings = toArr((currentFoodData.servings || {}).serving);
    const idx = parseInt(document.getElementById('add-food-serving-select').value) || 0;
    const s = servings[idx] || {};
    const qty = parseFloat(document.getElementById('add-food-qty-input').value) || 1;
    const mealType = document.getElementById('add-food-meal-type').value;
    const diaryDate = document.getElementById('diary-date-input').value || today();

    const row = {
      diary_date: diaryDate,
      meal_type: mealType,
      food_id: String(currentFoodData.food_id || ''),
      food_name: currentFoodData.food_name || '',
      serving_description: s.serving_description || '',
      quantity: qty,
      calories: round1((parseFloat(s.calories) || 0) * qty),
      protein: round1((parseFloat(s.protein) || 0) * qty),
      carbs: round1((parseFloat(s.carbohydrate) || 0) * qty),
      fat: round1((parseFloat(s.fat) || 0) * qty),
    };

    const btn = document.getElementById('confirm-add-food-btn');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    sb.from('food_diary').insert(row).then(function ({ error }) {
      btn.disabled = false;
      btn.textContent = 'Adicionar ao diário';
      if (error) { alert('Erro: ' + error.message); return; }
      document.getElementById('add-food-modal').classList.add('hidden');
      currentFoodData = null;
      loadDiary(diaryDate);
    });
  });

  // =====================================================================
  // DIÁRIO ALIMENTAR (SUPABASE)
  // =====================================================================
  function loadDiary(date) {
    if (!sb) {
      document.getElementById('diary-list').innerHTML = '<p class="error-msg">Supabase não configurado.</p>';
      return;
    }
    const el = document.getElementById('diary-list');
    el.innerHTML = '<p class="loading-msg">Carregando…</p>';
    sb.from('food_diary').select('*').eq('diary_date', date).order('created_at').then(function ({ data, error }) {
      if (error) { el.innerHTML = '<p class="error-msg">' + esc(error.message) + '</p>'; return; }
      renderDiary(data || []);
    });
  }

  function renderDiary(entries) {
    const el = document.getElementById('diary-list');
    const totalsEl = document.getElementById('macro-totals');
    if (!entries.length) {
      el.innerHTML = '<p class="empty">Nenhuma refeição registrada. Busque um alimento acima.</p>';
      totalsEl.classList.add('hidden');
      return;
    }

    // Totais
    const totals = entries.reduce(function (acc, e) {
      acc.kcal += e.calories || 0;
      acc.prot += e.protein || 0;
      acc.carbs += e.carbs || 0;
      acc.fat += e.fat || 0;
      return acc;
    }, { kcal: 0, prot: 0, carbs: 0, fat: 0 });

    document.getElementById('total-kcal').textContent = Math.round(totals.kcal);
    document.getElementById('total-protein').textContent = round1(totals.prot) + 'g';
    document.getElementById('total-carbs').textContent = round1(totals.carbs) + 'g';
    document.getElementById('total-fat').textContent = round1(totals.fat) + 'g';
    totalsEl.classList.remove('hidden');

    // Agrupar por refeição
    const grouped = {};
    entries.forEach(function (e) {
      if (!grouped[e.meal_type]) grouped[e.meal_type] = [];
      grouped[e.meal_type].push(e);
    });

    el.innerHTML = MEAL_ORDER.filter(k => grouped[k]).map(function (mealKey) {
      const items = grouped[mealKey];
      const rows = items.map(function (e) {
        const sub = (e.quantity !== 1 ? e.quantity + ' × ' : '') + (e.serving_description || '');
        return '<div class="diary-entry" data-id="' + esc(e.id) + '">' +
          '<div class="diary-entry-info">' +
            '<div class="diary-entry-name" title="' + esc(e.food_name) + '">' + esc(e.food_name) + '</div>' +
            (sub ? '<div class="diary-entry-sub">' + esc(sub) + '</div>' : '') +
          '</div>' +
          '<span class="diary-entry-kcal">' + Math.round(e.calories || 0) + ' kcal</span>' +
          '<button type="button" class="diary-delete-btn" data-id="' + esc(e.id) + '">&#x2715;</button>' +
          '</div>';
      }).join('');
      return '<div class="diary-meal-group">' +
        '<div class="diary-meal-title">' + esc(MEAL_LABELS[mealKey] || mealKey) + '</div>' +
        rows + '</div>';
    }).join('');

    el.querySelectorAll('.diary-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        if (!confirm('Remover esta entrada?')) return;
        sb.from('food_diary').delete().eq('id', id).then(function ({ error }) {
          if (error) alert('Erro: ' + error.message);
          else loadDiary(document.getElementById('diary-date-input').value || today());
        });
      });
    });
  }

  document.getElementById('diary-date-input').addEventListener('change', function () {
    loadDiary(this.value || today());
  });

  // =====================================================================
  // INICIALIZAÇÃO
  // =====================================================================
  // Definir data de hoje no input
  const diaryInput = document.getElementById('diary-date-input');
  diaryInput.value = today();
  diaryInput.max = today();

  // Restaurar sessão de treino se havia uma ativa
  loadSession();
  if (workoutSession) {
    showWorkoutPanel();
    startTimer();
  }

  // Carregar diário do dia
  if (sb) loadDiary(today());

})();
