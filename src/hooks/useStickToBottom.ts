import { useCallback, useEffect, useRef, useState } from 'react';

const SLACK = 48;

export const useStickToBottom = () => {
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const lastTouch = useRef(0);
  const [scrolled, setScrolled] = useState(false);

  const jump = useCallback((behavior: ScrollBehavior) => {
    const node = scroller.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const pin = useCallback(() => {
    pinned.current = true;
    jump('smooth');
  }, [jump]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;

    const atBottom = () => node.scrollHeight - node.scrollTop - node.clientHeight <= SLACK;

    const onScroll = () => {
      if (atBottom()) pinned.current = true;
      setScrolled(node.scrollTop > 4);
    };

    const release = () => {
      pinned.current = false;
    };

    const onWheel = (event: WheelEvent) => (event.deltaY < 0 ? release() : undefined);

    const onTouchStart = (event: TouchEvent) => {
      lastTouch.current = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) =>
      (event.touches[0]?.clientY ?? 0) > lastTouch.current ? release() : undefined;

    const onKeyDown = (event: KeyboardEvent) =>
      event.key === 'PageUp' || event.key === 'Home' || event.key === 'ArrowUp'
        ? release()
        : undefined;

    const follow = () => {
      if (pinned.current) jump('auto');
    };

    const observer = new ResizeObserver(follow);
    const content = node.firstElementChild;
    if (content) observer.observe(content);

    node.addEventListener('scroll', onScroll, { passive: true });
    node.addEventListener('wheel', onWheel, { passive: true });
    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: true });
    node.addEventListener('keydown', onKeyDown);

    return () => {
      node.removeEventListener('scroll', onScroll);
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
    };
  }, [jump]);

  return { scroller, pin, scrolled };
};
