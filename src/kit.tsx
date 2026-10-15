import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import QRCode from 'qrcode'
import { useEffect, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { STATUS_META, fmt, type Status } from './data'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  v?: 'primary' | 'lime' | 'ghost' | 'danger' | 'quiet' | 'dark' | 'amber'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}
export function Btn({ v = 'primary', size = 'md', loading, icon, className, children, disabled, ...p }: BtnProps) {
  const vs = {
    primary: 'bg-forest text-white hover:bg-forest-2 shadow-[0_6px_16px_-8px_rgba(31,95,63,.7)]',
    lime: 'bg-lime text-night hover:bg-[#b5e33c]',
    amber: 'bg-amber text-night hover:bg-[#e6b520]',
    dark: 'bg-night text-white hover:bg-night-3',
    ghost: 'bg-transparent text-forest ring-1 ring-inset ring-forest/30 hover:bg-forest/5',
    danger: 'bg-white text-tolak ring-1 ring-inset ring-tolak/40 hover:bg-tolak/5',
    quiet: 'bg-ink/[.05] text-ink hover:bg-ink/[.09]',
  }[v]
  const ss = { sm: 'h-9 px-3.5 text-[13px] rounded-[10px] gap-1.5', md: 'h-11 px-5 text-sm rounded-xl gap-2', lg: 'h-14 px-6 text-[15px] rounded-2xl gap-2.5' }[size]
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest/20',
        vs, ss, className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function StatusPill({ s, size = 'sm' }: { s: Status; size?: 'sm' | 'lg' }) {
  const m = STATUS_META[s]
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1', m.bg, m.fg, m.ring, size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-[11px] font-semibold uppercase tracking-[0.12em] text-mute', className)}>{children}</div>
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[0.92em] tracking-tight', className)}>{children}</span>
}

export function Logo({ light, sub }: { light?: boolean; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/kv/logo-icon.webp" alt="" className="h-9 w-9 rounded-[10px]" />
      <div className="leading-none">
        <div className={cx('font-display text-[17px] font-bold', light ? 'text-white' : 'text-ink')}>OC-Life</div>
        {sub && <div className={cx('mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]', light ? 'text-white/45' : 'text-mute')}>{sub}</div>}
      </div>
    </div>
  )
}

export function Num({ value, d = 0, prefix = '', suffix = '', dur = 0.9 }: { value: number; d?: number; prefix?: string; suffix?: string; dur?: number }) {
  const mv = useMotionValue(value)
  const [v, setV] = useState(value)
  useEffect(() => {
    const c = animate(mv, value, { duration: dur, ease: [0.22, 1, 0.36, 1], onUpdate: setV })
    return () => c.stop()
  }, [value, mv, dur])
  return <span className="tnum">{prefix}{fmt(v, d)}{suffix}</span>
}

export function QR({ text, className, dark = '#14201a' }: { text: string; className?: string; dark?: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark, light: '#0000' } }).then(setSvg)
  }, [text, dark])
  return <div className={cx('[&>svg]:h-full [&>svg]:w-full', className)} dangerouslySetInnerHTML={{ __html: svg }} aria-label={`QR ${text}`} role="img" />
}

