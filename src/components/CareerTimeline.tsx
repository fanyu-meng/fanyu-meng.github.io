import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Briefcase, GraduationCap } from 'lucide-react';

// Drawn for the site's dark theme. Figures are illustrations, not data.
const C = {
  bg: '#11151a', panel: '#1a1f26', ink: '#d6dae0', muted: '#8e97a5', faint: '#4a515b', line: '#2a3038',
  coral: '#ee7a4f', amber: '#f5b754', good: '#7cc49a', cool: '#7fb3d5', sample: '#2a221c', pore: '#9b7b63',
  belt: '#232931', board: '#1c2723', frame: '#33423b', chalk: '#e6ebe7', head: '#3a414b',
};
const FONT = 'Inter, "Noto Sans SC", system-ui, sans-serif';

type Point = [number, number];
const path = (pts: Point[]) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
const hash = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
const range = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

function arcs(cx: number, cy: number, r0: number, step: number, n: number, color: string, a0: number, a1: number, opacity = .9, width = 1.6) {
  const t0 = a0 * Math.PI / 180, t1 = a1 * Math.PI / 180;
  return Array.from({ length: n }, (_, i) => {
    const r = r0 + i * step;
    return <path key={`${cx}-${cy}-${i}`} d={`M${cx + r * Math.cos(t0)},${cy + r * Math.sin(t0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(t1)},${cy + r * Math.sin(t1)}`}
      fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeOpacity={opacity * (1 - i / (n + 1))} />;
  });
}

