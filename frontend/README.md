Create a BBC News "More to Explore" section in React + Tailwind CSS.
Mobile responsive. Two parts: TOP VIDEO FEATURED ROW + BOTTOM FLATLIST.

══════════════════════════════════════════
SECTION HEADER
══════════════════════════════════════════
<div className="border-t-2 border-gray-900 pt-2.5 mb-4">
  <h2 className="text-[12px] font-bold uppercase tracking-widest text-gray-900">
    More to Explore
  </h2>
</div>

══════════════════════════════════════════
PART 1 — TOP FEATURED ROW (3 columns)
══════════════════════════════════════════
Wrapper: grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 mb-6

── LEFT COLUMN (text only article) ──
- Title: text-xl font-bold text-gray-900 leading-snug mb-2
         cursor-pointer hover:underline line-clamp-3
  "What do a teenager's clothes tell us about North Korea's future?"
- Desc: text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-2
- Meta: text-[12px] text-gray-400 flex items-center gap-1.5
  "15 hrs ago | Asia"

── CENTER COLUMN — VIDEO PLAYER ──
Wrapper: relative w-full aspect-video bg-black cursor-pointer
         overflow-hidden group

Structure:
  1. Thumbnail <img> or placeholder bg:
     className="w-full h-full object-cover"

  2. Play button (centered absolute):
     className="absolute top-1/2 left-1/2 -translate-x-1/2 
     -translate-y-1/2 w-14 h-14 rounded-full bg-black/65 
     flex items-center justify-center 
     group-hover:bg-black/80 transition-all"
     Inside: triangle ▶ using border-trick or SVG

  3. Bottom overlay (absolute bottom-0 left-0 p-3):
     - RED label: className="bg-[#cc0000] text-white text-[11px] 
       font-bold px-2 py-0.5 inline-block mb-1"
       Text: "VIDEO"
     - Caption: className="text-white text-[12px] font-semibold 
       leading-snug drop-shadow-md"

React state: const [playing, setPlaying] = useState(false)
onClick: setPlaying(true) → hide play button, show <video autoPlay>

── RIGHT COLUMN — Stacked Articles (no image needed) ──
Wrapper: flex flex-col gap-4

Each item:
  - Optional thumbnail: w-full aspect-video object-cover mb-2
  - Title: text-sm font-bold text-gray-900 leading-snug mb-1
           line-clamp-3 cursor-pointer hover:underline
  - Desc: text-[12.5px] text-gray-500 line-clamp-2 mb-1
  - Meta: text-[11.5px] text-gray-400 flex gap-1.5

Between items: <hr className="border-t border-gray-200" />

Articles (3 items):
  1. "Dressed for succession: What Kim Ju Ae's outfits tell us 
     about North Korea" — 16 hrs ago | Asia
  2. "Injury row, yacht trip & petition - what's going on with 
     Mbappe?" — 38 mins ago | European Football
  3. "How the FA helped US Soccer build its new home" 
     — 3 hrs ago | USA

══════════════════════════════════════════
PART 2 — BOTTOM FLATLIST (Horizontal Scroll)
══════════════════════════════════════════
Section label (optional):
  className="text-[11px] font-bold uppercase tracking-wider 
  text-gray-400 mb-2.5"

Scroll container:
  className="flex gap-3.5 overflow-x-auto pb-3 
  scrollbar-thin scrollbar-thumb-gray-300"
  style={{ scrollSnapType: 'x mandatory' }}

Each FlatList Card:
  className="min-w-[200px] max-w-[200px] flex-shrink-0 cursor-pointer"
  style={{ scrollSnapAlign: 'start' }}

  Structure:
  ┌──────────────────────────┐
  │ <img aspect-[4/3]>       │  ← w-full aspect-[4/3] object-cover mb-2
  │ Title (line-clamp-3)     │  ← text-[13.5px] font-bold leading-snug
  │ Desc (line-clamp-2)      │  ← text-[12px] text-gray-500
  │ Meta: time | category    │  ← text-[11px] text-gray-400
  └──────────────────────────┘

FlatList card data (6 cards):
  1. "Robot wars - what an operation in Ukraine tells us about 
     the battlefield of the near future" — 5 hrs ago | World
  2. "Widow of falsely accused murder suspect plans to sue 
     Scottish authorities" — 16 hrs ago | UK
  3. "Finding soldier Tom: Solving family mystery of WW2 Soviet 
     prisoner of war" — 13 hrs ago | World  [underline title]
  4. "Oil prices drop and stock markets rise after reports of 
     deal to end Iran war" — 54 mins ago | Business
  5. "Inside the labs racing to build AI that thinks like 
     a scientist" — 2 hrs ago | Technology
  6. "Champions League final preview: Who has the edge going 
     into Saturday?" — 1 hr ago | Sport

══════════════════════════════════════════
VIDEO PLAYER COMPONENT (React)
══════════════════════════════════════════
const VideoPlayer = ({ thumbnail, caption }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative w-full aspect-video bg-black 
                    overflow-hidden group cursor-pointer"
         onClick={() => setPlaying(true)}>
      {!playing ? (
        <>
          <img src={thumbnail} className="w-full h-full object-cover" />
          {/* Play Button */}
          <div className="absolute top-1/2 left-1/2 
                          -translate-x-1/2 -translate-y-1/2 
                          w-14 h-14 rounded-full bg-black/65 
                          flex items-center justify-center
                          group-hover:bg-black/80 transition-all">
            <div className="w-0 h-0 ml-1
                            border-t-[11px] border-t-transparent
                            border-b-[11px] border-b-transparent
                            border-l-[18px] border-l-white" />
          </div>
          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 p-3">
            <span className="bg-[#cc0000] text-white text-[11px] 
                             font-bold px-2 py-0.5 block mb-1">
              VIDEO
            </span>
            <p className="text-white text-[12px] font-semibold 
                          leading-snug drop-shadow">
              {caption}
            </p>
          </div>
        </>
      ) : (
        <video autoPlay controls 
               className="w-full h-full object-cover" 
               src="/your-video.mp4" />
      )}
    </div>
  )
}

══════════════════════════════════════════
MOBILE BREAKPOINTS
══════════════════════════════════════════
- Top row: grid-cols-1 → lg:grid-cols-[1fr_2fr_1fr]
- Mobile order: LEFT text → CENTER video → RIGHT sidebar (stacked)
- FlatList: always horizontal scroll on all screen sizes
- Card min-width: min-w-[170px] on mobile → min-w-[200px] on sm+
- Add scrollbar-hide plugin or scrollbar-thin for clean mobile look

══════════════════════════════════════════
TAILWIND CONFIG (add for line-clamp & scrollbar)
══════════════════════════════════════════
plugins: [
  require('@tailwindcss/line-clamp'),     // line-clamp-2, line-clamp-3
  require('tailwind-scrollbar'),           // scrollbar-thin
]