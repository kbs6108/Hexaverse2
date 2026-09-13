export type TopDockOptions = {
  proximity: number;
  spring: number;
  damping: number;
  widthGrowth: number;
  heightGrowth: number;
  drop: number;
};

type DockItemState = { element: HTMLElement; baseWidth: number; baseHeight: number; value: number; velocity: number; target: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createTopDockController(root: HTMLElement, getOptions: () => TopDockOptions) {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisionQuery = window.matchMedia("(hover:hover) and (pointer:fine)");
  const items: DockItemState[] = Array.from(root.querySelectorAll<HTMLElement>("[data-dock-item]")).map((element) => ({ element, baseWidth: 0, baseHeight: 0, value: 0, velocity: 0, target: 0 }));
  let enabled = false;
  let dirty = false;
  let frame = 0;
  let released = false;

  const measure = () => {
    enabled = !reducedQuery.matches && precisionQuery.matches && window.innerWidth > 600;
    items.forEach((state) => {
      state.element.style.width = "";
      state.element.style.height = "";
      state.element.style.transform = "";
      const rect = state.element.getBoundingClientRect();
      state.baseWidth = rect.width;
      state.baseHeight = rect.height;
      state.value = 0;
      state.velocity = 0;
      state.target = 0;
    });
    dirty = false;
  };

  if (items.length === 0) {
    return () => undefined;
  }

  const applyLayout = () => {
    const options = getOptions();
    items.forEach((state) => {
      const value = clamp(state.value, 0, 1.08);
      state.element.style.width = `${(state.baseWidth + Math.min(options.widthGrowth, state.baseWidth * 0.24) * value).toFixed(2)}px`;
      state.element.style.height = `${(state.baseHeight + options.heightGrowth * value).toFixed(2)}px`;
      state.element.style.transform = `translateY(${(value * options.drop).toFixed(2)}px)`;
    });
  };

  const setTargets = (clientX: number) => {
    if (!enabled) return;
    const options = getOptions();
    items.forEach((state) => {
      const rect = state.element.getBoundingClientRect();
      const distance = Math.abs(clientX - (rect.left + rect.width / 2));
      const proximity = clamp(1 - distance / Math.max(1, options.proximity), 0, 1);
      state.target = proximity * proximity * (3 - 2 * proximity);
    });
    dirty = true;
  };

  const reset = () => { items.forEach((state) => { state.target = 0; }); dirty = true; };
  const focusItem = (item: HTMLElement) => {
    if (!enabled) return;
    const index = items.findIndex((state) => state.element === item);
    items.forEach((state, itemIndex) => { state.target = itemIndex === index ? 1 : Math.abs(itemIndex - index) === 1 ? 0.24 : 0; });
    dirty = true;
  };
  const draw = () => {
    if (enabled && dirty) {
      const options = getOptions();
      let moving = false;
      items.forEach((state) => {
        state.velocity += (state.target - state.value) * options.spring;
        state.velocity *= options.damping;
        state.value += state.velocity;
        if (Math.abs(state.target - state.value) < 0.001 && Math.abs(state.velocity) < 0.001) { state.value = state.target; state.velocity = 0; } else moving = true;
      });
      applyLayout();
      if (!moving && items.every((state) => state.target === 0)) dirty = false;
    }
    frame = requestAnimationFrame(draw);
  };

  const onPointerMove = (event: PointerEvent) => setTargets(event.clientX);
  const onPointerLeave = () => reset();
  const onFocusIn = (event: FocusEvent) => { const item = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-dock-item]"); if (item) focusItem(item); };
  const onFocusOut = () => requestAnimationFrame(() => { if (!root.contains(document.activeElement)) reset(); });
  const onKeyDown = (event: KeyboardEvent) => { const item = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-dock-item]"); if (item && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); item.click(); } };
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (!released) measure(); }, 150);
  };
  window.addEventListener("resize", onResize);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("keydown", onKeyDown);
  reducedQuery.addEventListener("change", measure);
  precisionQuery.addEventListener("change", measure);
  document.fonts?.ready.then(measure);
  measure();
  frame = requestAnimationFrame(draw);

  return () => {
    released = true;
    cancelAnimationFrame(frame);
    if (resizeTimer) clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    root.removeEventListener("keydown", onKeyDown);
    reducedQuery.removeEventListener("change", measure);
    precisionQuery.removeEventListener("change", measure);
    items.forEach((state) => { state.element.style.width = ""; state.element.style.height = ""; state.element.style.transform = ""; });
  };
}
