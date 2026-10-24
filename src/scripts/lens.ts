// Lens switcher: "Rack Focus with Ghost iris".
// CSS already shows the right variant for html[data-lens] (set before first paint by the inline
// head script), so this file only has to flip that attribute and play the transition around it:
// defocus -> change (FLIP reorder, retyped subtitle, marker sweeps) -> refocus, with an iris overlay.

const root = document.documentElement;
const switcher = document.querySelector<HTMLElement>("[data-lens-switcher]");
const main = document.querySelector<HTMLElement>("main");
const subtitle = document.querySelector<HTMLElement>("[data-lens-subtitle]");

const EASE_OUT_EXPO = "cubic-bezier(0.32, 0.72, 0, 1)";
const DEFOCUS: Keyframe[] = [
  { filter: "blur(0px)", opacity: 1 },
  { filter: "blur(5px)", opacity: 0.8 },
];

const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

if (switcher && main) {
  const buttons = [...switcher.querySelectorAll<HTMLButtonElement>(".lens-btn")];
  const aperture = switcher.querySelector<SVGElement>("[data-lens-aperture]");

  // "" is the default page ("All")
  let current = root.dataset.lens ?? "";
  let busy = false;
  let turns = 0;

  const syncButtons = () =>
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lensId === current)));

  const syncUrl = () => {
    const url = new URL(location.href);
    if (current) url.searchParams.set("lens", current);
    else url.searchParams.delete("lens");
    history.replaceState(history.state, "", url);
  };

  /** FLIP: measure sortable items, run `mutate`, then animate each from where it used to be. */
  const flip = (mutate: () => void, animate: boolean) => {
    const items = animate ? [...document.querySelectorAll<HTMLElement>("[data-lens-sort]")] : [];
    const first = items.map((item) => item.getBoundingClientRect());
    mutate();
    items.forEach((item, i) => {
      const after = item.getBoundingClientRect();
      const dx = first[i].left - after.left;
      const dy = first[i].top - after.top;
      if (Math.abs(dx) + Math.abs(dy) > 1 && after.height) {
        item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: 700,
          easing: EASE_OUT_EXPO,
        });
      }
    });
  };

  /** Hero subtitle types itself in; the unseen rest keeps the final line breaks stable. */
  let typingRun = 0;
  const typeSubtitle = (animate: boolean) => {
    if (!subtitle) return;
    const run = ++typingRun;
    subtitle.querySelector(".lens-typed")?.remove();
    delete subtitle.dataset.lensTyping;
    if (!animate) return;

    const text = subtitle.querySelector(`[data-lens-show~="${current || "default"}"]`)?.textContent ?? "";
    const typed = document.createElement("span");
    const shown = document.createTextNode("");
    const caret = document.createElement("span");
    const rest = document.createElement("span");
    typed.className = "lens-typed";
    typed.setAttribute("aria-hidden", "true");
    caret.className = "lens-caret";
    rest.className = "lens-rest";
    typed.append(shown, caret, rest);
    subtitle.dataset.lensTyping = "";
    subtitle.append(typed);

    let i = 0;
    const step = () => {
      if (run !== typingRun) return;
      shown.data = text.slice(0, i);
      rest.textContent = text.slice(i);
      if (i++ < text.length) {
        setTimeout(step, 22);
      } else {
        setTimeout(() => {
          if (run !== typingRun) return;
          typed.remove();
          delete subtitle.dataset.lensTyping;
        }, 900);
      }
    };
    step();
  };

  /** Highlighter sweep: marks on screen sweep in a stagger, the rest when scrolled into view. */
  let sweepObserver: IntersectionObserver | undefined;
  let sweepTimers: number[] = [];
  const stopSweep = () => {
    sweepObserver?.disconnect();
    sweepTimers.forEach(clearTimeout);
    sweepTimers = [];
    document.querySelectorAll("mark.is-swept").forEach((mark) => mark.classList.remove("is-swept"));
  };
  const sweep = (delay: number) => {
    stopSweep();
    // Reduced motion shows marks fully highlighted from CSS alone
    if (!current || prefersReducedMotion()) return;

    const marks = [...document.querySelectorAll<HTMLElement>("mark[data-lens-mark]")].filter((mark) =>
      mark.dataset.lensMark!.split(" ").includes(current),
    );
    sweepTimers.push(
      window.setTimeout(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries
              .filter((entry) => entry.isIntersecting)
              .forEach((entry, i) => {
                observer.unobserve(entry.target);
                sweepTimers.push(window.setTimeout(() => entry.target.classList.add("is-swept"), i * 150));
              });
          },
          { rootMargin: "0px 0px -12% 0px" },
        );
        sweepObserver = observer;
        marks.forEach((mark) => observer.observe(mark));
      }, delay),
    );
  };

  /** Apply a lens: flip the attribute (CSS does the rest) and everything that has to move with it. */
  const apply = (id: string, animate: boolean) => {
    current = id;
    flip(() => {
      if (id) root.dataset.lens = id;
      else delete root.dataset.lens;
    }, animate);
    syncButtons();
    syncUrl();
    typeSubtitle(animate);
    sweep(500);
  };

  /** Ghost iris: a soft vignette and a thin, translucent aperture that shrink/grow and rotate, peaking mid-way. */
  const ghostIris = (duration: number) => {
    const w = innerWidth;
    const h = innerHeight;
    const overlay = document.createElement("div");
    overlay.className = "lens-iris";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `<div class="lens-iris-vignette"></div><svg viewBox="0 0 ${w} ${h}"><g><polygon></polygon><g class="blades"></g></g></svg>`;
    document.body.append(overlay);

    const vignette = overlay.querySelector<HTMLElement>(".lens-iris-vignette")!;
    const svg = overlay.querySelector<SVGElement>("svg")!;
    const hole = overlay.querySelector("polygon")!;
    const blades = overlay.querySelector(".blades")!;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(Math.hypot(w, h) / 2, 760);

    const draw = (r: number, rotation: number) => {
      const vertices = Array.from({ length: 6 }, (_, i) => {
        const angle = rotation + (i * Math.PI) / 3;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
      });
      hole.setAttribute("points", vertices.map((v) => v.join(",")).join(" "));
      // Each blade line extends an edge of the hexagon outwards
      blades.innerHTML = vertices
        .map(([x, y], i) => {
          const [px, py] = vertices[(i + 5) % 6];
          const dx = x - px;
          const dy = y - py;
          const len = Math.hypot(dx, dy) || 1;
          return `<line x1="${x}" y1="${y}" x2="${x + (dx / len) * R * 0.55}" y2="${y + (dy / len) * R * 0.55}"/>`;
        })
        .join("");
    };

    return new Promise<void>((done) => {
      const start = performance.now();
      const frame = (now: number) => {
        const k = Math.min(1, (now - start) / duration);
        const p = Math.sin(Math.PI * k);
        draw(R * (1 - 0.6 * p), k * 1.2);
        svg.style.opacity = String(0.5 * p);
        vignette.style.opacity = String(p);
        if (k < 1) {
          requestAnimationFrame(frame);
        } else {
          overlay.remove();
          done();
        }
      };
      frame(start);
    });
  };

  /** Rack focus: drift out of focus, change the lens while defocused, then refocus. Nothing goes dark. */
  const rackFocus = async (change: () => void) => {
    turns += 120;
    if (aperture) aperture.style.transform = `rotate(${turns}deg)`;
    const iris = ghostIris(1180);

    const out = main.animate(DEFOCUS, { duration: 420, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" });
    await out.finished;
    change();
    const back = main.animate([...DEFOCUS].reverse(), {
      duration: 760,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      fill: "forwards",
    });
    await back.finished;
    out.cancel();
    back.cancel();
    await iris;
  };

  const switchTo = async (id: string, force = false) => {
    if (busy || (id === current && !force)) return;
    busy = true;
    try {
      if (prefersReducedMotion()) apply(id, false);
      else await rackFocus(() => apply(id, true));
    } finally {
      busy = false;
    }
  };

  buttons.forEach((button) => button.addEventListener("click", () => switchTo(button.dataset.lensId ?? "")));

  syncButtons();
  // Arriving with a valid ?lens: the page is already in that lens (no flash); play the transition once.
  if (current && !prefersReducedMotion()) setTimeout(() => switchTo(current, true), 400);
}
