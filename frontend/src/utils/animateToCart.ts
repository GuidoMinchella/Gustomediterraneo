export function animateToCart(startEl: HTMLElement, _imageUrl?: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const cartCandidates = Array.from(document.querySelectorAll('[data-cart-icon="true"]')) as HTMLElement[];
      const targetEl = cartCandidates.find((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });

      if (!targetEl) {
        resolve();
        return;
      }

      const startRect = startEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;
      const endX = targetRect.left + targetRect.width / 2;
      const endY = targetRect.top + targetRect.height / 2;

      const size = 28;
      const fly = document.createElement('div');
      // Paper airplane SVG (white fill, marroncino stroke)
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', `${size}`);
      svg.setAttribute('height', `${size}`);
      const body = document.createElementNS(svgNS, 'path');
      body.setAttribute('d', 'M3 11.5 L21 2.5 L12 21.5 L10 14.5 L3 12.5 Z');
      body.setAttribute('fill', '#FFFFFF');
      body.setAttribute('stroke', '#9C6B3D');
      body.setAttribute('stroke-width', '1.5');
      body.setAttribute('vector-effect', 'non-scaling-stroke');
      const line = document.createElementNS(svgNS, 'path');
      line.setAttribute('d', 'M12 12 L21 3');
      line.setAttribute('stroke', '#9C6B3D');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('fill', 'none');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(body);
      svg.appendChild(line);
      fly.appendChild(svg);

      fly.style.position = 'fixed';
      fly.style.left = `${startX - size / 2}px`;
      fly.style.top = `${startY - size / 2}px`;
      fly.style.width = `${size}px`;
      fly.style.height = `${size}px`;
      fly.style.zIndex = '9999';
      fly.style.pointerEvents = 'none';
      fly.style.transform = 'translate(0, 0) scale(1) rotate(-15deg)';
      fly.style.opacity = '1';
      fly.style.transition = 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1), opacity 750ms';
      fly.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.18))';

      document.body.appendChild(fly);

      // Force reflow before starting animation
      void fly.getBoundingClientRect();

      const dx = endX - startX;
      const dy = endY - startY;

      fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.6) rotate(-15deg)`;
      fly.style.opacity = '0.2';

      const cleanup = () => {
        fly.removeEventListener('transitionend', onEnd);
        fly.remove();
      };

      const bumpCart = () => {
        targetEl.classList.add('cart-bump');
        setTimeout(() => targetEl.classList.remove('cart-bump'), 350);
      };

      const onEnd = () => {
        cleanup();
        bumpCart();
        resolve();
      };

      fly.addEventListener('transitionend', onEnd);

      // Fallback in case transitionend doesn't fire
      setTimeout(() => {
        if (document.body.contains(fly)) {
          onEnd();
        }
      }, 1000);
    } catch (e) {
      resolve();
    }
  });
}