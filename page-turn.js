(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null;
  const allowed=()=>!reduced.matches&&document.documentElement.dataset.motion!=='reduced'&&!document.hidden&&typeof Element.prototype.animate==='function'&&window.CSS?.supports('transform-style','preserve-3d');
  function cancel(){
    if(!active)return;
    const previous=active;active=null;
    clearTimeout(previous.timer);previous.animations.forEach(animation=>animation.cancel());previous.layer.remove();
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
    const {shell,copy,width,height,left,top,copyLeft,copyTop}=page;
    shell.classList.remove('presentation-enter-next','presentation-enter-prev');
    const layer=document.createElement('div');layer.className='page-turn-layer';layer.dataset.direction=direction<0?'prev':'next';layer.setAttribute('aria-hidden','true');layer.inert=true;
    Object.assign(layer.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
    const shadow=document.createElement('div');shadow.className='page-turn-shadow';layer.append(shadow);
    const count=innerWidth<=700?8:14,part=width/count,sign=direction<0?1:-1,duration=innerWidth<=700?620:760;
    const segments=[];let parent=layer;
    for(let index=0;index<count;index++){
      const column=direction<0?count-index-1:index;
      const segment=document.createElement('div');segment.className='page-turn-segment';segment.style.width=part+'px';
      segment.style.setProperty('--turn-width',width+'px');segment.style.setProperty('--turn-offset',(-column*part)+'px');
      segment.style.left=(index===0?(direction<0?width-part:0):(direction<0?-part:part))+'px';
      const front=document.createElement('div');front.className='page-turn-front';front.style.width=(part+.5)+'px';
      const back=document.createElement('div');back.className='page-turn-back';back.style.width=(part+.5)+'px';
      const content=copy.cloneNode(true);content.style.left=(copyLeft-column*part)+'px';content.style.setProperty('top',copyTop+'px','important');front.append(content);segment.append(front,back);parent.append(segment);parent=segment;segments.push(segment);
    }
    shell.append(layer);
    const options={duration,easing:'cubic-bezier(.35,.05,.2,1)',fill:'forwards'};
    const animations=segments.map((segment,index)=>segment.animate(index===0?
      [{transform:'rotateY(0deg)',offset:0},{transform:`rotateY(${sign*78}deg)`,offset:.45},{transform:`rotateY(${sign*135}deg)`,offset:.75},{transform:`rotateY(${sign*178}deg)`,offset:1}]:
      [{transform:'rotateY(0deg)',offset:0},{transform:`rotateY(${-sign*1.2}deg)`,offset:.45},{transform:`rotateY(${-sign*.6}deg)`,offset:.75},{transform:'rotateY(0deg)',offset:1}],options));
    animations.push(shadow.animate([{opacity:0},{opacity:.6,offset:.4},{opacity:0}],options));
    const current={layer,animations,timer:0};active=current;
    const finish=()=>{if(active===current)cancel();};
    current.timer=setTimeout(finish,duration+120);
    Promise.all(animations.map(animation=>animation.finished)).then(finish,finish);
    return true;
  }
  window.GalileaPageTurn=Object.freeze({capture,play,cancel});
  reduced.addEventListener('change',cancel);
  new MutationObserver(cancel).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  window.addEventListener('resize',cancel,{passive:true});document.addEventListener('fullscreenchange',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});window.addEventListener('pagehide',cancel);
})();
