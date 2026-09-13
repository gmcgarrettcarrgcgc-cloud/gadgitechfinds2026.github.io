(function(){
  // GadgiTech storefront account bar — Google sign-in (Supabase Auth) + a
  // real, working local+synced cart with a viewable panel. NOT used on
  // /hub.html — that stays on its own password-key gate, untouched.
  var SUPABASE_URL = "https://gjyisxcrvknsqyzseost.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_53UB2Eg1wngnmSxaTA6nSg_TeCC2N6c";
  var OWNER_EMAIL = "gmcgarrettcarr.gc.gc@gmail.com"; // the owner — sent straight to the Command Hub
  var HUB_URL = "/hub.html";
  var CART_KEY = "gt_cart_v1";

  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function money(n){ n = Number(n) || 0; return "$" + n.toFixed(2).replace(/\.00$/, ""); }

  function getLocalCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch(e){ return []; } }
  function setLocalCart(items){ try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch(e){} }

  var sbClient = null; // set once supabase-js loads and a client is created
  var cartPanelOpen = false;

  function pushCartToServer(){
    if (!sbClient) return; // nothing to sync yet — stays local until sign-in loads
    sbClient.auth.getSession().then(function(r){
      var user = r.data && r.data.session && r.data.session.user;
      if (!user) return;
      sbClient.from("carts").upsert({ user_id: user.id, items: getLocalCart(), updated_at: new Date().toISOString() }).then(function(){});
    });
  }

  // ---- Public API other page scripts (shop.html, index.html buy buttons) use ----
  window.gtCart = {
    get: getLocalCart,
    add: function(item){
      var c = getLocalCart();
      var existing = item.id ? c.find(function(x){ return x.id === item.id; }) : null;
      if (existing) { existing.qty = (existing.qty || 1) + 1; }
      else { item.qty = 1; c.push(item); }
      setLocalCart(c);
      pushCartToServer();
      renderCartPill();
      if (cartPanelOpen) renderCartPanel();
      flashAdded();
    },
    removeAt: function(idx){
      var c = getLocalCart();
      c.splice(idx, 1);
      setLocalCart(c);
      pushCartToServer();
      renderCartPill();
      renderCartPanel();
    },
    clear: function(){ setLocalCart([]); pushCartToServer(); renderCartPill(); renderCartPanel(); }
  };

  function cartTotal(){ return getLocalCart().reduce(function(sum, it){ return sum + (Number(it.price)||0) * (it.qty||1); }, 0); }
  function cartCount(){ return getLocalCart().reduce(function(sum, it){ return sum + (it.qty||1); }, 0); }

  function ensureCartPill(){
    var pill = document.getElementById("gt-cart-pill");
    if (pill) return pill;
    pill = document.createElement("button");
    pill.id = "gt-cart-pill";
    pill.style.cssText = "position:fixed;top:12px;right:150px;z-index:99998;background:#0c1a14;border:1px solid #1c3328;color:#eaf5ee;border-radius:20px;padding:8px 14px;font:700 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);display:flex;align-items:center;gap:6px";
    pill.onclick = function(){ cartPanelOpen = !cartPanelOpen; renderCartPanel(); };
    document.body.appendChild(pill);
    return pill;
  }

  function renderCartPill(){
    var pill = ensureCartPill();
    var n = cartCount();
    pill.innerHTML = "🛒 Cart" + (n ? ' <span style="background:#3fe0a0;color:#04211a;border-radius:10px;padding:1px 7px;font-size:11.5px">' + n + "</span>" : "");
    // reposition left of the account bar if present, else keep default
    var bar = document.getElementById("gt-auth-bar");
    if (bar) {
      var w = bar.offsetWidth || 170;
      pill.style.right = (12 + w + 10) + "px";
    }
  }

  function flashAdded(){
    var pill = ensureCartPill();
    var prev = pill.style.borderColor;
    pill.style.borderColor = "#3fe0a0";
    setTimeout(function(){ pill.style.borderColor = prev || "#1c3328"; }, 500);
  }

  function renderCartPanel(){
    var panel = document.getElementById("gt-cart-panel");
    if (!cartPanelOpen) { if (panel) panel.remove(); return; }
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "gt-cart-panel";
      panel.style.cssText = "position:fixed;top:56px;right:12px;z-index:99999;background:#0c1a14;border:1px solid #1c3328;border-radius:14px;padding:14px;width:300px;max-width:calc(100vw - 24px);max-height:70vh;overflow:auto;color:#eaf5ee;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.5)";
      document.body.appendChild(panel);
    }
    var items = getLocalCart();
    if (!items.length) {
      panel.innerHTML = '<div style="font-weight:800;margin-bottom:8px">Your cart</div><div style="color:#8fae9f">Empty — add something from the shop.</div>';
      return;
    }
    var rows = items.map(function(it, i){
      return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #1c3328">' +
        '<div style="flex:1"><div style="font-weight:700">' + esc(it.title) + (it.qty > 1 ? " ×" + it.qty : "") + '</div>' +
        '<div style="color:#8fae9f">' + money(it.price) + (it.qty > 1 ? " each" : "") + '</div>' +
        (it.url ? '<a href="' + esc(it.url) + '" style="color:#3fe0a0;font-weight:700;display:inline-block;margin-top:4px">Buy this →</a>' : '') +
        '</div>' +
        '<button data-i="' + i + '" class="gt-cart-remove" style="background:#1c3328;color:#eaf5ee;border:0;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:11px">Remove</button>' +
        '</div>';
    }).join("");
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-weight:800">Your cart</div><div style="font-weight:800;color:#3fe0a0">' + money(cartTotal()) + '</div></div>' +
      rows +
      '<p style="color:#8fae9f;font-size:11.5px;margin:10px 0 0">Each item checks out through its own secure Stripe link — click "Buy this" per item. Multi-item one-click checkout isn\'t wired up yet.</p>' +
      '<button id="gt-cart-clear" style="margin-top:8px;width:100%;background:#1c3328;color:#eaf5ee;border:0;border-radius:8px;padding:8px;cursor:pointer;font-weight:700">Clear cart</button>';
    panel.querySelectorAll(".gt-cart-remove").forEach(function(b){
      b.onclick = function(){ window.gtCart.removeAt(Number(b.getAttribute("data-i"))); };
    });
    var clearBtn = document.getElementById("gt-cart-clear");
    if (clearBtn) clearBtn.onclick = function(){ window.gtCart.clear(); };
  }

  // ---- Google sign-in (Supabase) — loads async, cart above works without it ----
  function loadSupabaseJs(cb){
    if (window.supabase && window.supabase.createClient) return cb();
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
    s.onload = cb;
    s.onerror = function(){ /* offline / blocked CDN — fail quiet, cart still works locally */ };
    document.head.appendChild(s);
  }

  function initAuth(){
    if (!window.supabase || !window.supabase.createClient) return;
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    sbClient = sb;

    function pullCartThenRender(user){
      sb.from("carts").select("items").eq("user_id", user.id).maybeSingle().then(function(res){
        var remote = res && res.data && res.data.items;
        var local = getLocalCart();
        if (remote && remote.length && !local.length) {
          setLocalCart(remote);
        } else if (local.length) {
          pushCartToServer();
        }
        renderCartPill();
        if (cartPanelOpen) renderCartPanel();
        renderAuth();
      }).catch(function(){ renderAuth(); });
    }

    var bar = document.getElementById("gt-auth-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "gt-auth-bar";
      bar.style.cssText = "position:fixed;top:12px;right:12px;z-index:99997;font:13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;";
      document.body.appendChild(bar);
    }

    function renderAuth(){
      sb.auth.getSession().then(function(r){
        var session = r.data && r.data.session;
        if (session && session.user) {
          var email = session.user.email || "";
          if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
            location.href = HUB_URL;
            return;
          }
          var name = (session.user.user_metadata && session.user.user_metadata.name) || email.split("@")[0] || "there";
          bar.innerHTML =
            '<div style="background:#0c1a14;border:1px solid #1c3328;border-radius:20px;padding:6px 8px 6px 14px;display:flex;align-items:center;gap:10px;color:#eaf5ee;box-shadow:0 6px 20px rgba(0,0,0,.35)">' +
              '<span>Hi, ' + esc(name) + '</span>' +
              '<button id="gt-signout" style="background:#1c3328;color:#eaf5ee;border:0;border-radius:14px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:600">Sign out</button>' +
            '</div>';
          var btn = document.getElementById("gt-signout");
          if (btn) btn.onclick = function(){ sb.auth.signOut().then(function(){ location.reload(); }); };
        } else {
          bar.innerHTML =
            '<button id="gt-signin" style="background:linear-gradient(100deg,#5fd97a,#3fe0a0);color:#04211a;border:0;border-radius:20px;padding:9px 16px;font-weight:800;cursor:pointer;font-size:13px;box-shadow:0 6px 20px rgba(63,224,160,.28)">Sign in with Google</button>';
          var btn = document.getElementById("gt-signin");
          if (btn) btn.onclick = function(){
            sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } });
          };
        }
        renderCartPill();
      });
    }

    sb.auth.onAuthStateChange(function(_event, session){
      if (session && session.user) { pullCartThenRender(session.user); } else { renderAuth(); }
    });

    sb.auth.getSession().then(function(r){
      var session = r.data && r.data.session;
      if (session && session.user) { pullCartThenRender(session.user); } else { renderAuth(); }
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    renderCartPill(); // cart works immediately, no waiting on Supabase
    loadSupabaseJs(initAuth);
  });
})();
