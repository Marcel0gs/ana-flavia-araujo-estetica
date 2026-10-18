/* Ana Flavia Araujo Estetica: script das paginas de tratamento.
   1. topo e botao flutuante   2. entrada ao rolar   3. parallax da foto
   4. galeria: a foto grande (dialog), com setas, teclado e arrasto */
(function(){
  "use strict";
  var d = document.documentElement;
  var reduzido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var temObs = "IntersectionObserver" in window;
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- 1. topo e botao flutuante ---------- */
  var topo = $(".topo"), zap = $(".zap");
  function aoRolar(){
    var y = window.pageYOffset || d.scrollTop || 0;
    if (topo) topo.classList.toggle("topo--rolado", y > 12);
    if (zap) zap.classList.toggle("zap--on", y > innerHeight * .45);
  }
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  /* ---------- 2. entrada ao rolar ---------- */
  var revs = $$("[data-rev]");
  if (revs.length && temObs && !reduzido) {
    d.classList.add("rev-on");
    var obsR = new IntersectionObserver(function(itens){
      itens.forEach(function(it){
        if (!it.isIntersecting) return;
        it.target.classList.add("visto");
        obsR.unobserve(it.target);
      });
    }, { threshold: .15, rootMargin: "0px 0px -6% 0px" });
    revs.forEach(function(el){ obsR.observe(el); });
  }

  /* ---------- 3. parallax (translate, nao transform: a animacao da foto usa scale) ---------- */
  var camadas = reduzido ? [] : $$("[data-px]").map(function(el){
    return { el: el, v: parseFloat(el.getAttribute("data-px")) || 0, pai: el.closest("[data-px-pai]") || el.parentElement };
  });
  var pedidoP = false;
  function parallax(){
    pedidoP = false;
    var meio = innerHeight / 2, fator = innerWidth < 700 ? .5 : 1;
    camadas.forEach(function(c){
      var r = c.pai.getBoundingClientRect();
      if (r.bottom < -300 || r.top > innerHeight + 300) return;
      c.el.style.translate = "0 " + (((r.top + r.height / 2) - meio) * c.v * fator).toFixed(1) + "px";
    });
  }
  if (camadas.length) {
    var pedeP = function(){ if (!pedidoP) { pedidoP = true; requestAnimationFrame(parallax); } };
    addEventListener("scroll", pedeP, { passive: true });
    addEventListener("resize", pedeP);
    parallax();
  }

  /* ---------- 4. galeria: a foto grande ----------
     So os quadros com data-luz abrem aqui (o do video vai direto pro
     Instagram). Sem suporte a <dialog>, o link abre a imagem sozinha. */
  var fotos = $$("[data-luz]");
  var temDialog = typeof document.createElement("dialog").showModal === "function";
  if (!fotos.length || !temDialog) return;

  var icone = function(id){ return '<svg class="i" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var luz = document.createElement("dialog");
  luz.className = "luz" + (fotos.length < 2 ? " luz--uma" : "");
  luz.setAttribute("aria-label", "Foto ampliada");
  luz.innerHTML =
    '<figure class="luz__fig"><img alt=""><figcaption></figcaption></figure>' +
    '<span class="luz__conta" aria-live="polite"></span>' +
    '<button class="luz__btn luz__fechar" type="button" aria-label="Fechar">' + icone("i-x") + '</button>' +
    '<button class="luz__btn luz__ant" type="button" aria-label="Foto anterior">' + icone("i-esq") + '</button>' +
    '<button class="luz__btn luz__prox" type="button" aria-label="Próxima foto">' + icone("i-dir") + '</button>';
  document.body.appendChild(luz);
  var img = $("img", luz), leg = $("figcaption", luz), conta = $(".luz__conta", luz), atual = 0;

  function mostra(n){
    atual = (n + fotos.length) % fotos.length;
    var a = fotos[atual], mini = $("img", a);
    luz.classList.remove("troca"); void luz.offsetWidth; luz.classList.add("troca");
    img.src = a.getAttribute("href");
    img.alt = mini ? mini.alt : "";
    leg.textContent = a.getAttribute("data-legenda") || "";
    conta.textContent = (atual + 1) + " / " + fotos.length;
  }
  fotos.forEach(function(a, i){
    a.addEventListener("click", function(e){
      e.preventDefault();
      mostra(i);
      luz.showModal();
    });
  });
  $(".luz__fechar", luz).addEventListener("click", function(){ luz.close(); });
  $(".luz__ant", luz).addEventListener("click", function(){ mostra(atual - 1); });
  $(".luz__prox", luz).addEventListener("click", function(){ mostra(atual + 1); });
  /* clique no fundo escuro fecha; na foto, nao */
  luz.addEventListener("click", function(e){ if (e.target === luz || e.target.classList.contains("luz__fig")) luz.close(); });
  luz.addEventListener("keydown", function(e){
    if (e.key === "ArrowRight") mostra(atual + 1);
    else if (e.key === "ArrowLeft") mostra(atual - 1);
  });
  var x0 = null;
  luz.addEventListener("touchstart", function(e){ x0 = e.touches[0].clientX; }, { passive: true });
  luz.addEventListener("touchend", function(e){
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45 && fotos.length > 1) mostra(atual + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
  /* ---------- cursor: os arcos da placa seguindo o mouse ----------
     Molde da Bem Viver. O anel de fora atrasa mais que o de dentro; o
     clique solta o respingo de pontinhos da placa. */
  if (!reduzido && window.matchMedia && matchMedia("(pointer: fine)").matches) {
    var cur = document.createElement("div");
    cur.className = "cursor cursor--fora";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<span class="cursor__anel"></span><span class="cursor__anel"></span>';
    document.body.appendChild(cur);
    var aneis = Array.prototype.slice.call(cur.children);
    var alvo = { x: -100, y: -100 };
    var pos = aneis.map(function(){ return { x: -100, y: -100 }; });
    var VEL = [0.14, 0.34];   /* anel de fora, anel de dentro */
    var rodando = false;
    var CLICAVEL = "a,button,label,summary,input,select,textarea,[role=button],[role=tab]";
    var ESCURO = ".secao--grafite,.secao--salvia,.exp,.rodape";
    var passo = function(){
      var mexeu = false;
      aneis.forEach(function(a, i){
        var q = pos[i];
        q.x += (alvo.x - q.x) * VEL[i];
        q.y += (alvo.y - q.y) * VEL[i];
        if (Math.abs(alvo.x - q.x) > .2 || Math.abs(alvo.y - q.y) > .2) mexeu = true;
        a.style.transform = "translate3d(" + q.x.toFixed(1) + "px," + q.y.toFixed(1) + "px,0)";
      });
      if (mexeu) requestAnimationFrame(passo); else rodando = false;
    };
    document.addEventListener("pointermove", function(e){
      if (e.pointerType !== "mouse") return;
      alvo.x = e.clientX; alvo.y = e.clientY;
      if (cur.classList.contains("cursor--fora")) {
        pos.forEach(function(q){ q.x = alvo.x; q.y = alvo.y; });
        cur.classList.remove("cursor--fora");
      }
      var t = e.target && e.target.closest ? e.target : null;
      cur.classList.toggle("cursor--sobre", !!(t && t.closest(CLICAVEL)));
      cur.classList.toggle("cursor--escuro", !!(t && t.closest(ESCURO)));
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }, { passive: true });
    document.addEventListener("mouseout", function(e){ if (!e.relatedTarget) cur.classList.add("cursor--fora"); });
    document.addEventListener("pointerdown", function(e){
      if (e.pointerType !== "mouse") return;
      var cores = cur.classList.contains("cursor--escuro")
        ? ["var(--nude-vivo)", "var(--nude)", "var(--salvia)"]
        : ["var(--grafite)", "var(--nude-forte)", "var(--salvia)"];
      for (var k = 0; k < 10; k++) {
        var p = document.createElement("span");
        var ang = Math.random() * Math.PI * 2, dist = 18 + Math.random() * 40, tam = 2 + Math.round(Math.random() * 4);
        p.className = "respingo";
        p.style.width = p.style.height = tam + "px";
        p.style.background = cores[k % cores.length];
        p.style.setProperty("--x0", e.clientX + "px");
        p.style.setProperty("--y0", e.clientY + "px");
        p.style.setProperty("--x1", (e.clientX + Math.cos(ang) * dist).toFixed(1) + "px");
        p.style.setProperty("--y1", (e.clientY + Math.sin(ang) * dist).toFixed(1) + "px");
        document.body.appendChild(p);
        setTimeout(function(el){ return function(){ if (el.parentNode) el.parentNode.removeChild(el); }; }(p), 760);
      }
    });
  }
})();
