

## Plan: Hero Stats Strip Polish + Hotel/Cruise Media Padding

**File:** `src/components/ProposalPreview.tsx`

### 1. Hero Stats Strip — Bolder + Dividers

Current issue: Text is too small (`text-[10px]` labels, `text-sm` values) and stats blend together without separation.

Changes (lines ~760-795):
- Increase label size from `text-[10px]` to `text-xs`
- Increase value size from `text-sm` to `text-base`
- Make values `font-bold` instead of `font-semibold`
- Increase icon container from `w-8 h-8` to `w-10 h-10`, icon from `h-4 w-4` to `h-5 w-5`
- Increase vertical padding from `py-4` to `py-5`
- Add vertical dividers between each stat using a `border-l border-border/50` element with `h-10` height
- Slightly increase the gap between stat groups

### 2. Hotel + Cruise Media — Padding Between Images

Current issue: Images in the 1+2 grid use `gap-px` which makes them clash together with no breathing room.

Changes (lines ~1289-1323 for hotels, ~1519-1554 for cruises):
- Add padding around the entire media container: `p-2` or `p-2.5` inside the media rail
- Change the thumbnail grid from `gap-px bg-border/60` to `gap-2` with no background fill
- Add a small gap between the main image and the thumbnail row: change grid to `gap-2`
- Round the individual images slightly with `rounded-lg` for a polished gallery feel
- Apply the same padding and gap changes to both hotel and cruise media sections identically

### Summary

Two targeted tweaks:
1. Stats strip: bigger text, bolder values, vertical line dividers between stats
2. Media gallery: white-space padding around and between all images in the 1+2 grid

No changes to layout structure, pricing, flights, itinerary, or any logic.

