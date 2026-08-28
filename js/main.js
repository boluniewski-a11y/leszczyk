// BIBLIOTEKA LINKÓW — własne linki w localStorage (bezpieczny fallback, gdyby storage był zablokowany)
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
  }

  function addSpot(){
    const name = document.getElementById("spName").value.trim();
    const fish = document.getElementById("spFish").value.trim();
    const link = document.getElementById("spLink").value.trim();
    const note = document.getElementById("spNote").value.trim();
    const hint = document.getElementById("spHint");
    if(!link){ hint.textContent = "Wklej link Google Maps lub współrzędne."; return; }
    if(!name){ hint.textContent = "Podaj nazwę miejscówki."; return; }

    const list = loadSpots();
    list.unshift({ name: name, fish: fish, link: link, note: note });
    const ok = persistSpots(list);
    document.getElementById("spName").value = "";
    document.getElementById("spFish").value = "";
    document.getElementById("spLink").value = "";
    document.getElementById("spNote").value = "";
    renderSpots();
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
      .finally(function(){ renderSpots(); });
  }

  loadFileSpots();


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