// Keep labels readable when a figure is drawn narrow on a phone.
function Figure({ width, height, label, children }: { width: number; height: number; label: string; children: (size: (px: number) => number) => ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = box.current!;
    const update = () => setScale(Math.min(1.7, Math.max(.9, width / (element.clientWidth || width))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return <div className="cr-fig" ref={box}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} fontFamily={FONT}>
      <rect width={width} height={height} fill={C.bg} />
      {children(px => +(px * scale).toFixed(1))}
    </svg>
  </div>;
}

const ALGO_IN = path(range(40, 236, 1.5).map(x => [x, 128 + 30 * (.55 * Math.sin(x * .09) + .35 * Math.sin(x * .23 + 1)) + 20 * (hash(x) - .5)]));
const ALGO_OUT = path(range(494, 628, 1.5).map(x => [x, 128 - 40 * Math.pow(Math.sin(Math.PI * (x - 494) / 134), .9) * Math.sin((x - 494) * .14)]));
const ALGO_BANDS = ([[316, 50], [338, 74], [362, 62], [386, 86], [410, 56]] as Point[])
  .map(([c, h]) => path(range(300, 434, 2).map(x => [x, 176 - h * Math.exp(-(((x - c) / 11) ** 2))])));

function AlgorithmFigure({ en }: { en: boolean }) {
  const fade = useId().replace(/:/g, '');
  const arrow = (x0: number, x1: number) => <g stroke={C.faint} strokeWidth={1.4} fill="none">
    <line x1={x0} x2={x1} y1={128} y2={128} /><path d={`M${x1 - 6},122 L${x1},128 L${x1 - 6},134`} />
  </g>;
  return <Figure width={720} height={260} label={en ? 'Sound passes through an algorithm and comes out improved' : '声音经过算法，变成更好的声音'}>{size => <>
    <defs><linearGradient id={fade} gradientUnits="userSpaceOnUse" x1={40} x2={150} y1={0} y2={0}>
      <stop offset={0} stopColor={C.ink} stopOpacity={0} /><stop offset={1} stopColor={C.ink} stopOpacity={.8} />
    </linearGradient></defs>
    <path d={ALGO_IN} fill="none" stroke={`url(#${fade})`} strokeWidth={1.5} strokeLinejoin="round" />
    {arrow(246, 284)}
    <rect x={292} y={58} width={150} height={140} rx={14} fill={C.panel} stroke={C.line} />
    {ALGO_BANDS.map((d, i) => <path key={i} d={d} fill="none" stroke={i === 3 ? C.coral : C.ink} strokeOpacity={i === 3 ? 1 : .45} strokeWidth={i === 3 ? 2 : 1.3} />)}
    <line x1={302} x2={432} y1={176} y2={176} stroke={C.faint} />
    {arrow(450, 486)}
    <path d={ALGO_OUT} fill="none" stroke={C.coral} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M646,118 h10 l14,-12 v44 l-14,-12 h-10 z" fill={C.panel} stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" />
    {arcs(670, 128, 12, 10, 3, C.coral, -50, 50, 1, 1.8)}
    <text x={138} y={228} textAnchor="middle" fill={C.muted} fontSize={size(13)}>{en ? 'Sound in' : '声音'}</text>
    <text x={367} y={228} textAnchor="middle" fill={C.ink} fontSize={size(13)}>{en ? 'Algorithm' : '算法'}</text>
    <text x={590} y={228} textAnchor="middle" fill={C.muted} fontSize={size(13)}>{en ? 'Better sound out' : '更好的声音'}</text>
  </>}</Figure>;
}

const PORES = Array.from({ length: 170 }, (_, i) => [36 + hash(i) * 408, 245 + hash(i + 400) * 34, .9 + hash(i + 900) * 2.4]);
const sigmoid = (u: number) => 1 / (1 + Math.exp(-(u - .42) * 9));

function MaterialFigure({ en }: { en: boolean }) {
  const clip = useId().replace(/:/g, '');
  const ix = 330, iy = 40, iw = 126, ih = 96, px = (u: number) => ix + 16 + u * (iw - 30), py = (u: number) => iy + ih - 20 - (ih - 42) * sigmoid(u);
  return <Figure width={480} height={330} label={en ? 'Measuring how much sound a material sample absorbs' : '测量材料样品吸收了多少声音'}>{size => <>
    <defs><clipPath id={clip}><rect x={0} y={0} width={480} height={238} /></clipPath></defs>
    <g clipPath={`url(#${clip})`}>
      {arcs(112, 92, 34, 34, 5, C.coral, 20, 160, .95, 1.8)}
      {arcs(112, 420, 196, 30, 3, C.cool, 236, 304, .55, 1.3)}
    </g>
    <rect x={78} y={40} width={68} height={30} rx={4} fill={C.panel} stroke={C.ink} strokeWidth={1.4} />
    <path d="M92,70 L132,70 L142,84 L82,84 Z" fill={C.panel} stroke={C.ink} strokeWidth={1.4} strokeLinejoin="round" />
    <line x1={300} y1={40} x2={300} y2={224} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
    <circle cx={300} cy={230} r={6} fill={C.amber} />
    <rect x={30} y={240} width={420} height={44} rx={3} fill={C.sample} />
    {PORES.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={C.pore} strokeOpacity={.75} strokeWidth={.9} />)}
    <line x1={24} x2={456} y1={284} y2={284} stroke={C.ink} strokeWidth={1.5} />
    {range(30, 450, 11).map(x => <line key={x} x1={x} y1={287} x2={x - 8} y2={297} stroke={C.faint} />)}
    <rect x={ix} y={iy} width={iw} height={ih} rx={8} fill={C.panel} stroke={C.line} />
    <path d={`M${ix + 14},${iy + 16} V${iy + ih - 18} H${ix + iw - 10}`} fill="none" stroke={C.faint} strokeWidth={1.2} />
    <path d={path(range(0, 40, 1).map(i => [px(i / 40), py(i / 40)]))} fill="none" stroke={C.coral} strokeWidth={2} />
    {[.1, .26, .4, .55, .7, .86].map((u, i) => <circle key={u} cx={px(u)} cy={py(u) + (hash(i + 7) - .5) * 6} r={2.6} fill={C.bg} stroke={C.amber} strokeWidth={1.4} />)}
    <text x={ix + iw / 2} y={iy + ih + 18} textAnchor="middle" fill={C.muted} fontSize={size(12)}>{en
      ? <><tspan>Absorption</tspan><tspan x={ix + iw / 2} dy="1.2em">coefficient</tspan></>
      : '吸声系数'}</text>
  </>}</Figure>;
}

function QualityFigure({ en }: { en: boolean }) {
  const by = 262;
  const unit = (x: number, opacity: number) => <g key={x} opacity={opacity}>
    <rect x={x - 22} y={by - 38} width={44} height={38} rx={7} fill={C.panel} stroke={C.ink} strokeOpacity={.6} strokeWidth={1.3} />
    <circle cx={x} cy={by - 19} r={8} fill="none" stroke={C.ink} strokeOpacity={.5} strokeWidth={1.2} />
  </g>;
  const verdict = (x: number, pass: boolean) => {
    const color = pass ? C.good : C.coral;
    return <g key={'v' + x}>
      <circle cx={x} cy={by - 58} r={10} fill={color} fillOpacity={.16} stroke={color} strokeWidth={1.5} />
      <path d={pass ? `M${x - 4.5},${by - 58} l3.2,3.4 l6,-6.6` : `M${x - 4},${by - 62} l8,8 M${x + 4},${by - 62} l-8,8`}
        fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </g>;
  };
  return <Figure width={480} height={330} label={en ? 'Products on a production line are checked by sound, and an AI model decides pass or fail' : '产线上的产品逐个过声学检测，由 AI 判定合格与否'}>{size => <>
    <rect x={16} y={by} width={448} height={14} rx={7} fill={C.belt} />
    {[24, 456].map(x => <circle key={x} cx={x} cy={by + 7} r={9} fill={C.panel} stroke={C.faint} />)}
    {range(40, 440, 26).map(x => <line key={x} x1={x} x2={x + 10} y1={by + 7} y2={by + 7} stroke={C.faint} strokeWidth={1.2} />)}
    {[60, 420].map(x => <line key={x} x1={x} x2={x} y1={by + 14} y2={312} stroke={C.faint} strokeWidth={2} />)}
    {[52, 112].map(x => unit(x, .5))}
    {[222, 322, 380, 438].map(x => unit(x, 1))}
    <path d={`M178,${by} V146 H266 V${by}`} fill="none" stroke={C.ink} strokeOpacity={.7} strokeWidth={2} />
    <line x1={222} x2={222} y1={146} y2={176} stroke={C.ink} strokeWidth={1.6} />
    <rect x={215} y={176} width={14} height={22} rx={7} fill={C.panel} stroke={C.ink} strokeWidth={1.5} />
    {arcs(222, 224, 10, 9, 3, C.coral, 215, 325, 1, 1.6)}
    <line x1={222} x2={222} y1={118} y2={146} stroke={C.faint} strokeWidth={1.4} strokeDasharray="3 3" />
    <rect x={170} y={64} width={104} height={54} rx={12} fill={C.panel} stroke={C.coral} strokeWidth={1.6} />
    <text x={222} y={98} textAnchor="middle" fill={C.ink} fontWeight={700} fontSize={size(18)}>AI</text>
    {verdict(322, true)}{verdict(380, false)}{verdict(438, true)}
    <path d={`M300,${by + 34} h120 m-8,-5 l8,5 l-8,5`} fill="none" stroke={C.faint} strokeWidth={1.4} />
    <text x={222} y={40} textAnchor="middle" fill={C.muted} fontSize={size(12)}>{en ? 'One listen, one verdict' : '听一遍，判一次'}</text>
  </>}</Figure>;
}

const WAVE = path(range(282, 470, 2).map(x => [x, 102 - 30 * Math.sin((x - 282) * Math.PI / 47) + (hash(x) - .5) * 1.4]));

function LectureFigure({ en }: { en: boolean }) {
  const chalk = { fill: 'none', stroke: C.chalk, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeOpacity: .92 };
  const person = (x: number, y: number, opacity: number) => <g key={`${x}-${y}`} opacity={opacity} fill={C.head}>
    <circle cx={x} cy={y} r={10} /><path d={`M${x - 20},${y + 32} a20,18 0 0 1 40,0 z`} />
  </g>;
  return <Figure width={720} height={312} label={en ? 'Teaching acoustics in front of a lecture hall' : '在课堂上讲声学'}>{size => <>
    <rect x={150} y={20} width={420} height={168} rx={8} fill={C.board} stroke={C.frame} strokeWidth={5} />
    <rect x={170} y={190} width={380} height={6} rx={2} fill={C.frame} />
    <rect x={460} y={184} width={16} height={5} rx={2} fill={C.chalk} opacity={.9} />
    <path d="M196,92 h12 l16,-14 v48 l-16,-14 h-12 z" {...chalk} />
    {[0, 1, 2].map(i => { const r = 12 + i * 9; return <path key={i} {...chalk} strokeOpacity={.9 - i * .2}
      d={`M${232 + r * Math.cos(-.8)},${102 + r * Math.sin(-.8)} A${r},${r} 0 0 1 ${232 + r * Math.cos(.8)},${102 + r * Math.sin(.8)}`} />; })}
    <path d={WAVE} {...chalk} />
    <path d="M305,54 h94 M305,49 v10 M399,49 v10" {...chalk} strokeWidth={1.6} />
    <text x={352} y={44} textAnchor="middle" fill={C.chalk} fontStyle="italic" fontSize={size(16)}>λ</text>
    <path d="M516,70 v34 a12,12 0 0 0 24,0 v-34 M528,116 v38" {...chalk} />
    {[0, 1].map(i => { const r = 10 + i * 8; return <path key={i} {...chalk} strokeWidth={1.6} strokeOpacity={.7 - i * .25} d={`M552,${76 - r} a${r},${r} 0 0 1 0,${2 * r}`} />; })}
    <text x={360} y={168} textAnchor="middle" fill={C.chalk} fontStyle="italic" fontSize={size(15)}>c = f · λ</text>
    {range(0, 8, 1).map(i => person(110 + i * 62, 234, .7))}
    {range(0, 9, 1).map(i => person(80 + i * 62, 270, 1))}
  </>}</Figure>;
}

const SPIRAL = Array.from({ length: 32 }, (_, i) => { const r = 46 * Math.sqrt((i + .5) / 32), a = i * 2.39996; return [414 + r * Math.cos(a), 118 + r * Math.sin(a)]; });

function DoctoralFigure({ en }: { en: boolean }) {
  const gy = 222, hx = 628, hy = 132;
  return <Figure width={720} height={300} label={en ? 'A passing car is recorded with a microphone array and replayed in virtual reality' : '用麦克风阵列录下驶过的车，在虚拟现实里重放'}>{size => <>
    <line x1={16} x2={470} y1={gy} y2={gy} stroke={C.line} strokeWidth={1.5} />
    {([[22, 168], [30, 186], [18, 204]] as Point[]).map(([x, y]) => <line key={y} x1={x} x2={x + 34} y1={y} y2={y} stroke={C.faint} strokeWidth={2} strokeLinecap="round" />)}
    <path d={`M70,${gy - 14} V${gy - 40} Q72,${gy - 56} 100,${gy - 60} L136,${gy - 86} Q150,${gy - 94} 176,${gy - 94} L222,${gy - 92} Q238,${gy - 90} 252,${gy - 66} L268,${gy - 60} Q282,${gy - 56} 282,${gy - 38} V${gy - 14} Z`}
      fill={C.panel} stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
    <path d={`M112,${gy - 62} L142,${gy - 82} L238,${gy - 82} L246,${gy - 62} Z`} fill={C.bg} stroke={C.ink} strokeOpacity={.5} strokeWidth={1.2} />
    {[112, 240].map(x => <g key={x}><circle cx={x} cy={gy - 12} r={15} fill={C.bg} stroke={C.ink} strokeWidth={1.6} /><circle cx={x} cy={gy - 12} r={5} fill={C.ink} fillOpacity={.5} /></g>)}
    {arcs(286, gy - 56, 16, 16, 4, C.coral, -40, 40, 1, 1.8)}
    <g stroke={C.ink} strokeOpacity={.7} strokeWidth={1.5} fill="none">
      <rect x={360} y={64} width={108} height={108} rx={6} />
      <line x1={414} x2={414} y1={172} y2={gy} />
      <path d={`M396,${gy} L414,${gy - 14} L432,${gy}`} />
    </g>
    {SPIRAL.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={2.4} fill={C.amber} />)}
    <path d="M478,118 C512,118 516,150 548,150" fill="none" stroke={C.faint} strokeWidth={1.6} strokeDasharray="4 5" />
    <path d="M542,144 L549,150 L542,156" fill="none" stroke={C.faint} strokeWidth={1.6} />
    {[0, 1, 2].map(i => <circle key={i} cx={hx} cy={hy + 6} r={48 + i * 18} fill="none" stroke={C.coral} strokeOpacity={.5 - i * .14} strokeWidth={1.4} />)}
    <circle cx={hx} cy={hy} r={26} fill={C.panel} stroke={C.ink} strokeWidth={1.6} />
    <path d={`M${hx - 30},${hy - 4} h44 a8,8 0 0 1 8,8 v6 a8,8 0 0 1 -8,8 h-44 a6,6 0 0 1 -6,-6 v-10 a6,6 0 0 1 6,-6 z`} fill={C.ink} fillOpacity={.9} />
    <path d={`M${hx + 4},${hy - 26} a26,26 0 0 1 24,22`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <path d={`M${hx - 34},${hy + 40} q34,-12 68,0 l6,24 h-80 z`} fill={C.panel} stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
    <text x={176} y={262} textAnchor="middle" fill={C.muted} fontSize={size(13)}>{en ? 'Pass-by vehicle' : '驶过的车'}</text>
    <text x={414} y={262} textAnchor="middle" fill={C.muted} fontSize={size(13)}>{en ? 'Microphone array' : '麦克风阵列'}</text>
    <text x={610} y={262} textAnchor="middle" fill={C.muted} fontSize={size(13)}>{en ? 'Auralization in VR' : '在虚拟现实里重放'}</text>
  </>}</Figure>;
}

const logo = (file: string) => import.meta.env.BASE_URL + 'career/' + file;

function Logo({ file, alt, height }: { file: string; alt: string; height: number }) {
  return <img src={logo(file)} alt={alt} height={height} style={{ height }} decoding="async" />;
}

const schools = [
  { file: 'hit.png', height: 36, zh: '哈尔滨工业大学', en: 'Harbin Institute of Technology' },
  { file: 'tum.svg', height: 22, zh: '慕尼黑工业大学', en: 'Technical University of Munich' },
  { file: 'rwth.svg', height: 28, zh: '亚琛工业大学', en: 'RWTH Aachen University' },
];

export default function CareerTimeline({ en }: { en: boolean }) {
  const at = <span className="cr-at" aria-hidden="true">@</span>;
  return <div className="cr">
    <h3 className="cr-label"><Briefcase aria-hidden="true" />{en ? 'Experience' : '经历'}</h3>
    <ol className="cr-rail">
      <li className="cr-node cr-now">
        <p className="cr-years">{en ? '2022 – present' : '2022 – 现在'}</p>
        <h4 className="cr-role">{en ? 'Audio Algorithm Engineer' : '音频算法工程师'} {at} <Logo file="harman.svg" alt="HARMAN" height={28} /></h4>
        <AlgorithmFigure en={en} />
      </li>
      <li className="cr-node">
        <p className="cr-years">{en ? '2018 – 2022 · Arnhem, the Netherlands' : '2018 – 2022 · 荷兰阿纳姆'}</p>
        <h4 className="cr-role">Scientist {at} <Logo file="microflown.svg" alt="Microflown Technologies" height={26} /></h4>
        <div className="cr-pair">
          <div><h5>{en ? 'Acoustic material testing R&D' : '材料测试研发'}</h5><MaterialFigure en={en} /></div>
          <div><h5>{en ? 'AI-based end-of-line quality inspection' : 'AI 产线质量检测'}</h5><QualityFigure en={en} /></div>
        </div>
      </li>
      <li className="cr-node">
        <p className="cr-years">2017 – 2018</p>
        <h4 className="cr-role">Lecturer {at} <Logo file="tue.svg" alt="Eindhoven University of Technology (TU/e)" height={18} /></h4>
        <LectureFigure en={en} />
      </li>
      <li className="cr-node">
        <p className="cr-years">2013 – 2018</p>
        <h4 className="cr-role">{en ? 'Doctoral research' : '博士研究'} {at} <Logo file="rwth.svg" alt="RWTH Aachen University" height={26} /></h4>
        <p className="cr-desc">{en
          ? 'Modeling of moving sound sources based on microphone array measurements: recording pass-by vehicles, reconstructing the source signals, and auralizing them in virtual reality.'
          : '运动声源建模：用麦克风阵列录下驶过的汽车，还原它的声音，再放进虚拟现实里重放。'}</p>
        <DoctoralFigure en={en} />
      </li>
    </ol>
    <h3 className="cr-label"><GraduationCap aria-hidden="true" />{en ? 'Education' : '教育'}</h3>
    <ul className="cr-edu">
      {schools.map(school => <li key={school.file} className="cr-school">
        <span className="cr-mark"><Logo file={school.file} alt="" height={school.height} /></span>
        {en ? <strong>{school.en}</strong> : <><strong>{school.zh}</strong><span>{school.en}</span></>}
      </li>)}
    </ul>
  </div>;
}