export function Ring({ value, size = 120, stroke = 10, color = '#c6f24e', track = 'rgba(255,255,255,.12)', children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Gauge({ value, label, color = '#1f5f3f' }: { value: number; label?: string; color?: string }) {
  const r = 70
  const len = Math.PI * r
  return (
    <div className="relative mx-auto w-[180px]">
      <svg viewBox="0 0 180 100" className="w-full">
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="#ece6d6" strokeWidth="14" strokeLinecap="round" />
        <motion.path
          d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={len} initial={{ strokeDashoffset: len }} animate={{ strokeDashoffset: len * (1 - value) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="font-display text-3xl font-bold"><Num value={value * 100} suffix="%" /></div>
        {label && <div className="text-xs text-mute">{label}</div>}
      </div>
    </div>
  )
}

export function Spark({ data, color = '#c6f24e', h = 44, fill = true }: { data: number[]; color?: string; h?: number; fill?: boolean }) {
  const id = useId()
  const w = 200
  const max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)])
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Modal({ open, onClose, children, wide, title }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean; title?: string }) {
  useEffect(() => {
    if (!open) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [open, onClose])
  // Di dalam bingkai HP, dialog tampil sebagai bottom sheet di dalam layar ponsel
  const host = !wide ? document.getElementById('phone-overlay') : null
  const node = (
    <AnimatePresence>
      {open && (
        <motion.div className={cx(host ? 'pointer-events-auto absolute' : 'fixed p-0 sm:items-center sm:p-6', 'inset-0 z-[80] flex items-end justify-center bg-night/55 backdrop-blur-[2px]')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cx('relative w-full overflow-auto rounded-t-3xl bg-paper shadow-2xl thin-scroll', host ? 'max-h-[88%]' : 'max-h-[92vh] sm:rounded-3xl', !host && (wide ? 'sm:max-w-4xl' : 'sm:max-w-md'))}
          >
            <button onClick={onClose} aria-label="Tutup" className="no-print absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-ink/10"><X size={18} /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
  return host ? createPortal(node, host) : node
}

export function Segmented<T extends string>({ value, onChange, items, dark }: { value: T; onChange: (v: T) => void; items: [T, string][]; dark?: boolean }) {
  return (
    <div className={cx('inline-flex rounded-xl p-1', dark ? 'bg-white/[.06]' : 'bg-ink/[.05]')}>
      {items.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={cx('relative rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition', value === k ? (dark ? 'text-night' : 'text-ink') : dark ? 'text-white/55 hover:text-white' : 'text-mute hover:text-ink')}>
          {value === k && <motion.span layoutId={'seg' + items.map((i) => i[0]).join()} className={cx('absolute inset-0 rounded-[9px] shadow-sm', dark ? 'bg-lime' : 'bg-paper')} transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  )
}

export function Phone({ children, tint = 'light' }: { children: ReactNode; tint?: 'light' | 'dark' }) {
  return (
    <div className="relative mx-auto w-[390px] shrink-0 rounded-[52px] bg-[#0d0f0e] p-[11px] shadow-[0_40px_80px_-30px_rgba(11,21,16,.55),inset_0_0_0_1.5px_#2c302e]">
      <div className={cx('relative h-[800px] overflow-hidden rounded-[42px]', tint === 'dark' ? 'bg-night' : 'bg-cream')}>
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 h-[30px] w-[108px] -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  )
}

export function StatusBar({ dark }: { dark?: boolean }) {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 30000); return () => clearInterval(i) }, [])
  return (
    <div className={cx('flex h-[46px] items-end justify-between px-8 pb-1.5 text-[13px] font-semibold', dark ? 'text-white' : 'text-ink')}>
      <span className="tnum">{t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x=".5" y=".5" width="20" height="10" rx="3" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="15" height="7" rx="1.5" fill="currentColor" /><rect x="21.5" y="3.5" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
      </span>
    </div>
  )
}

export function Stat({ label, value, unit, foot, icon, accent }: { label: string; value: ReactNode; unit?: string; foot?: ReactNode; icon?: ReactNode; accent?: boolean }) {
  return (
    <div className={cx('card relative overflow-hidden p-5', accent && 'border-l-4 border-l-amber')}>
      <div className="flex items-start justify-between gap-3">
        <Label>{label}</Label>
        {icon && <span className="text-forest/70">{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[32px] font-bold leading-none tnum">{value}</span>
        {unit && <span className="text-sm font-semibold text-mute">{unit}</span>}
      </div>
      {foot && <div className="mt-3 text-xs text-mute">{foot}</div>}
    </div>
  )
}

export function Bar({ value, color = 'bg-forest', track = 'bg-ink/[.07]', h = 'h-2' }: { value: number; color?: string; track?: string; h?: string }) {
  return (
    <div className={cx('overflow-hidden rounded-full', track, h)}>
      <motion.div className={cx('h-full rounded-full', color)} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  )
}
