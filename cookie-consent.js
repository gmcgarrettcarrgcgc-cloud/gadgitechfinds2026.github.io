(function(){
  var KEY='gt_cookie_consent_v1';
  function get(){ try{ return localStorage.getItem(KEY);}catch(e){ return null; } }
  function set(v){ try{ localStorage.setItem(KEY,v);}catch(e){} }
  function apply(v){
    document.documentElement.setAttribute('data-gt-consent', v||'unknown');
    // Optional marketing/analytics scripts must check data-gt-consent === 'accepted'
    // before injecting. Essential checkout (Stripe Payment Links) is not gated.
    if(v==='accepted'){
      document.dispatchEvent(new CustomEvent('gt-consent-accepted'));
    } else {
      document.dispatchEvent(new CustomEvent('gt-consent-rejected'));
    }
  }
  function hide(){ var el=document.getElementById('gt-consent'); if(el) el.classList.add('hidden'); }
  function show(){ var el=document.getElementById('gt-consent'); if(el) el.classList.remove('hidden'); }
  function openPrefs(e){ if(e) e.preventDefault(); show(); }
  window.gtOpenCookiePrefs = openPrefs;
  var existing=get();
  if(existing==='accepted' || existing==='rejected'){ apply(existing); }
  else { apply('unknown'); }
  document.addEventListener('DOMContentLoaded', function(){
    if(existing==='accepted' || existing==='rejected'){ hide(); return; }
    var root=document.getElementById('gt-consent');
    if(!root){
      root=document.createElement('div');
      root.id='gt-consent';
      root.innerHTML='<p><strong>Cookies &amp; privacy.</strong> We use essential storage for your cookie choice. Optional analytics/marketing cookies are off unless you accept. See our <a href="/privacy.html">Privacy Policy</a>.</p><div class="row"><button type="button" class="accept" data-gt="accept">Accept optional</button><button type="button" class="reject" data-gt="reject">Reject optional</button><a class="btn reject" href="/privacy.html">Privacy</a></div>';
      document.body.appendChild(root);
    }
    root.addEventListener('click', function(ev){
      var t=ev.target;
      if(!t || !t.getAttribute) return;
      var a=t.getAttribute('data-gt');
      if(a==='accept'){ set('accepted'); apply('accepted'); hide(); }
      if(a==='reject'){ set('rejected'); apply('rejected'); hide(); }
    });
    var links=document.querySelectorAll('[data-gt-cookie-prefs]');
    links.forEach(function(a){ a.addEventListener('click', openPrefs); });
  });
})();