// ========== DOM 元素 ==========
function $(id){ return document.getElementById(id); }
var pokeType1 = $('pokeType1'), pokeType2 = $('pokeType2');
var atkInput = $('atk'), spaInput = $('spa');
var weatherSel = $('weather');
var customWeather = $('customWeather');
var customWeatherType1 = $('customWeatherType1');
var customWeatherType2 = $('customWeatherType2');
var crossMultInput = $('crossMult');
var weatherMultInput = $('weatherMult');
var moveList = $('moveList');
var moveCount = $('moveCount');
var addMoveBtn = $('addMove');
var clearAllBtn = $('clearAll');
var expandAllBtn = $('expandAll');
var moveSearch = $('moveSearch');
var searchResults = $('searchResults');
var enemySetsDiv = $('enemySets');
var addEnemySetBtn = $('addEnemySet');
var autoRecommendBtn = $('autoRecommend');
var buffFirst = $('buffFirst');
var calcCurrentBtn = $('calcCurrent');
var calcBestBtn = $('calcBest');
var resultsDiv = $('results');
var pasteInput = $('pasteInput');
var parsePasteBtn = $('parsePaste');
var clearPasteBtn = $('clearPaste');

var MAX_MOVES = 20;

// ========== 初始化 ==========
function populateSelect(select, options, selectedValue) {
  select.innerHTML = '';
  options.forEach(function(opt) {
    var option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === selectedValue) option.selected = true;
    select.appendChild(option);
  });
}

function updateSelectBackground(select) {
  var val = select.value;
  if (val === '无') {
    select.style.backgroundColor = '#fff';
    select.style.color = '#1F2937';
    return;
  }
  var color = TYPE_COLORS[val] || '#fff';
  select.style.backgroundColor = color;
  select.style.color = '#fff';
}

function initStaticSelects() {
  var typeOptions = TYPES.map(function(t){ return { value:t, label:t }; });
  var typeOptionsWithNone = [{ value:'无', label:'无' }].concat(typeOptions);
  populateSelect(pokeType1, typeOptionsWithNone, '无');
  populateSelect(pokeType2, typeOptionsWithNone, '无');
  var weatherOptions = WEATHER_PRESETS.map(function(w){
    return { value:w.name, label:w.name === '无' ? '无' : (w.name + (w.note ? '（' + w.note + '）' : '')) };
  });
  populateSelect(weatherSel, weatherOptions, '无');
  populateSelect(customWeatherType1, typeOptions, '火');
  populateSelect(customWeatherType2, typeOptionsWithNone, '无');
  updateSelectBackground(pokeType1);
  updateSelectBackground(pokeType2);
  updateSelectBackground(customWeatherType1);
  updateSelectBackground(customWeatherType2);
}

pokeType1.addEventListener('change', function(){ updateSelectBackground(pokeType1); updateAllMoveTypeOptions(); });
pokeType2.addEventListener('change', function(){ updateSelectBackground(pokeType2); updateAllMoveTypeOptions(); });
customWeatherType1.addEventListener('change', function(){ updateSelectBackground(customWeatherType1); });
customWeatherType2.addEventListener('change', function(){ updateSelectBackground(customWeatherType2); });
weatherSel.addEventListener('change', function(){
  customWeather.classList.toggle('hidden', weatherSel.value !== '自定义天气');
});

function getWeatherTypes() {
  if (weatherSel.value === '自定义天气') {
    var types = [customWeatherType1.value];
    if (customWeatherType2.value !== '无') types.push(customWeatherType2.value);
    return types;
  }
  var preset = WEATHER_PRESETS.find(function(w){ return w.name === weatherSel.value; });
  return preset ? preset.types : [];
}

function updateTypeOptions(select, selectedValue) {
  var preferred = [];
  if (pokeType1.value !== '无') preferred.push(pokeType1.value);
  if (pokeType2.value !== '无' && preferred.indexOf(pokeType2.value) === -1) preferred.push(pokeType2.value);
  var rest = TYPES.filter(function(t){ return preferred.indexOf(t) === -1; });
  var ordered = preferred.concat(rest);
  var options = ordered.map(function(t){ return { value:t, label:t }; });
  populateSelect(select, options, selectedValue || ordered[0]);
}

