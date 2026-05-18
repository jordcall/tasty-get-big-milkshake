# Tasty Get Big Milkshake

This prototype is a static landing page opener for a high-protein, high-calorie milkshake product for hard gainers. It focuses only on testing the bold narrative slideshow experience and the transition into a placeholder product hero.

## File Structure

```text
index.html
assets/
  css/
    styles.css
  js/
    main.js
README.md
```

## Preview Locally

Run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser.

## Export codebase snapshot

```bash
python tools/export_codebase_snapshot.py
```

Then upload or paste `codebase-snapshot.md` into ChatGPT.

## Checklist

- slideshow advances on click/tap
- arrow keys work
- skip button works
- product section appears
- availability modal opens and closes
- mobile layout works

## Next Steps

- Add product details
- Add video embed
- Add availability/waitlist flow
- Add analytics events
- Deploy to GitHub Pages
