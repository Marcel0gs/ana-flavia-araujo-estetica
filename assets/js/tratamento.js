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
})();
