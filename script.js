(function () {
  'use strict';

  const HEVY_KEY_STORAGE = 'hevy_api_key';
  const HEVY_API_BASE = window.HEVY_API_BASE || 'https://api.hevyapp.com';

  // Supabase
  const supabase = window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  function getHevyKey() {
    return localStorage.getItem(HEVY_KEY_STORAGE) || window.HEVY_API_KEY || '';
  }

  function setHevyKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(HEVY_KEY_STORAGE, key.trim());
      return true;
    }
    return false;
  }

  function hevyFetch(path, options = {}) {
    const key = getHevyKey();
    if (!key) return Promise.reject(new Error('Chave API Hevy não configurada.'));
    const url = path.startsWith('http') ? path : HEVY_API_BASE + path;
    const headers = {
      'Content-Type': 'application/json',
      'api-key': key,
      ...options.headers,
    };
    return fetch(url, { ...options, headers }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (body) {
          throw new Error(body.message || body.error || 'Erro Hevy: ' + res.status);
        }).catch(function () {
          throw new Error('Erro Hevy: ' + res.status);
        });
      }
      return res.json().catch(function () { return {}; });
    });
  }

  // --- Abas ---
  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      var panel = document.getElementById(tab);
      if (panel) panel.classList.add('active');
    });
  });

  // --- Hevy: salvar chave ---
  var inputKey = document.getElementById('hevy-api-key');
  var saveKeyBtn = document.getElementById('save-hevy-key');
  var hevyStatus = document.getElementById('hevy-status');

  if (inputKey) {
    inputKey.value = getHevyKey() ? '••••••••••••••••••••' : '';
    if (getHevyKey() && hevyStatus) {
      hevyStatus.textContent = 'Chave Hevy configurada. Clique em "Atualizar treinos".';
      hevyStatus.className = 'status success';
    }
  }

  if (saveKeyBtn && inputKey) {
    saveKeyBtn.addEventListener('click', function () {
      var key = inputKey.value.trim();
      // campo está mostrando placeholder mascarado — chave já salva, não faz nada
      if (/^[•]+$/.test(key)) {
        hevyStatus.textContent = 'Chave já salva no navegador.';
        hevyStatus.className = 'status success';
        return;
      }
      if (!key) {
        hevyStatus.textContent = 'Digite sua chave API Hevy.';
        hevyStatus.className = 'status error';
        return;
      }
      setHevyKey(key);
      inputKey.value = '••••••••••••••••••••';
      hevyStatus.textContent = 'Chave salva no navegador. Clique em "Atualizar treinos".';
      hevyStatus.className = 'status success';
    });
  }

  // --- Hevy: limpar chave ---
  var clearKeyBtn = document.getElementById('clear-hevy-key');
  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', function () {
      localStorage.removeItem(HEVY_KEY_STORAGE);
      if (inputKey) inputKey.value = '';
      if (hevyStatus) {
        hevyStatus.textContent = 'Chave removida. Cole uma nova chave e salve.';
        hevyStatus.className = 'status error';
      }
    });
  }

  // --- Hevy: listar treinos ---
  function renderWorkouts(list) {
    var el = document.getElementById('workouts-list');
    if (!el) return;
    if (!list || list.length === 0) {
      el.innerHTML = '<p class="empty">Nenhum treino encontrado.</p>';
      return;
    }
    el.innerHTML = list.slice(0, 30).map(function (w) {
      var start = w.start_time ? new Date(w.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      var exercises = (w.exercises || []).slice(0, 5).map(function (e) { return e.title || e.exercise_template_id; }).join(', ');
      if (exercises.length > 60) exercises = exercises.slice(0, 60) + '…';
      return '<div class="workout-item">' +
        '<h3>' + escapeHtml(w.title || 'Sem título') + '</h3>' +
        '<div class="meta">' + start + '</div>' +
        (exercises ? '<div class="exercises">' + escapeHtml(exercises) + '</div>' : '') +
        '</div>';
    }).join('');
  }

  function renderRoutines(list) {
    var el = document.getElementById('routines-list');
    if (!el) return;
    if (!list || list.length === 0) {
      el.innerHTML = '<p class="empty">Nenhuma rotina encontrada.</p>';
      return;
    }
    el.innerHTML = list.map(function (r) {
      var count = (r.exercises || []).length;
      return '<div class="routine-item">' +
        '<h3>' + escapeHtml(r.title || 'Sem título') + '</h3>' +
        '<div class="meta">' + count + ' exercício(s)</div>' +
        '</div>';
    }).join('');
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  document.getElementById('refresh-workouts').addEventListener('click', function () {
    var listEl = document.getElementById('workouts-list');
    var routinesEl = document.getElementById('routines-list');
    listEl.innerHTML = '<p class="loading">Carregando treinos…</p>';
    routinesEl.innerHTML = '<p class="loading">Carregando rotinas…</p>';

    hevyFetch('/v1/workouts?page=1&limit=20')
      .then(function (data) {
        var workouts = data.data || data.workouts || data || [];
        if (Array.isArray(workouts)) {
          renderWorkouts(workouts);
        } else {
          renderWorkouts(workouts.data || []);
        }
      })
      .catch(function (err) {
        listEl.innerHTML = '<p class="error-msg">' + escapeHtml(err.message) + '</p>';
      });

    hevyFetch('/v1/routines?page=1&limit=20')
      .then(function (data) {
        var routines = data.data || data.routines || data || [];
        if (Array.isArray(routines)) {
          renderRoutines(routines);
        } else {
          renderRoutines(routines.data || []);
        }
      })
      .catch(function (err) {
        routinesEl.innerHTML = '<p class="error-msg">' + escapeHtml(err.message) + '</p>';
      });
  });

  // --- Dieta: Supabase ---
  var dietForm = document.getElementById('diet-form');
  var dietList = document.getElementById('diet-list');
  var filterDate = document.getElementById('filter-date');
  var filterDietBtn = document.getElementById('filter-diet');
  var showAllDietBtn = document.getElementById('show-all-diet');

  var mealTypeLabels = {
    cafe: 'Café da manhã',
    lanche_manha: 'Lanche manhã',
    almoco: 'Almoço',
    lanche_tarde: 'Lanche tarde',
    jantar: 'Jantar',
    ceia: 'Ceia'
  };

  function loadDietEntries(dateFilter) {
    if (!supabase) {
      if (dietList) dietList.innerHTML = '<p class="error-msg">Supabase não configurado (config.js).</p>';
      return;
    }
    dietList.innerHTML = '<p class="loading">Carregando…</p>';
    var q = supabase.from('diet_entries').select('*').order('meal_date', { ascending: false }).order('created_at', { ascending: false });
    if (dateFilter) {
      q = q.eq('meal_date', dateFilter);
    }
    q.limit(100).then(function (_ref) {
      var data = _ref.data;
      var error = _ref.error;
      if (error) {
        dietList.innerHTML = '<p class="error-msg">' + escapeHtml(error.message) + '</p>';
        return;
      }
      renderDietList(data || []);
    });
  }

  function renderDietList(entries) {
    if (!dietList) return;
    if (!entries.length) {
      dietList.innerHTML = '<p class="empty">Nenhuma refeição registrada.</p>';
      return;
    }
    dietList.innerHTML = entries.map(function (e) {
      var date = e.meal_date ? new Date(e.meal_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
      var typeLabel = mealTypeLabels[e.meal_type] || e.meal_type;
      var cal = e.calories ? e.calories + ' kcal' : '';
      return '<div class="diet-item" data-id="' + escapeHtml(e.id) + '">' +
        '<h3>' + escapeHtml(typeLabel) + '</h3>' +
        '<div class="meta">' + date + '</div>' +
        '<div class="description">' + escapeHtml(e.description) + '</div>' +
        (cal ? '<div class="calories">' + cal + '</div>' : '') +
        '<div class="diet-item-actions"><button type="button" class="delete-diet" data-id="' + escapeHtml(e.id) + '">Excluir</button></div>' +
        '</div>';
    }).join('');

    dietList.querySelectorAll('.delete-diet').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (!id || !confirm('Excluir esta refeição?')) return;
        supabase.from('diet_entries').delete().eq('id', id).then(function (_ref2) {
          var error = _ref2.error;
          if (error) alert('Erro: ' + error.message);
          else loadDietEntries(filterDate && filterDate.value ? filterDate.value : null);
        });
      });
    });
  }

  if (dietForm && supabase) {
    dietForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var date = document.getElementById('meal-date').value;
      var type = document.getElementById('meal-type').value;
      var description = document.getElementById('meal-description').value.trim();
      var calories = document.getElementById('meal-calories').value;
      if (!date || !description) return;
      var row = {
        meal_date: date,
        meal_type: type,
        description: description,
        calories: calories ? parseInt(calories, 10) : null
      };
      supabase.from('diet_entries').insert(row).then(function (_ref3) {
        var error = _ref3.error;
        if (error) {
          alert('Erro ao salvar: ' + error.message);
          return;
        }
        document.getElementById('meal-description').value = '';
        document.getElementById('meal-calories').value = '';
        loadDietEntries(filterDate && filterDate.value ? filterDate.value : null);
      });
    });
  }

  if (filterDietBtn && filterDate) {
    filterDietBtn.addEventListener('click', function () {
      loadDietEntries(filterDate.value || null);
    });
  }
  if (showAllDietBtn) {
    showAllDietBtn.addEventListener('click', function () {
      if (filterDate) filterDate.value = '';
      loadDietEntries(null);
    });
  }

  // Data padrão no form = hoje
  var mealDateInput = document.getElementById('meal-date');
  if (mealDateInput) {
    var today = new Date().toISOString().slice(0, 10);
    mealDateInput.value = today;
  }

  loadDietEntries(null);
})();