function updateAllMoveTypeOptions() {
  var selects = document.querySelectorAll('.move-row .mType');
  Array.prototype.forEach.call(selects, function(sel){
    updateTypeOptions(sel, sel.value);
  });
}

// ========== 招式行管理 ==========
var rowCounter = 0;

function createMoveRow(data) {
  data = data || {};
  if (moveList.querySelectorAll('.move-row').length >= MAX_MOVES) return null;
  rowCounter++;
  var rowId = 'move-' + rowCounter;
  var row = document.createElement('div');
  row.className = 'move-row';
  row.dataset.rowId = rowId;
  row.dataset.expanded = 'false';

  var category = data.category || '物理';
  var power = data.power !== undefined ? data.power : '';
  var name = data.name || '';
  var type = data.type || (pokeType1.value !== '无' ? pokeType1.value : TYPES[0]);
  var buffType = data.buffType || 'attack';
  var buffPower = data.buffPower || 1.5;
  var isBuff = category === '变化';
  var typeColor = TYPE_COLORS[type] || '#666';

  row.innerHTML = '<div class="move-row-header" style="border-color:' + typeColor + '">' +
    '<button class="delete-btn" data-delete="' + rowId + '" aria-label="删除">✕</button>' +
    '<div class="move-entry-left">' +
    '<span class="move-entry-name">' + (name || '新招式') + '</span>' +
    '<span class="move-entry-detail">' + (!isBuff ? '(' + (power || '?') + '威力，' + category + ')' : '(0威力，变化)') + '</span>' +
    '</div>' +
    '<span class="type-tag" style="background-color:' + typeColor + ';">' + type + '</span>' +
    '<span class="chevron" data-chevron="' + rowId + '">▼</span>' +
    '</div>' +
    '<div class="move-row-detail" data-detail="' + rowId + '">' +
    '<input class="mName" placeholder="招式名" value="' + name + '" style="flex:1 1 100px;">' +
    '<select class="mType"></select>' +
    '<select class="mCategory">' +
    '<option value="物理"' + (category === '物理' ? ' selected' : '') + '>物理</option>' +
    '<option value="特殊"' + (category === '特殊' ? ' selected' : '') + '>特殊</option>' +
    '<option value="变化"' + (category === '变化' ? ' selected' : '') + '>变化</option>' +
    '</select>' +
    '<input class="mPower" type="number" min="0" placeholder="威力" value="' + power + '"' + (isBuff ? ' disabled' : '') + ' style="width:70px;">' +
    (isBuff ? '<div class="buff-config-inline"><select class="buffType">' +
    '<option value="attack"' + (buffType === 'attack' ? ' selected' : '') + '>攻+</option>' +
    '<option value="special"' + (buffType === 'special' ? ' selected' : '') + '>特+</option>' +
    '<option value="both"' + (buffType === 'both' ? ' selected' : '') + '>双+</option>' +
    '<option value="weather"' + (buffType === 'weather' ? ' selected' : '') + '>天气</option>' +
    '</select>' +
    '<input class="buffPower" type="number" step="0.1" min="0" value="' + buffPower + '" style="width:60px;"></div>' : '') +
    '</div>';

  moveList.appendChild(row);

  var typeSelect = row.querySelector('.mType');
  updateTypeOptions(typeSelect, type);

  var header = row.querySelector('.move-row-header');
  var detail = row.querySelector('.move-row-detail');
  var chevron = row.querySelector('.chevron');

  header.addEventListener('click', function(e) {
    if (e.target.closest('.delete-btn')) return;
    var isOpen = detail.classList.toggle('show');
    chevron.classList.toggle('open', isOpen);
    row.dataset.expanded = isOpen ? 'true' : 'false';
  });

  row.querySelector('.delete-btn').addEventListener('click', function(e){
    e.stopPropagation();
    row.remove();
    updateMoveCount();
  });

  var categorySelect = row.querySelector('.mCategory');
  categorySelect.addEventListener('change', function(){
    var isBuffNow = categorySelect.value === '变化';
    var powerInput = row.querySelector('.mPower');
    var existingBuff = row.querySelector('.buff-config-inline');
    if (isBuffNow) {
      powerInput.disabled = true;
      powerInput.value = 0;
      if (!existingBuff) {
        var div = document.createElement('div');
        div.className = 'buff-config-inline';
        div.innerHTML = '<select class="buffType"><option value="attack">攻+</option><option value="special">特+</option><option value="both">双+</option><option value="weather">天气</option></select><input class="buffPower" type="number" step="0.1" min="0" value="1.5" style="width:60px;">';
        powerInput.parentNode.insertBefore(div, powerInput.nextSibling);
      }
      updateRowSummary(row);
    } else {
      powerInput.disabled = false;
      if (powerInput.value === '0') powerInput.value = '';
      if (existingBuff) existingBuff.remove();
      updateRowSummary(row);
    }
  });

  row.querySelector('.mName').addEventListener('input', function(){ updateRowSummary(row); });
  typeSelect.addEventListener('change', function(){ updateRowSummary(row); });
  categorySelect.addEventListener('change', function(){ updateRowSummary(row); });
  row.querySelector('.mPower').addEventListener('input', function(){ updateRowSummary(row); });

  updateRowSummary(row);
  updateMoveCount();
  return row;
}

