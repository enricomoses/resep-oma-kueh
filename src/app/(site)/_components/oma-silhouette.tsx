import type { CSSProperties } from 'react';
import { cn } from '@/utils';

type StrokeTone = 'main' | 'detail' | 'accent';

interface SilhouetteStroke {
  d: string;
  delay: number;
  tone: StrokeTone;
}

interface SilhouetteDot {
  cx: number;
  cy: number;
  r: number;
  delay: number;
}

/**
 * Line-art geometry traced by hand from `public/images/oma.png`
 * (500×500 reference space). Delays are in seconds and order the strokes:
 * outline → hair → pins → face details, mimicking a hand drawing Oma.
 */
const STROKES: readonly SilhouetteStroke[] = [
  {
    d: 'M265 476C200 472 150 445 120 402C95 400 80 375 80 348C80 330 88 320 95 318C85 290 80 250 86 215C92 168 122 130 170 104C170 62 205 38 240 38C278 38 305 62 308 96C360 115 405 160 418 220C423 248 421 270 415 285C428 284 440 298 438 320C436 345 422 368 405 378C390 425 330 472 265 476Z',
    delay: 0,
    tone: 'main',
  },
  {
    d: 'M118 336C112 270 135 205 185 188C220 176 290 172 330 185C375 200 400 240 404 290',
    delay: 0.18,
    tone: 'main',
  },
  { d: 'M172 102C210 113 272 113 306 98', delay: 0.26, tone: 'main' },
  { d: 'M152 198C140 165 150 135 178 113', delay: 0.34, tone: 'detail' },
  { d: 'M218 180C206 150 212 126 228 110', delay: 0.38, tone: 'detail' },
  { d: 'M288 177C296 150 292 128 280 110', delay: 0.42, tone: 'detail' },
  { d: 'M352 196C366 165 356 135 330 114', delay: 0.46, tone: 'detail' },
  { d: 'M204 99C200 72 214 54 238 46', delay: 0.4, tone: 'detail' },
  { d: 'M276 99C282 76 274 56 256 46', delay: 0.44, tone: 'detail' },
  { d: 'M133 56L171 94', delay: 0.5, tone: 'main' },
  { d: 'M170 26L181 66', delay: 0.54, tone: 'main' },
  { d: 'M206 34L205 47', delay: 0.58, tone: 'main' },
  { d: 'M100 334C92 350 96 372 112 383', delay: 0.36, tone: 'detail' },
  { d: 'M425 304C432 322 425 345 412 356', delay: 0.36, tone: 'detail' },
  { d: 'M150 266C160 252 178 244 198 246', delay: 0.48, tone: 'main' },
  { d: 'M310 234C330 228 350 236 362 252', delay: 0.48, tone: 'main' },
  { d: 'M163 316C172 302 196 298 210 309', delay: 0.56, tone: 'main' },
  { d: 'M310 298C318 286 344 283 357 297', delay: 0.56, tone: 'main' },
  { d: 'M252 342C254 360 286 360 288 342', delay: 0.62, tone: 'main' },
  {
    d: 'M220 382C245 393 292 390 316 375C308 405 288 420 266 420C244 420 226 404 220 382Z',
    delay: 0.66,
    tone: 'main',
  },
  { d: 'M242 408C256 400 280 400 294 406', delay: 0.72, tone: 'detail' },
  { d: 'M160 370L168 358', delay: 0.68, tone: 'accent' },
  { d: 'M174 374L182 362', delay: 0.72, tone: 'accent' },
  { d: 'M344 366L352 354', delay: 0.68, tone: 'accent' },
  { d: 'M358 368L366 356', delay: 0.72, tone: 'accent' },
];

const DOTS: readonly SilhouetteDot[] = [
  { cx: 128, cy: 51, r: 7, delay: 0.62 },
  { cx: 168, cy: 19, r: 7, delay: 0.66 },
  { cx: 206, cy: 27, r: 7, delay: 0.7 },
  { cx: 121, cy: 405, r: 3.5, delay: 0.5 },
  { cx: 412, cy: 372, r: 3.5, delay: 0.5 },
];

const delayStyle = (delay: number): CSSProperties =>
  ({ '--stroke-delay': `${delay}s` }) as CSSProperties;

interface OmaSilhouetteProps {
  className?: string;
}

/** Decorative, CSS-animated line drawing of Oma used by the site loader. */
export function OmaSilhouette({ className }: OmaSilhouetteProps) {
  const layers = ['glow', 'line'] as const;
  return (
    <svg
      className={cn('oma-silhouette', className)}
      viewBox="64 4 392 484"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {layers.map((layer) => (
        <g key={layer} className={`oma-silhouette__${layer}`}>
          {STROKES.map((stroke) => (
            <path
              key={stroke.d}
              className={`oma-silhouette__stroke oma-silhouette__stroke--${stroke.tone}`}
              d={stroke.d}
              pathLength={1}
              style={delayStyle(stroke.delay)}
            />
          ))}
          {DOTS.map((dot) => (
            <circle
              key={`${dot.cx}-${dot.cy}`}
              className="oma-silhouette__stroke oma-silhouette__stroke--main"
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              pathLength={1}
              style={delayStyle(dot.delay)}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
