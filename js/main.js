// ===== TBRC shared site scripts =====
(function(){
  // header shadow on scroll
  var hdr=document.querySelector('header.site');
  if(hdr){
    var onScroll=function(){hdr.classList.toggle('scrolled',window.scrollY>10)};
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  }

  // mobile menu
  var burger=document.getElementById('burger');
  var menu=document.getElementById('menu');
  var backdrop=document.getElementById('navBackdrop');
  function closeMenu(){if(menu)menu.classList.remove('open');if(burger)burger.classList.remove('open');if(backdrop)backdrop.classList.remove('open');document.body.style.overflow=''}
  if(burger&&menu){
    burger.addEventListener('click',function(){
      var open=menu.classList.toggle('open');
      burger.classList.toggle('open',open);
      if(backdrop)backdrop.classList.toggle('open',open);
      document.body.style.overflow=open?'hidden':'';
    });
  }
  if(backdrop)backdrop.addEventListener('click',closeMenu);
  // tapping any real navigation link closes the panel (toggle buttons excluded)
  if(menu){
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){closeMenu();});
    });
  }

  // Mobile submenu: the toggle button (right side) expands/collapses.
  // The parent label is a normal link and always navigates — no interception.
  document.querySelectorAll('.submenu-toggle').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      var item=btn.closest('.item');
      if(!item)return;
      var nowOpen=!item.classList.contains('expanded');
      // close any others so only one is open at a time
      document.querySelectorAll('.menu .item.expanded').forEach(function(o){
        if(o!==item){o.classList.remove('expanded');var b=o.querySelector('.submenu-toggle');if(b)b.setAttribute('aria-expanded','false');}
      });
      item.classList.toggle('expanded',nowOpen);
      btn.setAttribute('aria-expanded',nowOpen?'true':'false');
    });
  });

  // scroll reveal
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  // count-up
  function animate(el){
    var target=parseFloat(el.dataset.count),suffix=el.dataset.suffix||'',dur=1500,t0=performance.now();
    function tick(t){
      var p=Math.min((t-t0)/dur,1),eased=1-Math.pow(1-p,3);
      el.firstChild&&el.firstChild.nodeType===3?el.firstChild.textContent=Math.round(target*eased):el.textContent=Math.round(target*eased)+suffix;
      el.innerHTML=Math.round(target*eased)+'<span>'+suffix+'</span>';
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var so=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){animate(e.target);so.unobserve(e.target)}});
  },{threshold:.6});
  document.querySelectorAll('.num[data-count]').forEach(function(el){so.observe(el)});

  // gallery lightbox
  var imgs=document.querySelectorAll('.gallery img');
  if(imgs.length){
    var lb=document.createElement('div');
    lb.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;z-index:200;padding:30px;cursor:zoom-out';
    lb.innerHTML='<img style="max-width:92vw;max-height:90vh;border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,.6)">';
    document.body.appendChild(lb);
    var lbImg=lb.querySelector('img');
    imgs.forEach(function(im){im.style.cursor='zoom-in';im.addEventListener('click',function(){lbImg.src=im.src;lb.style.display='flex'})});
    lb.addEventListener('click',function(){lb.style.display='none'});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.style.display='none'});
  }

  // Quote form: submits seamlessly via Web3Forms (AJAX). Falls back to mailto
  // if the access key hasn't been set yet, so the form is never broken.
  var form=document.getElementById('quoteForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var get=function(n){var f=form.querySelector('[name="'+n+'"]');return f?f.value.trim():''};
      var note=document.getElementById('formNote');
      var btn=form.querySelector('button[type="submit"]');

      // ----- validate -----
      var required=['name','email','phone','message'];
      var firstBad=null;
      required.forEach(function(n){
        var f=form.querySelector('[name="'+n+'"]');
        if(f){
          if(!f.value.trim()){f.style.borderColor='#c0392b';if(!firstBad)firstBad=f;}
          else{f.style.borderColor='';}
        }
      });
      var emailField=form.querySelector('[name="email"]');
      if(emailField&&emailField.value.trim()&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailField.value.trim())){
        emailField.style.borderColor='#c0392b';if(!firstBad)firstBad=emailField;
      }
      if(firstBad){
        firstBad.focus();
        if(note){note.textContent='Please fill in your name, email, phone, and message.';note.style.color='#c0392b';}
        return;
      }

      var keyField=form.querySelector('[name="access_key"]');
      var key=keyField?keyField.value.trim():'';
      var hasKey=key && key!=='YOUR_ACCESS_KEY_HERE';

      // ----- fallback: if the Web3Forms key isn't set yet, ask them to call -----
      if(!hasKey){
        if(note){note.innerHTML='Online requests aren\'t active yet. Please call us at <a href="tel:8009688272">800-968-8272</a> to get started.';note.style.color='#c0392b';}
        return;
      }

      // ----- seamless: Web3Forms AJAX submit -----
      var origBtn=btn?btn.textContent:'';
      if(btn){btn.disabled=true;btn.textContent='Sending…';}
      if(note){note.textContent='';note.style.color='';}

      var data=new FormData(form);
      fetch('https://api.web3forms.com/submit',{
        method:'POST',
        headers:{'Accept':'application/json'},
        body:data
      })
      .then(function(r){return r.json();})
      .then(function(res){
        if(res.success){
          form.innerHTML='<div style="text-align:center;padding:24px 8px">'+
            '<div style="width:64px;height:64px;margin:0 auto 18px;border-radius:50%;background:rgba(39,114,185,.12);display:grid;place-items:center">'+
            '<svg viewBox="0 0 24 24" width="32" height="32" fill="none"><path d="M5 12.5l4.2 4.2L19 7" stroke="#2772B9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
            '<h3 style="font-size:1.4rem;font-weight:800">Thank you — your request is in.</h3>'+
            '<p style="color:#646e76;margin-top:10px">A TBRC specialist will be in touch within one business day. Need to reach us sooner? Call <a href="tel:8009688272" style="color:#2772B9;font-weight:600">800-968-8272</a>.</p>'+
            '</div>';
        }else{
          if(btn){btn.disabled=false;btn.textContent=origBtn;}
          if(note){note.innerHTML='Something went wrong sending your request. Please call us at <a href="tel:8009688272">800-968-8272</a>.';note.style.color='#c0392b';}
        }
      })
      .catch(function(){
        if(btn){btn.disabled=false;btn.textContent=origBtn;}
        if(note){note.innerHTML='Couldn\'t reach us right now. Please call us at <a href="tel:8009688272">800-968-8272</a>.';note.style.color='#c0392b';}
      });
    });
  }
})();
