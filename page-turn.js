(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null;
  const motionAllowed=()=>document.documentElement.dataset.motion==='full'||(!reduced.matches&&document.documentElement.dataset.motion!=='reduced');
  const allowed=()=>motionAllowed()&&!document.hidden&&typeof window.St?.PageFlip==='function'&&typeof requestAnimationFrame==='function';
  function prepareRenderer(engine,duration){
    const render=engine.getRender(),controller=engine.getFlipController?.();
    if(!controller)return;
    const drawFrame=render.drawFrame.bind(render),startAnimation=render.startAnimation.bind(render);
    render.drawFrame=()=>{
      drawFrame();
      if(render.galileaDisposed||!render.flippingPage)return;
      // Surface role, not a near-zero angle, determines whether lifted paper is solid.
      render.flippingPage.getElement().dataset.pageTurnSurface='fold';
      if(render.getDirection()!==0||!render.rightPage)return;
      const points=controller.getCalculation()?.getBottomClipArea().filter(point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y));
      if(!points?.length)return;
      const {pageWidth:width,height}=render.getRect(),first=points[0];
      const ring=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height},{x:0,y:0},...points,first,{x:0,y:0}];
      // Cut the revealed region out of the old page instead of covering it with a background.
      const clip='polygon(evenodd, '+ring.map(point=>point.x+'px '+point.y+'px').join(', ')+')';
      const old=render.rightPage.getElement();old.style.clipPath=clip;old.style.webkitClipPath=clip;
      old.dataset.pageTurnSurface='flat';
    };
    render.startAnimation=(frames,time,onEnd)=>{
      if(controller.getCalculation()){
        const {pageWidth:width,height}=render.getRect();
        frames=Array.from({length:241},(_,index)=>()=>{
          const progress=index/240,eased=progress*progress*(3-2*progress);
          const position={x:width*(.94-1.94*eased),y:height-height*.34*Math.sin(Math.PI*(.06+.94*eased))};
          controller.fold(render.convertToGlobal(position));
        });
      }
      return startAnimation(frames,duration,onEnd);
    };
  }
  function cancel(){
    if(!active)return;
    const previous=active;active=null;
    clearTimeout(previous.timer);cancelAnimationFrame(previous.startFrame);
    previous.shell.classList.remove('page-turn-active');
    try{previous.engine.getRender().galileaDisposed=true;previous.engine.destroy();}
    finally{previous.layer.remove();previous.shell.classList.remove('page-turn-active');}
  }
  function capture(){
    cancel();
    const shell=document.getElementById('presentation-shell'),main=shell?.querySelector('.presentation-main');
    if(!allowed()||!main||!['bible','song'].includes(shell.dataset.presentationType)||!document.getElementById('presentation-dialog')?.open)return null;
    const mainBox=main.getBoundingClientRect(),head=main.querySelector('.presentation-head').getBoundingClientRect(),stage=main.querySelector('.presentation-stage').getBoundingClientRect(),parent=shell.getBoundingClientRect();
    const textBoxes=[...main.querySelectorAll('.presentation-title,.presentation-kicker')].map(node=>node.getBoundingClientRect()).filter(box=>box.height>0);
    const textTop=Math.min(head.top,...textBoxes.map(box=>box.top));
    const bounds={left:Math.min(head.left,stage.left),top:textTop,width:Math.max(head.right,stage.right)-Math.min(head.left,stage.left),height:stage.bottom-textTop};
    if(bounds.width<1||bounds.height<1)return null;
    const copy=main.cloneNode(true);
    const originals=[main,...main.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
    originals.forEach((node,index)=>{
      const style=getComputedStyle(node),clone=clones[index];
      clone.removeAttribute('id');clone.removeAttribute('aria-live');
      if(node.matches('.presentation-copy,.presentation-title,.presentation-verse-label,.presentation-kicker')){
        clone.style.setProperty('font-size',style.fontSize,'important');clone.style.lineHeight=style.lineHeight;clone.style.letterSpacing=style.letterSpacing;
      }
    });
    copy.classList.add('page-turn-page');copy.style.width=mainBox.width+'px';copy.style.setProperty('height',mainBox.height+'px','important');
    copy.style.setProperty('--present-scale',getComputedStyle(main).getPropertyValue('--present-scale'));
    return {shell,copy,width:bounds.width,height:bounds.height,left:bounds.left-parent.left,top:bounds.top-parent.top,copyLeft:mainBox.left-bounds.left,copyTop:mainBox.top-bounds.top};
  }
  function play(page,direction){
    if(!page||!allowed())return false;
    cancel();
    const next=capture();if(!next)return false;
    const {shell,width,height,left,top}=page;
    shell.classList.remove('presentation-enter-next','presentation-enter-prev');
    const layer=document.createElement('div');layer.className='page-turn-layer';layer.dataset.direction=direction<0?'prev':'next';layer.setAttribute('aria-hidden','true');layer.inert=true;
    Object.assign(layer.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
    const book=document.createElement('div');book.className='page-turn-book';layer.append(book);
    const makeSheet=snapshot=>{
      const sheet=document.createElement('div');sheet.className='page-turn-sheet';sheet.dataset.density='soft';sheet.dataset.pageTurnSurface='flat';
      snapshot.copy.style.left=snapshot.copyLeft+'px';snapshot.copy.style.setProperty('top',snapshot.copyTop+'px','important');
      sheet.append(snapshot.copy);return sheet;
    };
    const backwards=direction<0,oldSheet=makeSheet(page),newSheet=makeSheet(next);
    const sheets=backwards?[newSheet,oldSheet]:[oldSheet,newSheet];sheets.forEach(sheet=>book.append(sheet));shell.append(layer);
    const duration=innerWidth<=700?1200:1500;
    const engine=new window.St.PageFlip(book,{width,height,size:'fixed',usePortrait:true,autoSize:false,showCover:false,startPage:backwards?1:0,drawShadow:true,maxShadowOpacity:.55,flippingTime:duration,useMouseEvents:false,showPageCorners:false,mobileScrollSupport:false,disableFlipByClick:false});
    const current={shell,layer,engine,timer:0,startFrame:0,turning:false};active=current;
    shell.classList.add('page-turn-active');
    const finish=()=>{if(active===current)cancel();};
    engine.on('changeState',event=>{if(event.data==='read'&&current.turning)finish();});
    try{
      engine.loadFromHTML(sheets);
      prepareRenderer(engine,duration);
      current.startFrame=requestAnimationFrame(()=>{
        if(active!==current)return;
        current.turning=true;
        if(backwards)engine.flipPrev('bottom');else engine.flipNext('bottom');
      });
      current.timer=setTimeout(finish,duration+900);
    }catch(_){finish();return false;}
    return true;
  }
  window.GalileaPageTurn=Object.freeze({capture,play,cancel});
  reduced.addEventListener('change',cancel);
  new MutationObserver(cancel).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  window.addEventListener('resize',cancel,{passive:true});document.addEventListener('fullscreenchange',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});window.addEventListener('pagehide',cancel);
})();
