/*
 * The model sends text much faster than anyone reads it. The typewriter sits between
 * the stream and the screen: tokens go into `received`, and a timer shows a few more
 * characters every tick.
 *
 * Tuning: about 2 characters every 25 ms is ~80 characters (~15 words) per second.
 * If the screen falls far behind, each tick shows a bit more, so a long answer
 * still finishes in reasonable time.
 */
const TICK_MS = 25;
const MIN_CHARS_PER_TICK = 2;
const CATCH_UP_TICKS = 250; // when N characters behind, show at least N / 250 per tick

export function createTypewriter(show: (text: string) => void) {
  let received = "";
  let shown = 0;
  let streamEnded = false;
  let stopped = false;
  let whenDone: (() => void) | null = null;

  const timer = window.setInterval(() => {
    const behind = received.length - shown;
    if (behind > 0) {
      shown += Math.min(behind, Math.max(MIN_CHARS_PER_TICK, Math.ceil(behind / CATCH_UP_TICKS)));
      show(received.slice(0, shown));
    } else if (streamEnded) {
      end();
    }
  }, TICK_MS);

  function end() {
    stopped = true;
    window.clearInterval(timer);
    whenDone?.();
    whenDone = null;
  }

  return {
    // A new piece of text from the server.
    add: (text: string) => {
      received += text;
    },
    // The stream is over: resolves once everything received is on screen.
    finish: () =>
      new Promise<void>((resolve) => {
        if (stopped) return resolve(); // already cancelled: nothing left to wait for
        streamEnded = true;
        whenDone = resolve;
      }),
    // Stop typing right away (Stop button, leaving the page).
    cancel: end,
  };
}
