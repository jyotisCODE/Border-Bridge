# 🌍 Border Bridge

> Navigate the world through land borders — a geography puzzle game powered by graph traversal.

**[Play Live →](https://border-bridge-ka8s.vercel.app)**

---

![Border Bridge](./public/map-bg.png)

---

## What is it?

Border Bridge is a geography intelligence game where you find the shortest land route between any two countries in the world. Type **Portugal** and **China** — the game finds the path through Spain, France, Germany, Poland, Russia. Or play yourself and see if you can beat the optimal route.

Under the hood it's a real **BFS (Breadth-First Search) graph traversal** over an adjacency graph of 175 countries, where each country's borders form the edges of the graph.

---

## How to Play

**Auto Solve mode**
1. Type a start country and an end country
2. Hit **Find Shortest Path**
3. Watch the optimal route animate in hop by hop

**Play Yourself mode**
1. Type a start and end country
2. Hit **Start Puzzle**
3. Navigate country by country through land borders
4. The game tells you which countries border your current location
5. Reach the destination in as few hops as possible
6. Your result is compared to the optimal BFS path

---

## Features

- **BFS pathfinding** — finds the true shortest land route between any two countries
- **175 countries** — full adjacency graph with real border data
- **Two game modes** — Auto Solve and Play Yourself
- **Live timer** — tracks how long you take to solve each puzzle
- **Optimal comparison** — shows your hop count vs. the shortest possible
- **Border hints** — click any neighbouring country to auto-fill your guess
- **Session stats** — tracks puzzles solved, total hops, and longest bridge across sessions
- **Example puzzles** — one-click to load a challenge (Portugal→China, India→France, and more)
- **Shake animation** — wrong guess gives immediate tactile feedback
- **Responsive design** — works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React.js + Vite |
| Styling | CSS3 (no UI library) |
| Algorithm | BFS graph traversal |
| Data | Hand-crafted country adjacency graph (175 countries) |
| Deployment | Vercel |

---

## How the Algorithm Works

Every country is a node. Every shared land border is an edge. The adjacency graph looks like this:

```json
{
  "IND": ["BGD", "BTN", "CHN", "MMR", "NPL", "PAK"],
  "CHN": ["AFG", "BTN", "IND", "KAZ", "PRK", "KGZ", "LAO", "MNG", "MMR", "NPL", "PAK", "RUS", "TJK", "VNM"]
}
```

BFS explores all neighbours level by level, guaranteeing the **shortest** path every time:

```js
function bfs(startId, endId) {
  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length) {
    const path = queue.shift();
    const current = path.at(-1);

    for (const neighbor of graph[current] ?? []) {
      if (!visited.has(neighbor)) {
        if (neighbor === endId) return [...path, neighbor];
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null; // island nations or no land path
}
```

**Example:** Portugal → China
```
Portugal → Spain → France → Germany → Poland → Russia → China
6 hops — the true shortest land route
```

Island nations (Japan, Australia, UK, etc.) correctly return no land path.

---

## Country Data Layer

The game is built on a structured country data layer — each country entry contains:

```json
{
  "id": "IND",
  "name": "India",
  "capital": "New Delhi",
  "coordinates": { "lat": 20.5937, "lng": 78.9629 },
  "borders": ["BGD", "BTN", "CHN", "MMR", "NPL", "PAK"],
  "continent": "Asia",
  "flag": "🇮🇳",
  "timezone": "UTC+05:30",
  "population": 1428627663,
  "flightHoursFrom": { "USA": 16.5, "GBR": 10.2, "DEU": 9.8 }
}
```

This data layer is designed to power future game modes — flight time puzzles, timezone explorers, capital matching, and geo heatmaps — all from the same foundation.

---

## Run Locally

```bash
# Clone the repo
git clone https://github.com/jyotisCODE/Border-Bridge.git
cd Border-Bridge

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
border-bridge/
├── public/
│   └── map-bg.png          # Antique world map background
├── src/
│   ├── App.jsx             # Main game component + all logic
│   ├── countries.json      # Country data layer (175 countries)
│   ├── main.jsx            # React entry point
│   └── index.css           # Base styles
├── index.html
├── package.json
└── vite.config.js
```

---

## Roadmap

- [ ] SVG world map panel — countries highlight as you navigate
- [ ] Random puzzle generator
- [ ] Share your result (Wordle-style)
- [ ] Difficulty levels (Easy / Medium / Hard)
- [ ] Flag Blitz mode — guess flags quickly
- [ ] Capital Rush mode — match countries to capitals
- [ ] Flight Focus Mode — use flight time as a focus/productivity timer
- [ ] PWA support — installable on mobile

---

## Built By

**Jyoti Sangwan** — B.Tech ECE, JNU New Delhi

[GitHub](https://github.com/jyotisCODE) · [LinkedIn](https://linkedin.com/in/jyoti-sangwan-87b782293)

---

*All border data sourced from ISO 3166-1 standard. Island nations correctly return no land path.*
