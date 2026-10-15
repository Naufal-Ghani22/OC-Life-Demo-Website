import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Check, ChevronRight, Menu, RotateCcw, X, Activity, Smartphone, Laptop, ArrowRight, CircleDot,
  Compass, Minimize2, WifiOff, Truck, Factory, Gift, Store, Coins, Ticket, Banknote, Info,
} from 'lucide-react'
import { useStore, go, useToast } from './store'
import { STEPS, ROLES } from './tour'
import { Btn, Logo, Modal, StatusBar, cx } from './kit'
import { time, dateLong, TODAY } from './data'

export function Shell({ path, children }: { path: string; children: ReactNode }) {
  const { s } = useStore()
  const [nav, setNav] = useState(false)
  const [feed, setFeed] = useState(false)
  const [reset, setReset] = useState(false)
  const role = ROLES.find((r) => path.startsWith(r.path))
  useEffect(() => setNav(false), [path])

  return (
    <div className="min-h-screen lg:pl-[272px]">
      {/* Sidebar */}
      <aside className={cx('fixed inset-y-0 left-0 z-[60] flex w-[272px] flex-col bg-night text-white transition-transform duration-300 lg:translate-x-0', nav ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <button onClick={() => go('/')} className="text-left"><Logo light sub="Simulasi terpandu" /></button>
          <button onClick={() => setNav(false)} className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 lg:hidden" aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
          <TourList path={path} />
          <div className="mt-6 px-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Masuk sebagai</div>
          <nav className="mt-2 space-y-0.5">
            {ROLES.map((r) => {
              const on = path.startsWith(r.path)
              return (
                <button key={r.path} onClick={() => go(r.path)} className={cx('group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition', on ? 'bg-white/[.08]' : 'hover:bg-white/[.04]')}>
                  <span className={cx('grid h-7 w-7 place-items-center rounded-lg', on ? 'bg-lime text-night' : 'bg-white/[.06] text-white/60')}>
                    {r.device === 'HP' ? <Smartphone size={14} /> : <Laptop size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-[13.5px] font-semibold', on ? 'text-white' : 'text-white/75')}>{r.name}</span>
                    <span className="block truncate text-[11.5px] text-white/40">{r.who}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
        <div className="border-t border-white/[.07] p-4">
          <div className="mb-3 rounded-xl bg-white/[.04] px-3 py-2.5 text-[11.5px] leading-relaxed text-white/50">
            <span className="font-semibold text-white/80">Pilot SWK Contoh</span> · 25 tenant · data dummy, tersimpan di browser ini.
          </div>
          <button onClick={() => setReset(true)} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-white">
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      </aside>
      {nav && <div className="fixed inset-0 z-[55] bg-night/50 lg:hidden" onClick={() => setNav(false)} />}

      {/* Topbar */}
      <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-cream/85 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setNav(true)} className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-ink/5 lg:hidden" aria-label="Buka menu"><Menu size={20} /></button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] text-mute">
              <button onClick={() => go('/')} className="hover:text-ink">Demo</button>
              <ChevronRight size={12} />
              <span className="truncate">{role ? role.name : 'Beranda'}</span>
            </div>
            <div className="truncate font-display text-[15px] font-semibold">{role ? role.who : 'Pilih peran atau mulai tur'}</div>
          </div>
          {s.offline && <span className="hidden items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 text-xs font-semibold text-[#7a5b00] sm:inline-flex"><WifiOff size={13} /> Mode offline</span>}
          <span className="hidden text-right text-[12px] leading-tight text-mute md:block">
            <span className="block font-semibold text-ink">{dateLong(TODAY + 'T12:00:00+07:00')}</span>
            Tanggal simulasi
          </span>
          <button onClick={() => setFeed(true)} className="relative inline-flex h-10 items-center gap-2 rounded-xl bg-paper px-3 text-[13px] font-semibold ring-1 ring-line transition hover:ring-forest/30">
            <Activity size={16} className="text-forest" />
            <span className="hidden sm:inline">Aktivitas</span>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-lime ring-2 ring-cream" />
          </button>
        </div>
        <MobileProgress />
      </header>

      <main className="relative">{children}</main>

      <Coach path={path} />
      <Toasts />
      <Feed open={feed} onClose={() => setFeed(false)} />
      <ResetDialog open={reset} onClose={() => setReset(false)} />
    </div>
  )
}

function TourList({ path }: { path: string }) {
  const { s, d } = useStore()
  const doneCount = STEPS.filter((st) => st.done(s)).length
  return (
    <div className="rounded-2xl bg-white/[.035] p-3 ring-1 ring-white/[.06]">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Tur 6 langkah</div>
        <div className="font-mono text-[11px] text-lime">{doneCount}/6</div>
      </div>
      <ol className="mt-2.5 space-y-0.5">
        {STEPS.map((st) => {
          const done = st.done(s)
          const cur = s.tour.on && s.tour.step === st.n
          return (
            <li key={st.n}>
              <button
                onClick={() => { d({ t: 'tour', on: true, step: st.n }); go(st.path) }}
                className={cx('flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-white/[.05]', cur && 'bg-white/[.07]')}
              >
                <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', done ? 'bg-lime text-night' : cur ? 'bg-white text-night' : 'bg-white/[.08] text-white/50')}>
                  {done ? <Check size={13} strokeWidth={3} /> : st.n}
                </span>
                <span className={cx('text-[13px]', cur ? 'font-semibold text-white' : done ? 'text-white/70' : 'text-white/55', path === st.path && !cur && 'text-white/80')}>{st.title}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {!s.tour.on && (
        <button onClick={() => { const next = STEPS.find((x) => !x.done(s)) ?? STEPS[0]; d({ t: 'tour', on: true, step: next.n }); go(next.path) }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-2.5 text-[13px] font-bold text-night transition hover:bg-[#b5e33c]">
          {doneCount ? 'Lanjutkan tur' : 'Mulai tur terpandu'} <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}

function MobileProgress() {
  const { s } = useStore()
  if (!s.tour.on) return null
  return (
    <div className="flex gap-1 px-4 pb-2 lg:hidden">
      {STEPS.map((st) => (
        <span key={st.n} className={cx('h-1 flex-1 rounded-full', st.done(s) ? 'bg-forest' : s.tour.step === st.n ? 'bg-lime' : 'bg-ink/10')} />
      ))}
    </div>
  )
}

function Coach({ path }: { path: string }) {
  const { s, d } = useStore()
  const [min, setMin] = useState(false)
  const st = STEPS.find((x) => x.n === s.tour.step)!
  const done = st.done(s)
  const here = path === st.path || path === st.alt || (st.alt && path.startsWith(st.alt))
  const last = st.n === 6
  useEffect(() => setMin(false), [st.n])

  if (!s.tour.on) return null
  const next = () => {
    if (last) { d({ t: 'tour', on: false }); go('/selesai'); return }
    const n = STEPS[st.n]
    d({ t: 'tour', on: true, step: n.n })
    go(n.path)
  }

  if (min) {
    return (
      <button onClick={() => setMin(false)} className="no-print fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-night px-4 py-3 text-sm font-semibold text-white shadow-xl">
        <Compass size={16} className="text-lime" /> Langkah {st.n}/6 {done && <Check size={14} className="text-lime" />}
      </button>
    )
  }

  return (
    <motion.div
      key={st.n}
      initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="no-print fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
    >
      <div className="overflow-hidden rounded-[22px] bg-night text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)] ring-1 ring-white/10">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="flex gap-1">
            {STEPS.map((x) => <span key={x.n} className={cx('h-1.5 rounded-full transition-all', x.n === st.n ? 'w-6 bg-lime' : x.done(s) ? 'w-1.5 bg-lime/60' : 'w-1.5 bg-white/15')} />)}
          </div>
          <span className="ml-auto font-mono text-[11px] text-white/45">LANGKAH {st.n}/6</span>
          <button onClick={() => setMin(true)} aria-label="Perkecil panduan" className="grid h-7 w-7 place-items-center rounded-lg text-white/50 hover:bg-white/10"><Minimize2 size={14} /></button>
          <button onClick={() => d({ t: 'tour', on: false })} aria-label="Keluar dari tur" className="-mr-1 grid h-7 w-7 place-items-center rounded-lg text-white/50 hover:bg-white/10"><X size={15} /></button>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="text-[11.5px] font-medium text-lime/80">{st.actor}</div>
          <div className="mt-0.5 font-display text-lg font-semibold">{st.title}</div>
          <div className={cx('mt-3 flex gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-snug', done ? 'bg-lime/15 text-lime' : 'bg-white/[.06] text-white/85')}>
            <span className={cx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full', done ? 'bg-lime text-night' : 'ring-1.5 ring-white/40')}>
              {done ? <Check size={11} strokeWidth={3} /> : <CircleDot size={10} className="text-white/60" />}
            </span>
            <span>{done ? 'Selesai. Lanjut ke langkah berikutnya.' : st.task}</span>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/50">{st.why}</p>
          <div className="mt-4 flex items-center gap-2">
            {!here && !done && (
              <Btn v="lime" size="sm" onClick={() => go(st.path)} className="flex-1">Buka layar {ROLES.find((r) => r.path === st.path)?.name} <ArrowRight size={14} /></Btn>
            )}
            {(here || done) && (
              <Btn v={done ? 'lime' : 'quiet'} size="sm" onClick={next} disabled={!done} className={cx('flex-1', !done && '!bg-white/[.07] !text-white/40')}>
                {last ? 'Selesaikan tur' : 'Lanjut ke langkah ' + (st.n + 1)} <ArrowRight size={14} />
              </Btn>
            )}
            {!done && <button onClick={next} className="px-2 text-[12px] font-medium text-white/40 hover:text-white/70">Lewati</button>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Toasts() {
  const { toasts, drop } = useToast()
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id} layout initial={{ y: -16, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-paper p-3.5 shadow-[0_16px_40px_-12px_rgba(11,21,16,.35)] ring-1 ring-line"
          >
            <span className={cx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full', { ok: 'bg-murni/10 text-murni', warn: 'bg-amber/20 text-[#8a6500]', err: 'bg-tolak/10 text-tolak', info: 'bg-forest/10 text-forest' }[t.tone ?? 'ok'])}>
              {t.tone === 'err' || t.tone === 'warn' ? <Info size={15} /> : <Check size={15} strokeWidth={2.6} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.desc && <div className="mt-0.5 text-[12.5px] leading-snug text-mute">{t.desc}</div>}
            </div>
            {t.action && <button onClick={() => { t.action!.run(); drop(t.id) }} className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-bold text-forest hover:bg-forest/5">{t.action.label}</button>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

const KIND: Record<string, { icon: typeof Truck; c: string }> = {
  tenant: { icon: Store, c: 'bg-forest/10 text-forest' },
  pickup: { icon: Truck, c: 'bg-forest/10 text-forest' },
  pdu: { icon: Factory, c: 'bg-lime/40 text-night' },
  'pdu-reject': { icon: Factory, c: 'bg-tolak/10 text-tolak' },
  points: { icon: Coins, c: 'bg-amber/25 text-[#7a5b00]' },
  voucher: { icon: Ticket, c: 'bg-amber/25 text-[#7a5b00]' },
  redeem: { icon: Gift, c: 'bg-murni/10 text-murni' },
  sale: { icon: Banknote, c: 'bg-forest/10 text-forest' },
}

export function EventList({ limit = 30, dark }: { limit?: number; dark?: boolean }) {
  const { s } = useStore()
  const list = [...s.events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {list.map((e) => {
          const k = KIND[e.kind] ?? KIND.pickup
          const I = k.icon
          return (
            <motion.li key={e.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={cx('flex gap-3 rounded-xl px-2 py-2', dark ? 'hover:bg-white/[.04]' : 'hover:bg-ink/[.03]')}>
              <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', dark ? 'bg-white/[.07] text-lime' : k.c)}><I size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className={cx('text-[13px] leading-snug', dark ? 'text-white/85' : 'text-ink')}>{e.text}</div>
                <div className={cx('mt-0.5 text-[11.5px]', dark ? 'text-white/40' : 'text-mute')}>{e.actor} · {time(e.at)}{e.batchId && <> · <button onClick={() => go('/ledger/' + e.batchId)} className="font-mono underline-offset-2 hover:underline">{e.batchId.slice(-12)}</button></>}</div>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

function Feed({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-night/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-paper shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <div className="font-display text-lg font-semibold">Aktivitas langsung</div>
                <div className="text-xs text-mute">Setiap aksi di semua peran tercatat di sini</div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 hover:bg-ink/10" aria-label="Tutup"><X size={18} /></button>
            </div>
            <div className="thin-scroll flex-1 overflow-y-auto p-3"><EventList limit={60} /></div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function ResetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d } = useStore()
  const { push } = useToast()
  return (
    <Modal open={open} onClose={onClose} title="Reset demo">
      <div className="p-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber/20 text-[#7a5b00]"><RotateCcw size={20} /></div>
        <h3 className="mt-4 text-xl font-semibold">Kembalikan data awal?</h3>
        <p className="mt-2 text-sm leading-relaxed text-mute">Batch, poin, voucher, dan progres tur yang dibuat selama demo akan dihapus. Data 30 hari pilot SWK dimuat ulang.</p>
        <div className="mt-6 flex gap-2">
          <Btn v="quiet" className="flex-1" onClick={onClose}>Batal</Btn>
          <Btn v="primary" className="flex-1" onClick={() => { d({ t: 'reset' }); onClose(); go('/'); push({ title: 'Demo direset', desc: 'Siap untuk presentasi berikutnya.', tone: 'info' }) }}>Reset</Btn>
        </div>
      </div>
    </Modal>
  )
}

// Panggung perangkat: bingkai HP di desktop, layar penuh di ponsel
export function useDesktop() {
  const q = '(min-width: 1024px)'
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return m
}

export function DeviceStage({ children, side, tint }: { children: ReactNode; side: ReactNode; tint?: 'light' | 'dark' }) {
  const desk = useDesktop()
  if (!desk) return <div className="pb-48">{children}</div>
  return (
    <>
      <div className="flex gap-10 px-8 py-8 xl:px-12">
        <div className="sticky top-24 self-start">
          <PhoneFrame tint={tint}>{children}</PhoneFrame>
        </div>
        <div className="min-w-0 flex-1 pb-40">{side}</div>
      </div>
    </>
  )
}

function PhoneFrame({ children, tint }: { children: ReactNode; tint?: 'light' | 'dark' }) {
  return (
    <div className="relative mx-auto w-[390px] shrink-0 rounded-[52px] bg-[#0d0f0e] p-[11px] shadow-[0_40px_80px_-30px_rgba(11,21,16,.55),inset_0_0_0_1.5px_#2c302e]">
      <div className={cx('relative h-[min(800px,calc(100vh-150px))] overflow-hidden rounded-[42px]', tint === 'dark' ? 'bg-night' : 'bg-cream')}>
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 h-[28px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
        <div className="no-scrollbar h-full overflow-y-auto" id="phone-scroll">
          <div className={cx('sticky top-0 z-30', tint === 'dark' ? 'bg-night' : 'bg-cream')}><StatusBar dark={tint === 'dark'} /></div>
          {children}
        </div>
        <div id="phone-overlay" className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded-[42px]" />
      </div>
    </div>
  )
}

export function SidePanel({ photo, eyebrow, title, body, children }: { photo: string; eyebrow: string; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="relative aspect-[16/8] overflow-hidden">
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">{eyebrow}</div>
            <div className="mt-1 max-w-lg font-display text-2xl font-semibold leading-tight">{title}</div>
          </div>
        </div>
        <p className="p-6 pt-5 text-[14.5px] leading-relaxed text-mute">{body}</p>
      </div>
      {children}
    </div>
  )
}
