function addSlider({
    id,
    name,
    onUpdate,
    options = {},
    hidden = false,
    showValue = true,
    initialSpanValue = undefined,
  }) {
const div = document.createElement("div");
div.style = `display: ${hidden ? "none": "flex"}; align-items: center; gap: 8px`;
document.querySelector(`#${id}`).appendChild(div);
div.append(`${name}`);
const input = document.createElement("input");
input.id = `${id}-${name.replace(" ", "-").toLowerCase()}-slider`;
input.className = "slider";
input.type = "range";
Object.entries(options).forEach(([key, value]) => {
input.setAttribute(key, value);
});
if (options.value) {
input.value = options.value;
}
const span = document.createElement("span");
input.setSpan = (value) => span.innerText = `${value}`;

input.addEventListener("input", () => {
input.setSpan(`${onUpdate(input.value)}`);
});
span.innerText = `${input.value}`;
div.appendChild(input);
div.appendChild(span);

input.onUpdate = onUpdate;
if (initialSpanValue != null) {
input.setSpan(initialSpanValue);
}
return input;
}
export { addSlider };
