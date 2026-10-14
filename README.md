# Bingo 25 — Real-Time Multiplayer 5x5 Bingo

**Bingo 25** is a modern, responsive, real-time multiplayer implementation of the classic manual 5×5 number grid game (numbers 1–25). Unlike traditional 75-ball or 90-ball Bingo, this game features a custom tactical grid where each player manually designs their own 1–25 board and races to complete 5 valid lines.

---

## 🎮 Game Concept & Rules

1. **Custom 5×5 Board**: Each player receives an empty 5×5 grid and manually places every number from **1 to 25** exactly once in any arrangement they choose.
2. **Turn-Based or Auto-Calling**: Players take turns calling out uncalled numbers (or use optional Automatic Calling mode).
3. **Automatic Marking**: When a number is called, every player's board automatically checks and marks that number.
4. **Valid Winning Lines (12 Total)**:
   - 5 Horizontal Rows
   - 5 Vertical Columns
   - 2 Diagonal Lines (Main Diagonal and Opposite Diagonal)
5. **Winning Condition**: The first player to complete **5 valid lines** wins the match!

---

## ✨ Key Features

- **Intuitive Board Builder**: Click/tap-to-place, drag-and-drop support, `↶ Undo`/`↷ Redo`, smart validation, number palette checkmarks, and instant board reuse.
- **Real-Time Multiplayer**: Room creation with custom 5-character room codes, shareable links, and bot player support for solo testing.
- **Authoritative Server**: Node.js, Express, and Socket.IO backend ensuring secure, cheat-free gameplay and win verification.
- **Immersive UX**: Custom sound effects (clicks, pop, line completion, BINGO win fanfares), celebratory confetti (with `prefers-reduced-motion` support), and connection status indicators.
- **Algorithm Test Suite**: Built-in test suite verifying winning line calculations, diagonal intersections, and board validation rules.
- **Fully Responsive**: Mobile-first design tailored for smartphones, tablets, laptops, and desktops.

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti, Howler/Web Audio API.
- **Backend**: Node.js, Express, Socket.IO.
- **Build Tool**: Vite.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server (runs Vite and the Express Socket.IO server concurrently on port 3000):
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```
