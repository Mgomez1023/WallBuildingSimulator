import { gameEvents } from "../game/systems/EventBus";

export function MobileRotateControls() {
  return (
    <div className="mobile-rotate-controls" aria-label="Package rotation controls">
      <button
        type="button"
        aria-label="Rotate package left"
        onPointerDown={(event) => {
          event.preventDefault();
          gameEvents.emit("ui:rotate-active", -1);
        }}
      >
        Rotate Left
      </button>
      <button
        type="button"
        aria-label="Rotate package right"
        onPointerDown={(event) => {
          event.preventDefault();
          gameEvents.emit("ui:rotate-active", 1);
        }}
      >
        Rotate Right
      </button>
    </div>
  );
}
