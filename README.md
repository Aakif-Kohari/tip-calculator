# Tip calculator

A small tip calculator and bill splitter. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Features

- Bill amount with currency choice (INR, USD, EUR, GBP)
- Tip presets (5%, 10%, 15%, 20%) or a custom percentage
- Split the bill between 1–50 people
- Optional rounding of each share up to a whole amount
- Light and dark mode, remembered between visits
- Inline validation messages, keyboard accessible, works on mobile

## Run it

Open `index.html` in any modern browser. Nothing to install.

Or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How the maths works

Amounts are calculated in minor units (paise / cents) to avoid floating point errors:

1. `tip = bill × tip%`
2. `total = bill + tip`
3. `each = total ÷ people`, rounded up to the next minor unit so the group always covers the check
4. With "round up" on, each share goes up to a whole unit and the tip line adjusts to match

## Project structure

```
index.html   page markup
style.css    layout and light/dark themes
app.js       calculation, validation and rendering
```

## License

MIT
