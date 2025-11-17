    // Subtle parallax for hero blobs (optional)
    (function(){
      const hero = document.querySelector('.hero.hero-pro');
      if (!hero) return;
      const blobs = hero.querySelectorAll('.blob');
      let raf = 0;
      function onMove(e){
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=>{
          const r = hero.getBoundingClientRect();
          const cx = (e.clientX - r.left) / r.width - 0.5;
          const cy = (e.clientY - r.top) / r.height - 0.5;
          blobs.forEach((b, i)=>{
            const depth = (i+1)*5;
            b.style.transform = `translate3d(${cx*depth*6}px, ${cy*depth*-6}px, 0)`;
          });
        });
      }
      hero.addEventListener('mousemove', onMove);
      hero.addEventListener('mouseleave', ()=>{ blobs.forEach(b=>b.style.transform='translate3d(0,0,0)'); });
    })();