function updateRowSummary(row) {
  var name = row.querySelector('.mName').value.trim() || '新招式';
  var type = row.querySelector('.mType').value;
  var category = row.querySelector('.mCategory').value;
  var power = row.querySelector('.mPower').value;
  var isBuff = category === '变化';
  var typeColor = TYPE_COLORS[type] || '#666';
  var header = row.querySelector('.move-row-header');
  header.style.borderColor = typeColor;
  header.querySelector('.move-entry-name').textContent = name;
  header.querySelector('.move-entry-detail').textContent = !isBuff ? '(' + (power || '?') + '威力，' + category + ')' : '(0威力，变化)';
  var tag = header.querySelector('.type-tag');
  tag.textContent = type;
  tag.style.backgroundColor = typeColor;
}

function updateMoveCount() {
  var count = moveList.querySelectorAll('.move-row').length;
  moveCount.textContent = '(' + count + '/' + MAX_MOVES + ')';
}

function getMoves() {
  var moves = [];
  var rows = moveList.querySelectorAll('.move-row');
  Array.prototype.forEach.call(rows, function(row){
    var name = row.querySelector('.mName').value.trim() || '招式';
    var type = row.querySelector('.mType').value;
    var category = row.querySelector('.mCategory').value;
    var powerInput = row.querySelector('.mPower');
    var power = parseFloat(powerInput.value);
    if (category === '变化') {
      var bt = row.querySelector('.buffType').value;
      var bp = parseFloat(row.querySelector('.buffPower').value) || 1.5;
      moves.push({ name:name, type:type, category:category, power:0, buffType:bt, buffPower:bp });
    } else if (!isNaN(power) && power > 0) {
      moves.push({ name:name, type:type, category:category, power:power, buffType:null, buffPower:1 });
    }
  });
  return moves;
}
// ========== 搜索 ==========
moveSearch.addEventListener('input', function(){
  var query = moveSearch.value.trim().toLowerCase();
  if (!query) { searchResults.classList.add('hidden'); return; }
  var matches = MOVE_DB.filter(function(m){
    return m.name.toLowerCase().indexOf(query) !== -1 || (m.pinyin || '').indexOf(query) !== -1;
  });
  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="search-item">无匹配</div>';
    searchResults.classList.remove('hidden');
  } else {
    searchResults.innerHTML = matches.slice(0, 15).map(function(m){
      return '<div class="search-item" data-name="' + m.name + '">' + m.name +
        ' <span class="si-type">' + m.type + ' · ' + (m.category === '变化' ? 'Buff' : m.power) + '</span></div>';
    }).join('');
    searchResults.classList.remove('hidden');
    var items = searchResults.querySelectorAll('.search-item');
    Array.prototype.forEach.call(items, function(item){
      item.addEventListener('click', function(){
        var name = this.dataset.name;
        var move = MOVE_DB.find(function(m){ return m.name === name; });
        if (move) {
          createMoveRow(move);
          moveSearch.value = '';
          searchResults.classList.add('hidden');
        }
      });
    });
  }
});

