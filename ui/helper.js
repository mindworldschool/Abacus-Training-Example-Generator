const ROUTE_ORDER = ["settings", "confirmation", "game", "results"];

export function createScreenShell({ title, description, className = "" }) {
  const section = document.createElement("section");
  section.className = `screen ${className}`.trim();

  const header = document.createElement("div");
  header.className = "screen__header";

  const heading = document.createElement("h2");
  heading.className = "screen__title";
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.className = "screen__description";
  paragraph.textContent = description;

  header.append(heading, paragraph);

  const body = document.createElement("div");
  body.className = "screen__body";

  section.append(header, body);

  return {
    section,
    body,
    heading,
    paragraph
  };
}

export function createButton({ label, variant = "primary", onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn btn--${variant}`;
  button.textContent = label;
  if (onClick) {
    button.addEventListener("click", onClick);
  }
  return button;
}

export function createStepIndicator(activeRoute, translate) {
  const list = document.createElement("ol");
  list.className = "step-indicator";

  ROUTE_ORDER.forEach((route, index) => {
    const item = document.createElement("li");
    item.className = "step-indicator__item";
    item.dataset.route = route;
    if (route === activeRoute) {
      item.classList.add("step-indicator__item--active");
    }
    if (ROUTE_ORDER.indexOf(activeRoute) > index) {
      item.classList.add("step-indicator__item--complete");
    }
    const badge = document.createElement("span");
    badge.className = "step-indicator__badge";
    badge.textContent = index + 1;

    const label = document.createElement("span");
    label.className = "step-indicator__label";
    label.textContent = translate(`header.steps.${route}`);

    item.append(badge, label);
    list.appendChild(item);
  });

  return list;
}

export function formatOptionLabel(options, value) {
  const match = options.find((option) => option.value === value);
  return match ? match.label : value;
}
