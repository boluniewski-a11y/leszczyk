// BIBLIOTEKA LINKÓW — własne linki w localStorage (bezpieczny fallback, gdyby storage był zablokowany)
  var charts = {}; // instancje wykresów Chart.js
  const LS_KEY = "odraLinks";

  function loadLinks(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch(e){ return []; }
  }
  function persistLinks(list){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; }
    catch(e){ return false; }
  }

  function renderUserLinks(){
    const ul = document.getElementById("userLinks");
    const list = loadLinks();
    ul.innerHTML = "";
    if(list.length === 0){
      ul.innerHTML = '<li style="color:var(--muted);border-style:dashed;">Brak dodanych linków — wklej pierwszy powyżej. 🎣</li>';
      return;
    }
    list.forEach((item, i) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = item.name ? (item.name + " — " + item.url) : item.url;
      const cat = document.createElement("span");
      cat.textContent = item.cat || "";
      cat.style.fontSize = "12px";
      cat.style.color = "var(--accent2)";
      cat.style.whiteSpace = "nowrap";
      const del = document.createElement("button");
      del.textContent = "✕";
      del.title = "Usuń";
      del.onclick = function(){
        const cur = loadLinks();
        cur.splice(i, 1);
        persistLinks(cur);
        renderUserLinks();
      };
      li.appendChild(cat);
      li.appendChild(a);
      li.appendChild(del);
      ul.appendChild(li);
    });
  }

  function addLink(){
    const urlEl = document.getElementById("lkUrl");
    const nameEl = document.getElementById("lkName");
    const catEl = document.getElementById("lkCat");
    const hint = document.getElementById("lkHint");
    let url = urlEl.value.trim();
    if(!url){ hint.textContent = "Wpisz link (musi zaczynać się od http:// lub https://)."; return; }
    if(!/^https?:\/\//i.test(url)){ url = "https://" + url; }
    const name = nameEl.value.trim();
    const cat = catEl.value;

    const list = loadLinks();
    list.unshift({ url: url, name: name, cat: cat });
    const ok = persistLinks(list);

    urlEl.value = ""; nameEl.value = "";
    renderUserLinks();
    if(ok){
      hint.textContent = "✅ Dodano i zapisano w tej przeglądarce.";
    } else {
      hint.textContent = "⚠️ Dodano do bieżącej listy, ale zapis nie zadziałał (pamięć przeglądarki może być zablokowana — np. w podglądzie). Po wgraniu strony na hosting zapis działa w pełni.";
    }
  }

  renderUserLinks();


  // MIEJSCÓWKI — zapis w localStorage + automatyczne wczytywanie z pliku JSON
  const SP_KEY = "odraSpots";
  const SP_FILE = "odra-miejscowki.json";
  let fileSpots = []; // miejscówki wbudowane, wczytane z pliku JSON

  function loadSpots(){ try{ return JSON.parse(localStorage.getItem(SP_KEY) || "[]"); } catch(e){ return []; } }
  function persistSpots(list){ try{ localStorage.setItem(SP_KEY, JSON.stringify(list)); return true; } catch(e){ return false; } }

  function mapsUrl(link){
    const s = (link || "").trim();
    if(/^https?:\/\//i.test(s)) return s;
    return "https://www.google.com/maps?q=" + encodeURIComponent(s);
  }

  // Buduje kartę miejscówki. userIndex !== null oznacza miejscówkę użytkownika (z localStorage) — wtedy dodaje przycisk "Usuń".
  function buildSpotCard(s, userIndex){
    const d = document.createElement("div");
    d.className = "spotcard";
    const url = mapsUrl(s.link);

    const top = document.createElement("div");
    top.className = "top";
    const h = document.createElement("h4");
    h.textContent = s.name || "Bez nazwy";
    const f = document.createElement("span");
    f.className = "fish";
    f.textContent = s.fish || "";
    top.appendChild(h);
    top.appendChild(f);
    d.appendChild(top);

    if(s.note){
      const n = document.createElement("p");
      n.className = "note";
      n.textContent = s.note;
      d.appendChild(n);
    }

    if(s.rating || s.lastVisit){
      const meta = document.createElement("p");
      meta.className = "note";
      const parts = [];
      if(s.rating) parts.push("Ocena: " + "⭐".repeat(parseInt(s.rating, 10) || 0));
      if(s.lastVisit) parts.push("Ostatnia wizyta: " + s.lastVisit);
      meta.textContent = parts.join(" · ");
      d.appendChild(meta);
    }

    const act = document.createElement("div");
    act.className = "act";
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = "Otwórz w Google Maps ↗";
    act.appendChild(a);

    if(userIndex !== null){
      const del = document.createElement("a");
      del.href = "#"; del.textContent = "Usuń"; del.style.color = "var(--muted)";
      del.onclick = function(e){
        e.preventDefault();
        const cur = loadSpots();
        cur.splice(userIndex, 1);
        persistSpots(cur);
        renderSpots();
      };
      act.appendChild(del);
    }

    d.appendChild(act);
    return d;
  }

  function renderSpots(){
    const box = document.getElementById("userSpots");
    const userList = loadSpots();
    box.innerHTML = "";
    if(fileSpots.length === 0 && userList.length === 0){
      box.innerHTML = '<p class="kicker" style="border:1px dashed var(--border);border-radius:10px;padding:14px;">Brak miejscówek — dodaj pierwszą powyżej. 📍</p>';
      return;
    }
    // Najpierw miejscówki wbudowane z pliku JSON (bez przycisku usuwania)
    fileSpots.forEach((s) => { box.appendChild(buildSpotCard(s, null)); });
    // Potem miejscówki użytkownika z localStorage (z przyciskiem usuwania)
    userList.forEach((s, i) => { box.appendChild(buildSpotCard(s, i)); });
    renderMapMarkers();
  }

  function addSpot(){
    const name = document.getElementById("spName").value.trim();
    const fish = document.getElementById("spFish").value.trim();
    const link = document.getElementById("spLink").value.trim();
    const note = document.getElementById("spNote").value.trim();
    const rating = document.getElementById("spRating").value;
    const lastVisit = document.getElementById("spLastVisit").value;
    const hint = document.getElementById("spHint");
    if(!link){ hint.textContent = "Wklej link Google Maps lub współrzędne."; return; }
    if(!name){ hint.textContent = "Podaj nazwę miejscówki."; return; }

    const list = loadSpots();
    list.unshift({ name: name, fish: fish, link: link, note: note, rating: rating, lastVisit: lastVisit });
    const ok = persistSpots(list);
    document.getElementById("spName").value = "";
    document.getElementById("spFish").value = "";
    document.getElementById("spLink").value = "";
    document.getElementById("spNote").value = "";
    document.getElementById("spRating").value = "";
    document.getElementById("spLastVisit").value = "";
    renderSpots();
    renderMapMarkers();
    if(ok){ hint.textContent = "✅ Zapisano w tej przeglądarce."; }
    else { hint.textContent = "⚠️ Dodano do listy, ale zapis nie zadziałał (pamięć zablokowana — np. w podglądzie). Po wgraniu na hosting zapis działa w pełni."; }
  }

  // Automatyczne wczytanie miejscówek z pliku JSON przy starcie strony.
  // Łączy je z miejscówkami użytkownika zapisanymi w localStorage.
  function loadFileSpots(){
    fetch(SP_FILE)
      .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(arr){ if(Array.isArray(arr)) fileSpots = arr; })
      .catch(function(){ fileSpots = []; })
      .finally(function(){ renderSpots(); renderMapMarkers(); });
  }

  loadFileSpots();

  // ===== MAPA MIEJSCÓWEK (Leaflet) =====
  let spotsMap = null;
  let spotsMarkers = [];

  function initMap(){
    const el = document.getElementById("spotsMap");
    if(!el || typeof L === "undefined") return;
    if(spotsMap) return;
    spotsMap = L.map("spotsMap").setView([53.43, 14.55], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(spotsMap);
  }

  // Parsuje współrzędne z linku (np. "53.42, 14.55" lub link Google Maps)
  function parseCoords(link){
    const s = (link || "").trim();
    const m = s.match(/(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)/);
    if(m) return [parseFloat(m[1]), parseFloat(m[2])];
    // Google Maps link z @lat,lng
    const g = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if(g) return [parseFloat(g[1]), parseFloat(g[2])];
    return null;
  }

  function renderMapMarkers(){
    if(typeof L === "undefined") return;
    initMap();
    if(!spotsMap) return;
    // Wyczyść stare markery
    spotsMarkers.forEach(function(m){ spotsMap.removeLayer(m); });
    spotsMarkers = [];
    const all = fileSpots.concat(loadSpots());
    let added = 0;
    all.forEach(function(s){
      const coords = parseCoords(s.link);
      if(!coords) return;
      const marker = L.marker(coords).addTo(spotsMap);
      const rating = s.rating ? " ⭐".repeat(parseInt(s.rating,10) || 0) : "";
      const popup = "<b>" + (s.name || "Bez nazwy") + "</b>" + rating +
        (s.fish ? "<br>🐟 " + s.fish : "") +
        (s.note ? "<br>" + s.note : "") +
        (s.lastVisit ? "<br>📅 " + s.lastVisit : "") +
        '<br><a href="' + mapsUrl(s.link) + '" target="_blank" rel="noopener">Otwórz w Google Maps ↗</a>';
      marker.bindPopup(popup);
      spotsMarkers.push(marker);
      added++;
    });
    if(added > 0 && spotsMap){
      // Dopasuj widok do wszystkich markerów
      const group = L.featureGroup(spotsMarkers);
      spotsMap.fitBounds(group.getBounds().pad(0.1));
    }
  }

  // Inicjalizacja mapy po załadowaniu strony
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){ initMap(); renderMapMarkers(); });
  } else {
    initMap(); renderMapMarkers();
  }


  // CHECKLISTA
  var CHECK_KEY = "odraCheck";
  var CHECK_ITEMS = {
    chk1: ["Karta wędkarska / dokument tożsamości","Zezwolenie PZW lub dowód opłaty morskiej","Telefon z naładowaną baterią"],
    chk2: ["Wędka + kołowrotek","Plecionka/żyłka + przypony (stal + fluorocarbon)","Przynęty (gumy, obrotówka, wahadłówka, wobler)","Haki, główki, agrafki","Podbierak z miękką siatką"],
    chk3: ["Rozwieracz + uwalniacz + szczypce","Miarka + nożyczki/obcążki","Wodoodporna koperta na telefon + powerbank","Kamizelka asekuracyjna (z łodzi)","Okulary polaryzacyjne","Woda + przekąska"]
  };
  function loadCheck(){ try{ return JSON.parse(localStorage.getItem(CHECK_KEY) || "{}"); }catch(e){ return {}; } }
  function saveCheck(o){ try{ localStorage.setItem(CHECK_KEY, JSON.stringify(o)); }catch(e){} }
  function renderCheck(){
    var state = loadCheck();
    var total = 0, done = 0;
    ["chk1","chk2","chk3"].forEach(function(id){
      var ul = document.getElementById(id);
      ul.innerHTML = "";
      CHECK_ITEMS[id].forEach(function(label){
        total++;
        var key = id + ":" + label;
        var li = document.createElement("li");
        if(state[key]){ li.className = "done"; done++; }
        var cb = document.createElement("input");
        cb.type = "checkbox"; cb.checked = !!state[key];
        var sp = document.createElement("span");
        sp.textContent = label;
        cb.onchange = function(){
          var s = loadCheck();
          if(cb.checked){ s[key] = 1; li.className = "done"; } else { delete s[key]; li.className = ""; }
          saveCheck(s); renderCheck();
        };
        li.appendChild(cb); li.appendChild(sp);
        li.onclick = function(e){ if(e.target.tagName !== "INPUT"){ cb.checked = !cb.checked; cb.onchange(); } };
        ul.appendChild(li);
      });
    });
    var res = document.getElementById("chkRes");
    var pct = total ? Math.round(done/total*100) : 0;
    res.textContent = "Gotowe: " + done + "/" + total + " (" + pct + "%)";
    res.style.color = pct === 100 ? "var(--accent)" : "var(--accent2)";
  }
  function resetCheck(){ localStorage.removeItem(CHECK_KEY); renderCheck(); }

  // EKSPORT / IMPORT (miejscówki i linki)
  function download(name, text){
    var b = new Blob([text], {type:"application/json"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 500);
  }
  function exportSpots(){ download("odra-miejscowki.json", JSON.stringify(loadSpots(), null, 2)); }
  function importSpots(input){
    var file = input.files[0]; if(!file) return;
    var r = new FileReader();
    r.onload = function(){
      try{
        var arr = JSON.parse(r.result);
        if(!Array.isArray(arr)) throw 0;
        var cur = loadSpots();
        persistSpots(arr.concat(cur));
        renderSpots();
        document.getElementById("spHint").textContent = "✅ Zaimportowano " + arr.length + " miejscówek.";
      }catch(e){ document.getElementById("spHint").textContent = "⚠️ Błędny plik JSON."; }
      input.value = "";
    };
    r.readAsText(file);
  }
  function exportLinks(){ download("odra-linki.json", JSON.stringify(loadLinks(), null, 2)); }
  function importLinks(input){
    var file = input.files[0]; if(!file) return;
    var r = new FileReader();
    r.onload = function(){
      try{
        var arr = JSON.parse(r.result);
        if(!Array.isArray(arr)) throw 0;
        var cur = loadLinks();
        persistLinks(arr.concat(cur));
        renderUserLinks();
        document.getElementById("lkHint").textContent = "✅ Zaimportowano " + arr.length + " linków.";
      }catch(e){ document.getElementById("lkHint").textContent = "⚠️ Błędny plik JSON."; }
      input.value = "";
    };
    r.readAsText(file);
  }

  renderCheck();

  // ===== DANE Z PLIKÓW JSON: ryby i przynęty =====
  let fishData = [];
  let lureData = [];

  function renderFish(){
    const box = document.getElementById("fishList");
    if(!box) return;
    box.innerHTML = "";
    if(fishData.length === 0){
      box.innerHTML = '<p class="kicker">Ładowanie ryb…</p>';
      return;
    }
    fishData.forEach(function(f){
      const card = document.createElement("div");
      card.className = "fishcard";
      const imgs = document.createElement("div");
      imgs.className = "imgs";
      const img = document.createElement("img");
      img.src = f.img; img.alt = f.name + " — zdjęcie"; img.loading = "lazy";
      imgs.appendChild(img);
      const body = document.createElement("div");
      body.className = "body";
      const h = document.createElement("h4"); h.textContent = f.name;
      const latin = document.createElement("p"); latin.className = "latin"; latin.textContent = f.latin;
      const p1 = document.createElement("p"); p1.innerHTML = "<b>Gdzie / kiedy:</b> " + f.gdzieKiedy + ".";
      const p2 = document.createElement("p"); p2.innerHTML = "<b>Wygląd:</b> " + f.wyglad + ".";
      const p3 = document.createElement("p"); p3.innerHTML = "<b>Jak odróżnić:</b> " + f.odroznic + ".";
      const p4 = document.createElement("p"); p4.innerHTML = "<b>Przynęty:</b> " + f.przynety + ".";
      const p5 = document.createElement("p"); p5.innerHTML = "<b>Prowadzenie:</b> " + f.prowadzenie + ".";
      const p6 = document.createElement("p"); p6.innerHTML = "<b>Przypon:</b> " + f.przypon + ".";
      body.appendChild(h); body.appendChild(latin);
      body.appendChild(p1); body.appendChild(p2); body.appendChild(p3);
      body.appendChild(p4); body.appendChild(p5); body.appendChild(p6);
      card.appendChild(imgs); card.appendChild(body);
      box.appendChild(card);
    });
  }

  function renderLures(){
    const box = document.getElementById("lureList");
    if(!box) return;
    box.innerHTML = "";
    if(lureData.length === 0){
      box.innerHTML = '<p class="kicker">Ładowanie przynęt…</p>';
      return;
    }
    lureData.forEach(function(l){
      const card = document.createElement("div");
      card.className = "lurecard";
      const img = document.createElement("img");
      img.src = l.img; img.alt = l.name; img.loading = "lazy";
      const h = document.createElement("h4"); h.textContent = l.name;
      const p1 = document.createElement("p"); p1.innerHTML = "<b>Co to:</b> " + l.coTo + ".";
      const p2 = document.createElement("p"); p2.innerHTML = "<b>Na co:</b> " + l.naCo + ".";
      const src = document.createElement("span");
      src.className = "src";
      src.innerHTML = 'Zdjęcie: <a href="' + l.srcUrl + '" target="_blank" rel="noopener">' + l.src + '</a>';
      card.appendChild(img); card.appendChild(h);
      card.appendChild(p1); card.appendChild(p2); card.appendChild(src);
      box.appendChild(card);
    });
  }

  function filterFish(){
    const q = (document.getElementById("fishSearch").value || "").toLowerCase().trim();
    const box = document.getElementById("fishList");
    if(!box) return;
    const cards = box.querySelectorAll(".fishcard");
    cards.forEach(function(card){
      const name = (card.querySelector("h4") || {}).textContent || "";
      const latin = (card.querySelector(".latin") || {}).textContent || "";
      const match = !q || name.toLowerCase().indexOf(q) !== -1 || latin.toLowerCase().indexOf(q) !== -1;
      card.style.display = match ? "" : "none";
    });
  }

  function loadDataFiles(){
    fetch("data/ryby.json")
      .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(arr){ if(Array.isArray(arr)) fishData = arr; })
      .catch(function(){ fishData = []; })
      .finally(function(){ renderFish(); });
    fetch("data/przynety.json")
      .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(arr){ if(Array.isArray(arr)) lureData = arr; })
      .catch(function(){ lureData = []; })
      .finally(function(){ renderLures(); });
  }

  loadDataFiles();

  // ===== DZIENNIK POŁOWÓW =====
  const CATCH_KEY = "odraCatches";
  function loadCatches(){ try{ return JSON.parse(localStorage.getItem(CATCH_KEY) || "[]"); } catch(e){ return []; } }
  function persistCatches(list){ try{ localStorage.setItem(CATCH_KEY, JSON.stringify(list)); return true; } catch(e){ return false; } }

  function addCatch(){
    const date = document.getElementById("cDate").value;
    const angler = document.getElementById("cAngler").value.trim();
    const species = document.getElementById("cSpecies").value;
    const length = parseFloat(document.getElementById("cLength").value) || 0;
    const weight = parseFloat(document.getElementById("cWeight").value) || 0;
    const lure = document.getElementById("cLure").value.trim();
    const spot = document.getElementById("cSpot").value.trim();
    const weather = document.getElementById("cWeather").value.trim();
    const photo = document.getElementById("cPhoto").value.trim();
    const note = document.getElementById("cNote").value.trim();
    const hint = document.getElementById("cHint");
    if(!species){ hint.textContent = "Wybierz gatunek."; return; }
    if(!angler){ hint.textContent = "Podaj wędkarza."; return; }
    const list = loadCatches();
    list.unshift({ date: date, angler: angler, species: species, length: length, weight: weight, lure: lure, spot: spot, weather: weather, photo: photo, note: note });
    const ok = persistCatches(list);
    ["cDate","cAngler","cLength","cWeight","cLure","cSpot","cWeather","cPhoto","cNote"].forEach(function(id){ document.getElementById(id).value = ""; });
    document.getElementById("cSpecies").value = "";
    renderCatches();
    if(ok){ hint.textContent = "✅ Zapisano połów."; }
    else { hint.textContent = "⚠️ Dodano, ale zapis nie zadziałał (pamięć zablokowana)."; }
  }

  function renderCatches(){
    const tbody = document.getElementById("catchBody");
    const list = loadCatches();
    const fSpecies = (document.getElementById("cFilterSpecies").value || "").toLowerCase().trim();
    const fAngler = (document.getElementById("cFilterAngler").value || "").toLowerCase().trim();
    tbody.innerHTML = "";
    const filtered = list.filter(function(c){
      const s = (c.species || "").toLowerCase();
      const a = (c.angler || "").toLowerCase();
      return (!fSpecies || s.indexOf(fSpecies) !== -1) && (!fAngler || a.indexOf(fAngler) !== -1);
    });
    if(filtered.length === 0){
      tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:20px;">Brak połowów — dodaj pierwszy powyżej. 🎣</td></tr>';
    }
    filtered.forEach(function(c, i){
      const tr = document.createElement("tr");
      const tdDate = document.createElement("td"); tdDate.textContent = c.date || "—";
      const tdAngler = document.createElement("td"); tdAngler.textContent = c.angler || "—";
      const tdSpecies = document.createElement("td"); tdSpecies.innerHTML = '<span class="species">' + (c.species || "—") + '</span>';
      const tdLength = document.createElement("td"); tdLength.textContent = c.length ? c.length + " cm" : "—";
      const tdWeight = document.createElement("td"); tdWeight.textContent = c.weight ? c.weight + " kg" : "—";
      const tdLure = document.createElement("td"); tdLure.textContent = c.lure || "—";
      const tdSpot = document.createElement("td"); tdSpot.textContent = c.spot || "—";
      const tdWeather = document.createElement("td"); tdWeather.textContent = c.weather || "—";
      const tdPhoto = document.createElement("td");
      if(c.photo){
        const a = document.createElement("a");
        a.href = c.photo; a.target = "_blank"; a.rel = "noopener"; a.textContent = "📷 Zobacz";
        tdPhoto.appendChild(a);
      } else { tdPhoto.textContent = "—"; }
      const tdNote = document.createElement("td"); tdNote.textContent = c.note || "—";
      const tdDel = document.createElement("td");
      const del = document.createElement("a");
      del.href = "#"; del.textContent = "✕"; del.style.color = "var(--muted)";
      del.onclick = function(e){
        e.preventDefault();
        const cur = loadCatches();
        cur.splice(i, 1);
        persistCatches(cur);
        renderCatches();
      };
      tdDel.appendChild(del);
      tr.appendChild(tdDate); tr.appendChild(tdAngler); tr.appendChild(tdSpecies);
      tr.appendChild(tdLength); tr.appendChild(tdWeight); tr.appendChild(tdLure);
      tr.appendChild(tdSpot); tr.appendChild(tdWeather); tr.appendChild(tdPhoto);
      tr.appendChild(tdNote); tr.appendChild(tdDel);
      tbody.appendChild(tr);
    });
    renderCatchStats(filtered);
    renderRecords();
    renderCharts();
  }

  function renderCatchStats(list){
    const box = document.getElementById("catchStats");
    if(!box) return;
    if(list.length === 0){ box.textContent = "Brak danych do statystyk."; return; }
    const total = list.length;
    const bySpecies = {};
    list.forEach(function(c){ bySpecies[c.species] = (bySpecies[c.species] || 0) + 1; });
    const topSpecies = Object.keys(bySpecies).sort(function(a,b){ return bySpecies[b]-bySpecies[a]; })[0];
    const maxLen = list.reduce(function(m,c){ return Math.max(m, c.length || 0); }, 0);
    const maxW = list.reduce(function(m,c){ return Math.max(m, c.weight || 0); }, 0);
    box.innerHTML = "Łącznie: <b>" + total + "</b> ryb · Najczęściej: <b>" + topSpecies + "</b> (" + bySpecies[topSpecies] + ") · Najdłuższa: <b>" + (maxLen ? maxLen + " cm" : "—") + "</b> · Najcięższa: <b>" + (maxW ? maxW + " kg" : "—") + "</b>";
  }

  function filterCatches(){ renderCatches(); }
  function clearCatchFilters(){
    document.getElementById("cFilterSpecies").value = "";
    document.getElementById("cFilterAngler").value = "";
    renderCatches();
  }

  function exportCatches(){ download("odra-polowy.json", JSON.stringify(loadCatches(), null, 2)); }
  function importCatches(input){
    const file = input.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = function(){
      try{
        const arr = JSON.parse(r.result);
        if(!Array.isArray(arr)) throw 0;
        const cur = loadCatches();
        persistCatches(arr.concat(cur));
        renderCatches();
        renderRecords();
        renderCharts();
        document.getElementById("cHint").textContent = "✅ Zaimportowano " + arr.length + " połowów.";
      }catch(e){ document.getElementById("cHint").textContent = "⚠️ Błędny plik JSON."; }
      input.value = "";
    };
    r.readAsText(file);
  }

  renderCatches();

  // ===== REKORDY OSOBISTE =====
  function renderRecords(){
    const box = document.getElementById("recordsBox");
    if(!box) return;
    const list = loadCatches();
    if(list.length === 0){ box.innerHTML = '<p class="kicker">Brak połowów — dodaj pierwszy w dzienniku, a tu pojawią się rekordy.</p>'; return; }
    const bySpecies = {};
    list.forEach(function(c){
      if(!bySpecies[c.species]) bySpecies[c.species] = [];
      bySpecies[c.species].push(c);
    });
    const speciesOrder = ["Szczupak","Sandacz","Okoń","Boleń","Sum","Kleń","Jaź","Brzana","Inny"];
    const html = [];
    speciesOrder.forEach(function(sp){
      if(!bySpecies[sp]) return;
      const catches = bySpecies[sp];
      const maxLen = catches.reduce(function(m,c){ return c.length > m.length ? c : m; }, {length:0});
      const maxW = catches.reduce(function(m,c){ return c.weight > m.weight ? c : m; }, {weight:0});
      html.push('<div class="spotcard"><div class="top"><h4>' + sp + '</h4></div>');
      html.push('<p class="note">Najdłuższa: <b>' + (maxLen.length ? maxLen.length + " cm" : "—") + '</b>' + (maxLen.angler ? " (" + maxLen.angler + ")" : "") + ' · Najcięższa: <b>' + (maxW.weight ? maxW.weight + " kg" : "—") + '</b>' + (maxW.angler ? " (" + maxW.angler + ")" : "") + '</p>');
      html.push('</div>');
    });
    box.innerHTML = html.join("");
  }

  renderRecords();

  // ===== WYKRESY STATYSTYK (Chart.js) =====
  function renderCharts(){
    if(typeof Chart === "undefined") return;
    const list = loadCatches();
    Object.keys(charts).forEach(function(k){ if(charts[k]) charts[k].destroy(); });
    charts = {};
    if(list.length === 0) return;

    const bySpecies = {};
    list.forEach(function(c){ bySpecies[c.species] = (bySpecies[c.species] || 0) + 1; });
    const spLabels = Object.keys(bySpecies);
    const spData = spLabels.map(function(s){ return bySpecies[s]; });
    const el1 = document.getElementById("chartSpecies");
    if(el1) charts.species = new Chart(el1, {
      type: "pie",
      data: { labels: spLabels, datasets: [{ data: spData, backgroundColor: ["#4fd1a5","#7fd8ff","#f2b35c","#ff8a8a","#a78bfa","#f472b6","#34d399","#fbbf24","#60a5fa"] }] },
      options: { plugins: { legend: { labels: { color: "#e8eef0" } } } }
    });

    const months = ["Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"];
    const monthCount = [0,0,0,0,0,0,0,0,0,0,0,0];
    list.forEach(function(c){
      if(c.date){
        const m = parseInt(c.date.split("-")[1], 10);
        if(m >= 1 && m <= 12) monthCount[m-1]++;
      }
    });
    const el2 = document.getElementById("chartMonths");
    if(el2) charts.months = new Chart(el2, {
      type: "bar",
      data: { labels: months, datasets: [{ label: "Połowy", data: monthCount, backgroundColor: "#4fd1a5" }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#9fb3ba" } }, y: { ticks: { color: "#9fb3ba" }, beginAtZero: true } } }
    });

    const lengths = list.map(function(c){ return c.length || 0; }).filter(function(v){ return v > 0; });
    const el3 = document.getElementById("chartLengths");
    if(el3 && lengths.length > 0){
      const buckets = [0,0,0,0,0,0];
      const labels = ["<30","30-40","40-50","50-60","60-70","70+"];
      lengths.forEach(function(l){
        if(l < 30) buckets[0]++;
        else if(l < 40) buckets[1]++;
        else if(l < 50) buckets[2]++;
        else if(l < 60) buckets[3]++;
        else if(l < 70) buckets[4]++;
        else buckets[5]++;
      });
      charts.lengths = new Chart(el3, {
        type: "bar",
        data: { labels: labels, datasets: [{ label: "Sztuki", data: buckets, backgroundColor: "#7fd8ff" }] },
        options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#9fb3ba" } }, y: { ticks: { color: "#9fb3ba" }, beginAtZero: true } } }
      });
    }

    const byLure = {};
    list.forEach(function(c){ if(c.lure){ byLure[c.lure] = (byLure[c.lure] || 0) + 1; } });
    const lureLabels = Object.keys(byLure).sort(function(a,b){ return byLure[b]-byLure[a]; }).slice(0, 6);
    const lureData = lureLabels.map(function(l){ return byLure[l]; });
    const el4 = document.getElementById("chartLures");
    if(el4 && lureLabels.length > 0) charts.lures = new Chart(el4, {
      type: "bar",
      data: { labels: lureLabels, datasets: [{ label: "Połowy", data: lureData, backgroundColor: "#f2b35c" }] },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#9fb3ba" }, beginAtZero: true }, y: { ticks: { color: "#9fb3ba" } } } }
    });
  }

  renderCharts();

  // ===== BAROMETR BRAŃ =====
  function calcBarometer(){
    const pressure = document.getElementById("bPressure").value;
    const sky = document.getElementById("bSky").value;
    const wind = document.getElementById("bWind").value;
    const res = document.getElementById("bResult");
    if(!pressure || !sky || !wind){ res.textContent = "Wybierz wszystkie trzy warunki."; res.style.color = "var(--warn)"; return; }
    let score = 0;
    const reasons = [];
    if(pressure === "stable"){ score += 2; reasons.push("stabilne ciśnienie"); }
    if(pressure === "falling"){ score += 1; reasons.push("spadające ciśnienie (okno przed burzą)"); }
    if(pressure === "rising"){ score += 1; reasons.push("rosnące ciśnienie (krótkie okno)"); }
    if(sky === "cloudy"){ score += 2; reasons.push("pochmurno"); }
    if(sky === "rain"){ score += 1; reasons.push("deszcz (mętna woda)"); }
    if(sky === "sunny"){ score += 0; reasons.push("pełne słońce (gorsze brania)"); }
    if(wind === "moderate"){ score += 1; reasons.push("umiarkowany wiatr"); }
    if(wind === "strong"){ score += 1; reasons.push("silny wiatr (napowietrza wodę)"); }
    if(wind === "calm"){ score += 0; reasons.push("cisza"); }
    let verdict, color;
    if(score >= 4){ verdict = "🟢 Warto iść — dobre warunki na brania."; color = "var(--accent)"; }
    else if(score >= 2){ verdict = "🟡 Średnio — można spróbować, ale bez fajerwerków."; color = "var(--warn)"; }
    else { verdict = "🔴 Raczej nie — trudne warunki, ryby mało aktywne."; color = "#ff8a8a"; }
    res.textContent = verdict + " (" + reasons.join(", ") + ")";
    res.style.color = color;
  }

  // ===== INTERAKTYWNY DOBÓR SPRZĘTU =====
  const GEAR = {
    szczupak: {
      wedka: "2,4–2,7 m, c.w. 7–28 g, akcja fast",
      kolowrotek: "3000, przełożenie 5:1",
      linka: "plecionka 0,12–0,14 mm (ok. 12 lb)",
      przypon: "stal/wolfram, min. 20–30 cm, 5–10 kg+",
      przynety: "gumy 10–20 cm (kopytka, shady), wahadłówki 12–20 g, obrotówki nr 3–5, jerki 8–12 cm",
      prowadzenie: "wolno, z pauzami; obrotówka wolno przy dnie; guma z opadu"
    },
    sandacz: {
      wedka: "2,7 m+, c.w. 10–40 g, akcja fast",
      kolowrotek: "3000, przełożenie 5:1",
      linka: "plecionka 0,12–0,16 mm",
      przypon: "fluorocarbon 0,25–0,33 mm, 50–80 cm (lub stal 15–25 cm przy ryzyku szczupaka)",
      przynety: "kopyta i smukłe shady 8–14 cm na główkach 10–25 g, woblery i cykady przy dnie",
      prowadzenie: "opad — rzuć, czekaj aż opadnie, potem skoki po dnie; branie często na opadaniu"
    },
    okon: {
      wedka: "2,4 m, c.w. 5–20 g, akcja fast",
      kolowrotek: "2500, przełożenie 5:1",
      linka: "plecionka 0,08–0,10 mm",
      przypon: "fluorocarbon cienki 0,20–0,25 mm (opcjonalnie)",
      przynety: "małe gumy 3–8 cm na główkach 2–7 g, obrotówki nr 0–2, cykady, koguty, małe woblery",
      prowadzenie: "skoki po dnie, opad, lekkie podrywanie"
    },
    bolen: {
      wedka: "2,4–2,7 m, c.w. 5–25 g, akcja fast",
      kolowrotek: "2500–3000, przełożenie 6:1 (szybsze)",
      linka: "plecionka 0,10–0,12 mm",
      przypon: "fluorocarbon cienki 0,20–0,28 mm",
      przynety: "smukłe woblery 7–12 cm imitujące ukleję, wąskie wahadłówki, cykady, rippery/pilkery 5–8 cm (białe/perłowe)",
      prowadzenie: "szybko, wysoko w toni; szukaj „chlapań\" bolenia"
    },
    sum: {
      wedka: "2,7 m+, c.w. 40 g+, akcja slow/regular",
      kolowrotek: "4000+ lub baitcaster, mocny",
      linka: "plecionka 0,16–0,20 mm (20 lb+)",
      przypon: "gruby, stalowy/wolframowy",
      przynety: "duże gumy 15–25 cm+, duże kopyta, ciężkie woblery na główkach 20–60 g",
      prowadzenie: "wolno przy dnie, nocą"
    },
    klen: {
      wedka: "2,4 m, c.w. 5–20 g, akcja fast",
      kolowrotek: "2500, przełożenie 5:1",
      linka: "plecionka 0,08–0,10 mm + fluorocarbon",
      przypon: "fluorocarbon cienki 0,20–0,28 mm",
      przynety: "małe woblery do ~4–5 cm, mikrogumy/twistery/rippery 3–7 cm, cykady, małe jigi",
      prowadzenie: "naturalnie, z nurtem"
    }
  };

  function showGear(){
    const sel = document.getElementById("gearSpecies").value;
    const box = document.getElementById("gearResult");
    if(!sel){ box.innerHTML = '<p class="kicker">Wybierz rybę, aby zobaczyć zestaw.</p>'; return; }
    const g = GEAR[sel];
    if(!g){ box.innerHTML = '<p class="kicker">Brak danych.</p>'; return; }
    box.innerHTML =
      '<div class="spotcard">' +
      '<div class="top"><h4>Zestaw na ' + sel.charAt(0).toUpperCase() + sel.slice(1) + '</h4></div>' +
      '<p class="note"><b>Wędka:</b> ' + g.wedka + '</p>' +
      '<p class="note"><b>Kołowrotek:</b> ' + g.kolowrotek + '</p>' +
      '<p class="note"><b>Linka:</b> ' + g.linka + '</p>' +
      '<p class="note"><b>Przypon:</b> ' + g.przypon + '</p>' +
      '<p class="note"><b>Przynęty:</b> ' + g.przynety + '</p>' +
      '<p class="note"><b>Prowadzenie:</b> ' + g.prowadzenie + '</p>' +
      '</div>';
  }