document.addEventListener('click', function(e){
  if (!e.target.closest('.search-wrapper')) searchResults.classList.add('hidden');
});

// ========== 豆包粘贴解析 ==========
parsePasteBtn.addEventListener('click', function(){
  var text = pasteInput.value.trim();
  if (!text) return;
  var lines = text.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
  var imported = 0;
  lines.forEach(function(line){
    var parts = line.split(',').map(function(p){ return p.trim(); });
    if (parts.length < 4) return;
    var name = parts[0];
    var type = parts[1];
    var category = parts[2];
    var power = parseFloat(parts[3]);
    if (!TYPES.includes(type) || !['物理','特殊','变化'].includes(category)) return;
    if (moveList.querySelectorAll('.move-row').length >= MAX_MOVES) return;
    var data = { name:name, type:type, category:category, power: category === '变化' ? 0 : power };
    if (category === '变化') {
      data.buffType = parts[4] || 'attack';
      data.buffPower = parseFloat(parts[5]) || 1.5;
    }
    createMoveRow(data);
    imported++;
  });
  if (imported > 0) {
    pasteInput.value = '';
    updateAllMoveTypeOptions();
  } else {
    alert('解析失败，请检查格式');
  }
});

clearPasteBtn.addEventListener('click', function(){
  pasteInput.value = '';
});

// ========== 敌方属性 ==========
function createEnemySet(type1, type2) {
  type1 = type1 || '无';
  type2 = type2 || '无';
  var div = document.createElement('div');
  div.className = 'enemy-set-row';
  div.innerHTML = '<select class="enemyType1 bg-type" style="flex:1;">' +
    ['无'].concat(TYPES).map(function(t){ return '<option value="' + t + '"' + (t === type1 ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
    '</select>' +
    '<select class="enemyType2 bg-type" style="flex:1;">' +
    ['无'].concat(TYPES).map(function(t){ return '<option value="' + t + '"' + (t === type2 ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
    '</select>' +
    '<button class="btn btn-sm btn-danger removeEnemySet" style="flex:0 0 auto;">✕</button>';
  var sel1 = div.querySelector('.enemyType1');
  var sel2 = div.querySelector('.enemyType2');
  function updateBg(sel) { updateSelectBackground(sel); }
  sel1.addEventListener('change', function(){ updateBg(sel1); });
  sel2.addEventListener('change', function(){ updateBg(sel2); });
  updateBg(sel1);
  updateBg(sel2);
  div.querySelector('.removeEnemySet').addEventListener('click', function(){ div.remove(); });
  enemySetsDiv.appendChild(div);
}

function getEnemySets() {
  var sets = [];
  var rows = enemySetsDiv.querySelectorAll('.enemy-set-row');
  Array.prototype.forEach.call(rows, function(row){
    sets.push({
      type1: row.querySelector('.enemyType1').value,
      type2: row.querySelector('.enemyType2').value
    });
  });
  return sets;
}

addEnemySetBtn.addEventListener('click', function(){ createEnemySet(); });

autoRecommendBtn.addEventListener('click', function(){
  enemySetsDiv.innerHTML = '';
  var moves = getMoves();
  var damageMoves = moves.filter(function(m){ return m.category !== '变化'; });
  if (damageMoves.length === 0) { alert('请先添加伤害招式'); return; }

  function hasZero(ms, es) { return ms.some(function(m){ return getEnemyMultiplier(m.type, es) === 0; }); }
  function calcScore(ms, es) { return ms.reduce(function(sum, m){ return sum + m.power * getEnemyMultiplier(m.type, es); }, 0); }

  var best = null, bestScore = -1;
  TYPES.forEach(function(t){
    var s = { type1:t, type2:'无' };
    if (hasZero(damageMoves, s)) return;
    var sc = calcScore(damageMoves, s);
    if (sc > bestScore) { bestScore = sc; best = s; }
  });
  for (var i = 0; i < TYPES.length; i++) {
    for (var j = i+1; j < TYPES.length; j++) {
      var s2 = { type1:TYPES[i], type2:TYPES[j] };
      if (hasZero(damageMoves, s2)) continue;
      var sc2 = calcScore(damageMoves, s2);
      if (sc2 > bestScore) { bestScore = sc2; best = s2; }
    }
  }
  if (best) {
    createEnemySet(best.type1, best.type2);
    alert('推荐克制组合：' + best.type1 + '/' + best.type2 + '（评分 ' + bestScore.toFixed(0) + '）');
  } else {
    alert('未找到无免疫的克制组合');
  }
});

// ========== 计算 ==========
function getBaseOptions() {
  var pokeTypes = [];
  if (pokeType1.value !== '无') pokeTypes.push(pokeType1.value);
  if (pokeType2.value !== '无' && pokeTypes.indexOf(pokeType2.value) === -1) pokeTypes.push(pokeType2.value);
  var isSingle = pokeTypes.length === 1;
  return {
    attack: parseFloat(atkInput.value) || 0,
    specialAttack: parseFloat(spaInput.value) || 0,
    pokeTypes: pokeTypes,
    isSingle: isSingle,
    crossMult: parseFloat(crossMultInput.value) || 1.3,
    weatherMult: parseFloat(weatherMultInput.value) || 1.5,
    weatherTypes: getWeatherTypes(),
    enemySet: null
  };
}

function getStab(moveType, options) {
  if (options.pokeTypes.length === 0) return 1;
  if (options.pokeTypes.indexOf(moveType) === -1) return 1.0;
  return options.isSingle ? 1.7 : 1.5;
}

function getEnemyMultiplier(moveType, enemySet) {
  if (!enemySet || (enemySet.type1 === '无' && enemySet.type2 === '无')) return 1;
  var mult = 1;
  if (enemySet.type1 !== '无') mult *= (typeChart[moveType] && typeChart[moveType][enemySet.type1] !== undefined ? typeChart[moveType][enemySet.type1] : 1);
  if (enemySet.type2 && enemySet.type2 !== '无') mult *= (typeChart[moveType] && typeChart[moveType][enemySet.type2] !== undefined ? typeChart[moveType][enemySet.type2] : 1);
  return mult;
}

function calcRound(sequence, options) {
  var atkBuff = 1, spaBuff = 1;
  var currentWeatherTypes = options.weatherTypes.slice();
  var total = 0;
  var details = [];
  var damageMoves = sequence.filter(function(m){ return m.category !== '变化'; });
  var n = damageMoves.length;
  if (n === 0) return { total:0, details:[] };

  var crossFlags = new Array(n);
  for (var i = 0; i < n; i++) {
    var move = damageMoves[i];
    var prevMove = damageMoves[(i-1+n)%n];
    crossFlags[i] = (move.type !== prevMove.type) ? options.crossMult : 1;
  }

  var dIdx = 0;
  sequence.forEach(function(move){
    if (move.category === '变化') {
      var bp = move.buffPower || 1;
      if (move.buffType === 'attack') atkBuff *= bp;
      else if (move.buffType === 'special') spaBuff *= bp;
      else if (move.buffType === 'both') { atkBuff *= bp; spaBuff *= bp; }
      else if (move.buffType === 'weather') {
        var wm = { '大晴天':['火'],'求雨':['水'],'冰雹':['冰'],'沙暴':['岩石','地面','钢'],'电气场地':['电'],'青草场地':['草'],'精神场地':['超能力'],'薄雾场地':['妖精'] };
        currentWeatherTypes = wm[move.name] || [];
      }
      details.push({ move: move, damage:0, note:'Buff：' + move.buffType + (bp ? ' ×' + bp : '') });
      return;
    }
    var isPhys = move.category === '物理';
    var baseStat = isPhys ? options.attack : options.specialAttack;
    var stab = getStab(move.type, options);
    var cross = crossFlags[dIdx];
    var weatherMult = currentWeatherTypes.indexOf(move.type) !== -1 ? options.weatherMult : 1;
    var enemyMult = getEnemyMultiplier(move.type, options.enemySet);
    var buff = isPhys ? atkBuff : spaBuff;
    var damage = baseStat * move.power * stab * cross * weatherMult * enemyMult * buff;
    total += damage;
    details.push({
      move: move, damage: damage, stab: stab, cross: cross, weatherMult: weatherMult, enemyMult: enemyMult, buff: buff,
      note: '本系×' + stab.toFixed(2) + ' 交叉×' + cross.toFixed(2) + ' 天气×' + weatherMult.toFixed(2) + ' 克制×' + enemyMult.toFixed(2) + ' Buff×' + buff.toFixed(2)
    });
    dIdx++;
  });
  return { total: total, details: details };
}

function permute(arr) {
  if (arr.length <= 1) return [arr];
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var rest = arr.slice(0,i).concat(arr.slice(i+1));
    permute(rest).forEach(function(p){ result.push([arr[i]].concat(p)); });
  }
  return result;
}

function enumerateAll(moves, options) {
  var n = moves.length;
  if (n < 4) return [];
  var results = [];
  for (var i = 0; i < n; i++) {
    for (var j = i+1; j < n; j++) {
      for (var k = j+1; k < n; k++) {
        for (var l = k+1; l < n; l++) {
          var combo = [moves[i], moves[j], moves[k], moves[l]];
          var buffCount = combo.filter(function(m){ return m.category === '变化'; }).length;
          if (buffCount > 1) continue;
          var sequences;
          if (buffFirst.checked && buffCount === 1) {
            var buffMove = combo.find(function(m){ return m.category === '变化'; });
            var others = combo.filter(function(m){ return m !== buffMove; });
            sequences = permute(others).map(function(perm){ return [buffMove].concat(perm); });
          } else {
            sequences = permute(combo);
          }
          sequences.forEach(function(seq){
            var result = calcRound(seq, options);
            results.push({ seq: seq, total: result.total, details: result.details });
          });
        }
      }
    }
  }
  results.sort(function(a, b){ return b.total - a.total; });
  return results;
}

function formatDamage(v) { return Math.round(v * 100) / 100; }

function validateInputs(moves) {
  var hasPhysical = moves.some(function(m){ return m.category === '物理'; });
  var hasSpecial = moves.some(function(m){ return m.category === '特殊'; });
  var atk = parseFloat(atkInput.value);
  var spa = parseFloat(spaInput.value);

  if (pokeType1.value === '无' && pokeType2.value === '无') {
    alert('请先选择宝可梦属性');
    return false;
  }
  if (hasPhysical && (!atk || atk <= 0)) {
    alert('存在物理招式，请填写攻击值');
    atkInput.focus();
    return false;
  }
  if (hasSpecial && (!spa || spa <= 0)) {
    alert('存在特殊招式，请填写特攻值');
    spaInput.focus();
    return false;
  }
  return true;
}

function renderBest() {
  var moves = getMoves();
  if (moves.length < 4) {
    resultsDiv.innerHTML = '<p class="muted">至少需要4个有效招式</p>';
    return;
  }
  if (!validateInputs(moves)) return;

  var options = getBaseOptions();
  var enemySets = getEnemySets();
  if (enemySets.length === 0) enemySets.push({ type1:'无', type2:'无' });

  var pokeInfo = (pokeType1.value !== '无' ? pokeType1.value : '') + (pokeType2.value !== '无' ? '/' + pokeType2.value : '');
  var atkVal = atkInput.value || '?';
  var spaVal = spaInput.value || '?';

  var html = '';
  enemySets.forEach(function(es){
    var opts = Object.assign({}, options, { enemySet: es });
    var results = enumerateAll(moves, opts);
    if (results.length === 0) return;
    var label = (es.type1 === '无' && es.type2 === '无') ? '无克制' : (es.type1 + (es.type2 !== '无' ? '/' + es.type2 : ''));

    html += '<h3 style="margin:8px 0;font-size:15px;font-weight:700;">🎯 敌方：' + label + '</h3>';
    html += '<div class="result-info">' +
      '<span>宝可梦属性：' + pokeInfo + '</span>' +
      '<span>攻击：' + atkVal + '</span>' +
      '<span>特攻：' + spaVal + '</span>' +
      '</div>';

    // 默认显示第一名
    var first = results[0];
    var movesetHtml = '<div class="result-moveset">';
    first.seq.forEach(function(m){
      var typeColor = TYPE_COLORS[m.type] || '#666';
      var isBuff = m.category === '变化';
      movesetHtml += '<div class="result-move-item" style="border-color:' + typeColor + '">' +
        '<span class="result-move-name">' + m.name + '</span>' +
        '<span class="result-move-detail">' + (isBuff ? '(0威力，变化)' : '(' + m.power + '威力，' + m.category + ')') + '</span>' +
        '<span class="result-move-tag" style="background-color:' + typeColor + ';">' + m.type + '</span>' +
        '</div>';
    });
    movesetHtml += '</div>';

    html += '<div class="result-panel"><span class="rank-badge">第1名</span>' +
      '<div class="total">' + formatDamage(first.total) + '</div>' +
      movesetHtml +
      '<button class="result-detail-toggle" onclick="this.nextElementSibling.classList.toggle(\'show\');this.textContent=this.nextElementSibling.classList.contains(\'show\')?\'隐藏明细\':\'查看明细\';">查看明细</button>' +
      '<div class="result-detail-section">';
    first.details.forEach(function(d){
      if (d.move.category === '变化') {
        html += '<div>' + d.move.name + '：伤害0（' + d.note + '）</div>';
      } else {
        html += '<div>' + d.move.name + '：' + formatDamage(d.damage) + '（' + d.note + '）</div>';
      }
    });
    html += '</div></div>';

    if (results.length > 1) {
      html += '<button class="show-more-btn" onclick="this.nextElementSibling.classList.toggle(\'hidden\');this.textContent=this.nextElementSibling.classList.contains(\'hidden\')?\'显示更多排名\':\'收起排名\';">显示更多排名</button>';
      html += '<div class="hidden">';
      for (var idx = 1; idx < Math.min(results.length, 3); idx++) {
        var r = results[idx];
        var movesetHtml2 = '<div class="result-moveset">';
        r.seq.forEach(function(m){
          var typeColor = TYPE_COLORS[m.type] || '#666';
          var isBuff = m.category === '变化';
          movesetHtml2 += '<div class="result-move-item" style="border-color:' + typeColor + '">' +
            '<span class="result-move-name">' + m.name + '</span>' +
            '<span class="result-move-detail">' + (isBuff ? '(0威力，变化)' : '(' + m.power + '威力，' + m.category + ')') + '</span>' +
            '<span class="result-move-tag" style="background-color:' + typeColor + ';">' + m.type + '</span>' +
            '</div>';
        });
        movesetHtml2 += '</div>';
        html += '<div class="result-panel"><span class="rank-badge">第' + (idx+1) + '名</span>' +
          '<div class="total">' + formatDamage(r.total) + '</div>' +
          movesetHtml2 +
          '<button class="result-detail-toggle" onclick="this.nextElementSibling.classList.toggle(\'show\');this.textContent=this.nextElementSibling.classList.contains(\'show\')?\'隐藏明细\':\'查看明细\';">查看明细</button>' +
          '<div class="result-detail-section">';
        r.details.forEach(function(d){
          if (d.move.category === '变化') {
            html += '<div>' + d.move.name + '：伤害0（' + d.note + '）</div>';
          } else {
            html += '<div>' + d.move.name + '：' + formatDamage(d.damage) + '（' + d.note + '）</div>';
          }
        });
        html += '</div></div>';
      }
      html += '</div>';
    }

    html += '<hr style="margin:10px 0;border-color:var(--border);">';
  });
  resultsDiv.innerHTML = html || '<p class="muted">无结果</p>';
  resultsDiv.scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderCurrent() {
  var moves = getMoves();
  if (moves.length === 0) { resultsDiv.innerHTML = '<p class="muted">请先添加招式</p>'; return; }
  if (!validateInputs(moves)) return;

  var seq = moves.slice(0, 4);
  var options = getBaseOptions();
  var es = getEnemySets();
  options.enemySet = es.length > 0 ? es[0] : { type1:'无', type2:'无' };
  var result = calcRound(seq, options);

  var pokeInfo = (pokeType1.value !== '无' ? pokeType1.value : '') + (pokeType2.value !== '无' ? '/' + pokeType2.value : '');
  var atkVal = atkInput.value || '?';
  var spaVal = spaInput.value || '?';

  var movesetHtml = '<div class="result-moveset">';
  seq.forEach(function(m){
    var typeColor = TYPE_COLORS[m.type] || '#666';
    var isBuff = m.category === '变化';
    movesetHtml += '<div class="result-move-item" style="border-color:' + typeColor + '">' +
      '<span class="result-move-name">' + m.name + '</span>' +
      '<span class="result-move-detail">' + (isBuff ? '(0威力，变化)' : '(' + m.power + '威力，' + m.category + ')') + '</span>' +
      '<span class="result-move-tag" style="background-color:' + typeColor + ';">' + m.type + '</span>' +
      '</div>';
  });
  movesetHtml += '</div>';

  var html = '<div class="result-panel"><div class="total">一轮总威力：' + formatDamage(result.total) + '</div>' +
    '<div class="result-info">' +
    '<span>宝可梦属性：' + pokeInfo + '</span>' +
    '<span>攻击：' + atkVal + '</span>' +
    '<span>特攻：' + spaVal + '</span>' +
    '</div>' +
    movesetHtml +
    '<button class="result-detail-toggle" onclick="this.nextElementSibling.classList.toggle(\'show\');this.textContent=this.nextElementSibling.classList.contains(\'show\')?\'隐藏明细\':\'查看明细\';">查看明细</button>' +
    '<div class="result-detail-section">';
  result.details.forEach(function(d){
    if (d.move.category === '变化') html += '<div>' + d.move.name + '：伤害0（' + d.note + '）</div>';
    else html += '<div>' + d.move.name + '：' + formatDamage(d.damage) + '（' + d.note + '）</div>';
  });
  html += '</div></div>';
  resultsDiv.innerHTML = html;
  resultsDiv.scrollIntoView({ behavior:'smooth', block:'start' });
}

calcBestBtn.addEventListener('click', renderBest);
calcCurrentBtn.addEventListener('click', renderCurrent);

addMoveBtn.addEventListener('click', function(){ createMoveRow(); });
clearAllBtn.addEventListener('click', function(){ moveList.innerHTML = ''; updateMoveCount(); });
expandAllBtn.addEventListener('click', function(){
  var allExpanded = moveList.querySelectorAll('.move-row-detail.show').length === moveList.querySelectorAll('.move-row-detail').length;
  var rows = moveList.querySelectorAll('.move-row');
  Array.prototype.forEach.call(rows, function(row){
    var detail = row.querySelector('.move-row-detail');
    var chevron = row.querySelector('.chevron');
    if (allExpanded) {
      detail.classList.remove('show');
      chevron.classList.remove('open');
      row.dataset.expanded = 'false';
    } else {
      detail.classList.add('show');
      chevron.classList.add('open');
      row.dataset.expanded = 'true';
    }
  });
  expandAllBtn.textContent = allExpanded ? '▾ 全部展开' : '▴ 全部折叠';
});

// ========== 初始化 ==========
initStaticSelects();
createEnemySet('无', '无');
updateMoveCount();

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(err){
      console.log('SW registration failed:', err);
    });
  });
}