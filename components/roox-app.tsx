'use client';

/* Native links and images support both the static Vercel build and Vinext. */
/* oxlint-disable next/no-html-link-for-pages, next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, Box, Check, CircleGauge, Clock3, Cpu, ExternalLink, Globe2, Menu, Search, ShieldCheck, Sparkles, Wallet, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pages, type PageId } from '@/lib/pages';
import { Documentation } from '@/components/documentation';

type Provider = {
  id: string; name: string; model: string; gpu: string; region: string;
  price: number; latency: number; uptime: string; available: number;
  tint: string; kind: 'Language' | 'Reasoning' | 'Image';
};

const providers: Provider[] = [
  { id: 'kyr-8f2a', name: 'Northstar Labs', model: 'Llama 3.3 70B', gpu: '8x H100 SXM', region: 'Amsterdam', price: .0048, latency: 182, uptime: '99.98%', available: 14, tint: '#c8ff30', kind: 'Language' },
  { id: 'kyr-39bd', name: 'Nodal Works', model: 'DeepSeek R1', gpu: '4x A100 80GB', region: 'Lagos', price: .0031, latency: 214, uptime: '99.94%', available: 8, tint: '#f1f1ec', kind: 'Reasoning' },
  { id: 'kyr-10ce', name: 'Bitforge Compute', model: 'Qwen 2.5 72B', gpu: '8x RTX 4090', region: 'Frankfurt', price: .0024, latency: 238, uptime: '99.91%', available: 22, tint: '#7dffce', kind: 'Language' },
  { id: 'kyr-75aa', name: 'Arc Relay', model: 'Mistral Large', gpu: '2x H200', region: 'Toronto', price: .0052, latency: 196, uptime: '99.97%', available: 6, tint: '#cbb8ff', kind: 'Language' },
  { id: 'kyr-20fa', name: 'Silica Network', model: 'FLUX.1 Dev', gpu: '4x L40S', region: 'Singapore', price: .0067, latency: 267, uptime: '99.89%', available: 11, tint: '#ffcd6b', kind: 'Image' },
  { id: 'kyr-61dd', name: 'Vector House', model: 'Llama 3.1 8B', gpu: '2x RTX 6000 Ada', region: 'New York', price: .0007, latency: 94, uptime: '99.99%', available: 31, tint: '#74cfff', kind: 'Language' },
];

export default function RooxApp({ page = 'home' }: { page?: PageId | 'not-found' }) {
  const hero = useRef<HTMLDivElement>(null);
  const checkout = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All models');
  const [wallet, setWallet] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<Provider | null>(null);
  const [run, setRun] = useState<'idle' | 'running' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Keep links shared before the multi-page release working.
    if (page === 'home' && ['#market', '#providers'].includes(window.location.hash)) {
      window.location.replace(window.location.hash === '#market' ? '/market' : '/providers');
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [page]);

  useEffect(() => {
    if (!selected || !checkout.current) return;
    const dialog = checkout.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [selected]);

  function closeCheckout() {
    if (timer.current) clearTimeout(timer.current);
    setSelected(null);
    setRun('idle');
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return providers.filter((p) => (!q || [p.name, p.model, p.gpu, p.region].join(' ').toLowerCase().includes(q)) && (filter === 'All models' || p.kind === filter));
  }, [filter, query]);

  function moveHero(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    hero.current?.style.setProperty('--pointer-x', String(((event.clientX - rect.left) / rect.width - .5) * -18) + 'px');
    hero.current?.style.setProperty('--pointer-y', String(((event.clientY - rect.top) / rect.height - .5) * -12) + 'px');
  }

  async function connect() {
    setNote('');
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) return setNote('Open Roox in an EVM wallet to connect.');
    try {
      try { await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1237' }] }); }
      catch {
        await eth.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x1237', chainName: 'Robinhood Chain', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'], blockExplorerUrls: ['https://robinhoodchain.blockscout.com'] }] });
      }
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts[0]) setWallet(accounts[0]);
    } catch { setNote('Connection was not completed. Check your wallet for its current network.'); }
  }

  function runCall() {
    if (run !== 'idle') return;
    setRun('running');
    timer.current = setTimeout(() => setRun('done'), 1500);
  }

  return (
    <main className={'min-h-screen overflow-hidden bg-background text-foreground' + (page === 'home' ? '' : ' pt-16')}>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.07] bg-[#080908]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <a href="/" className="flex items-center gap-3" aria-label="Roox home">
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-full border border-white/10 bg-black shadow-[0_0_32px_rgba(200,255,48,.16)]">
              <img src="/kyros-mark.png" alt="" aria-hidden="true" className="size-10 scale-[1.36] object-contain" />
            </span>
            <span className="text-[17px] font-semibold tracking-[-.055em]">ROOX</span>
          </a>
          <nav aria-label="Main navigation" className="hidden gap-7 text-xs text-white/55 md:flex">{pages.map((item) => <a key={item.id} href={item.path} aria-current={page === item.id ? 'page' : undefined} className={page === item.id ? 'text-white' : 'hover:text-white'}>{item.label}</a>)}</nav>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 text-[10px] uppercase tracking-[.12em] text-white/45 xl:flex"><span className="size-1.5 animate-pulse rounded-full bg-[#c8ff30]" />Robinhood Chain</span>
            <Button onClick={connect} className="ml-2 h-9 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-[#c8ff30]"><Wallet data-icon="inline-start" />{wallet ? wallet.slice(0, 5) + '...' + wallet.slice(-4) : 'Connect'}</Button>
            <details className="relative md:hidden"><summary aria-label="Open navigation" className="grid size-9 cursor-pointer list-none place-items-center rounded-full border border-white/15 [&::-webkit-details-marker]:hidden"><Menu className="size-4" /></summary><nav aria-label="Mobile navigation" className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-[#0e100f] p-2 shadow-xl">{pages.map((item) => <a key={item.id} href={item.path} aria-current={page === item.id ? 'page' : undefined} className={'block rounded-xl px-4 py-3 text-xs ' + (page === item.id ? 'text-[#c8ff30]' : 'text-white/60 hover:text-white')}>{item.label}</a>)}</nav></details>
          </div>
        </div>
      </header>
      {page !== 'home' && note && <output className="block mx-auto max-w-[1480px] px-5 pt-6 text-xs text-white/55 lg:px-10">{note}</output>}

      {page === 'home' && <section id="top" className="border-b border-white/[.08] pt-16">
        <div ref={hero} onPointerMove={moveHero} onPointerLeave={() => { hero.current?.style.setProperty('--pointer-x', '0px'); hero.current?.style.setProperty('--pointer-y', '0px'); }} className="hero-stage relative min-h-[694px] overflow-hidden">
          <img className="hero-art absolute inset-0 h-full w-full object-cover object-center" src="/kyros-hero.png" alt="A suspended compute core between two wireframe hands" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,8,.2),rgba(8,9,8,.03)_42%,rgba(8,9,8,.9))]" />
          <div className="hero-grid absolute inset-0" /><div className="light-sweep absolute inset-y-0 w-1/3" /><div className="noise pointer-events-none absolute inset-0 opacity-[.14]" />
          <div className="relative z-10 mx-auto flex min-h-[694px] max-w-[1480px] flex-col px-5 pb-8 pt-16 lg:px-10 lg:pt-20">
            <div className="flex items-start justify-between">
              <Badge className="h-7 rounded-full border border-white/15 bg-black/25 px-3 text-[10px] uppercase tracking-[.14em] text-white/75 backdrop-blur-md"><Sparkles data-icon="inline-start" className="text-[#c8ff30]" />The open inference layer</Badge>
              <div className="hidden text-right font-mono text-[9px] uppercase leading-5 tracking-[.12em] text-white/35 lg:block"><p>Chain / 4663</p><p>Settlement / ETH</p><p>Market / permissionless</p></div>
            </div>
            <div className="mx-auto mt-10 max-w-5xl text-center lg:mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[.22em] text-[#c8ff30]">Your model. Their silicon.</p>
              <h1 className="text-balance text-[clamp(3.5rem,8.4vw,8.2rem)] font-medium leading-[.82] tracking-[-.075em]">Compute without<br /><span className="text-white/50">the cloud.</span></h1>
              <p className="mx-auto mt-6 max-w-xl text-balance text-sm leading-6 text-white/58 sm:text-base">A marketplace for spare GPU capacity. Built for pay-per-call AI inference and future settlement on Robinhood Chain.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button render={<a href="/market" aria-label="Explore compute" />} className="h-11 rounded-full bg-[#c8ff30] px-5 text-sm font-semibold text-black shadow-[0_0_44px_rgba(200,255,48,.18)] hover:bg-[#d6ff61]">Explore compute <ArrowDownRight data-icon="inline-end" /></Button>
                <Button render={<a href="/providers" aria-label="List your GPU" />} variant="outline" className="h-11 rounded-full border-white/18 bg-black/25 px-5 text-sm text-white backdrop-blur-md hover:bg-white/10">List your GPU <ArrowRight data-icon="inline-end" /></Button>
              </div>
              {note && <p className="mt-3 text-xs text-white/55">{note}</p>}
            </div>
            <div className="mt-auto grid grid-cols-2 border-y border-white/10 bg-black/20 backdrop-blur-sm sm:grid-cols-4">
              {[['1,284', 'demo GPUs online'], ['42.8M', 'demo calls settled'], ['196 ms', 'demo latency'], ['$0.0032', 'demo cost / call']].map(([value, label], i) => <div key={label} className={'px-4 py-4 ' + (i ? 'border-l border-white/10' : '')}><p className="font-mono text-lg sm:text-xl">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/38">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>}

      {page === 'market' && <section id="market" aria-label="GPU marketplace" className="mx-auto max-w-[1480px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="mb-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div><p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#c8ff30]"><span className="h-px w-7 bg-[#c8ff30]" />Demo capacity</p><h1 className="text-4xl font-medium leading-[.95] tracking-[-.055em] sm:text-6xl">Find your next<br /><span className="text-white/40">inference engine.</span></h1></div>
          <div className="w-full max-w-xl space-y-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><Input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search providers" placeholder="Search model, GPU, region, provider..." className="h-11 rounded-full border-white/12 bg-white/[.04] pl-10 placeholder:text-white/30" /></div>
            <div className="flex flex-wrap gap-2">{['All models', 'Language', 'Reasoning', 'Image'].map((item) => <button key={item} onClick={() => setFilter(item)} aria-pressed={item === filter} className={'rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[.11em] transition-colors ' + (item === filter ? 'border-[#c8ff30] bg-[#c8ff30] text-black' : 'border-white/12 text-white/48 hover:text-white')}>{item}</button>)}</div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p, i) => (
            <article key={p.id} className="compute-card group relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0e100f] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-white/20" style={{ '--provider-tint': p.tint } as React.CSSProperties}>
              <div className="card-radar absolute -right-14 -top-16 size-52 rounded-full border border-white/[.06]" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-black/40"><Cpu className="size-5 group-hover:text-[var(--provider-tint)]" /></div><div><h3 className="text-sm font-semibold">{p.name}</h3><p className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-white/35">{p.id}</p></div></div>
                <Badge variant="outline" className="border-white/10 text-[9px] text-white/50"><ShieldCheck data-icon="inline-start" className="text-[#c8ff30]" />Demo</Badge>
              </div>
              <div className="relative mt-8"><p className="text-[10px] uppercase tracking-[.15em] text-white/35">Serves</p><h3 className="mt-2 text-2xl font-medium tracking-[-.045em]">{p.model}</h3><p className="mt-1 text-xs text-white/42">{p.gpu}</p></div>
              <div className="relative mt-8 grid grid-cols-3 border-y border-white/[.08] py-3">
                <Metric icon={<Clock3 />} value={String(p.latency) + 'ms'} label="Latency" />
                <Metric icon={<CircleGauge />} value={p.uptime} label="Uptime" border />
                <Metric icon={<Globe2 />} value={p.region} label="Region" border />
              </div>
              <div className="relative mt-5 flex items-end justify-between">
                <div><p className="font-mono text-xl">{'$' + p.price.toFixed(4)}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/35">per completed call</p></div>
                <Button onClick={() => { setSelected(p); setRun('idle'); }} className="h-9 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-[var(--provider-tint)]">Run a call <ArrowRight data-icon="inline-end" /></Button>
              </div>
              <div className="relative mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[.12em] text-white/35"><span className="size-1.5 rounded-full bg-[var(--provider-tint)] shadow-[0_0_12px_var(--provider-tint)]" />{p.available} workers available<span className="ml-auto font-mono">{'0' + String(i + 1)}</span></div>
            </article>
          ))}
        </div>
        {!visible.length && <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center text-sm text-white/45">No demo providers match that search.</div>}
      </section>}

      {page === 'home' && <section id="protocol" className="border-y border-white/[.08] bg-[#0b0c0b]">
        <div className="mx-auto grid max-w-[1480px] lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative overflow-hidden border-white/[.08] px-5 py-20 lg:border-r lg:px-10 lg:py-28">
            <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,rgba(200,255,48,.16),transparent_30%)]" />
            <p className="relative text-[10px] uppercase tracking-[.18em] text-[#c8ff30]">The protocol</p><h2 className="relative mt-4 text-4xl font-medium leading-[.95] tracking-[-.055em] sm:text-6xl">Trust the proof,<br /><span className="text-white/40">not the promise.</span></h2><p className="relative mt-6 max-w-md text-sm leading-6 text-white/50">Roox is designed around signed inference receipts. Verified results and onchain settlement are the next protocol layer.</p>
          </div>
          <div className="grid sm:grid-cols-3"><Step icon={<Box />} n="01" title="Match" body="Choose a model, price, and performance target." /><Step icon={<Zap />} n="02" title="Infer" body="Route the request to a worker. Pilot integration is in progress." border /><Step icon={<Check />} n="03" title="Settle" body="Planned: a signed receipt releases payment onchain." border /></div>
        </div>
      </section>}

      {page === 'providers' && <section id="providers" aria-label="Provide compute" className="mx-auto max-w-[1480px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="relative overflow-hidden rounded-[28px] bg-white p-8 text-black sm:p-12 lg:p-16">
          <div className="absolute -right-24 -top-32 size-80 rounded-full border-[40px] border-[#c8ff30]/45" />
          <div className="relative max-w-3xl"><p className="text-[10px] font-semibold uppercase tracking-[.18em]">For GPU owners</p><h1 className="mt-4 text-5xl font-medium leading-[.9] tracking-[-.065em] sm:text-7xl">Idle silicon<br />is wasted potential.</h1><p className="mt-6 max-w-xl text-sm leading-6 text-black/55">Prepare your GPU for the Roox pilot. Connect a model endpoint and validate real inference before paid workloads go live.</p><Button render={<a href="/docs#providers" aria-label="Become a provider" />} className="mt-8 h-11 rounded-full bg-black px-5 text-sm text-white">Become a provider <ExternalLink data-icon="inline-end" /></Button></div>
        </div>
        <div className="mt-10 grid rounded-[22px] border border-white/10 bg-[#0e100f] sm:grid-cols-3"><Step icon={<Cpu />} n="01" title="Prepare" body="Choose the hardware and model you want to serve." /><Step icon={<Globe2 />} n="02" title="Connect" body="Read the pilot guide and connect a private worker endpoint." border /><Step icon={<ShieldCheck />} n="03" title="Validate" body="Test a real call before enabling any paid workloads." border /></div>
        <p className="mt-6 text-xs leading-6 text-white/45">Provider onboarding and payouts are not live yet. The guide describes the controlled pilot and the remaining launch requirements.</p>
      </section>}

      {page === 'docs' && <Documentation />}
      {page === 'not-found' && <section className="mx-auto max-w-[1480px] px-5 py-28 lg:px-10"><p className="text-[10px] uppercase tracking-[.18em] text-[#c8ff30]">404 / Page not found</p><h1 className="mt-4 text-5xl font-medium tracking-[-.055em]">Nothing routed here.</h1><Button render={<a href="/" aria-label="Return to Roox" />} className="mt-8 rounded-full bg-[#c8ff30] text-black">Return to Roox <ArrowRight /></Button></section>}

      <footer className="border-t border-white/[.08] px-5 py-8"><div className="mx-auto flex max-w-[1480px] justify-between text-[10px] uppercase tracking-[.13em] text-white/30"><p>2026 Roox Protocol</p><p>Built for Robinhood Chain.</p></div></footer>

      {selected && <dialog ref={checkout} className="fixed inset-0 z-[80] m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-white backdrop-blur-xl backdrop:bg-transparent" aria-labelledby="checkout-title" onCancel={(event) => { event.preventDefault(); closeCheckout(); }}>
        <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/12 bg-[#111311]">
          <div className="flex justify-between border-b border-white/10 p-5"><div><p className="text-[9px] uppercase tracking-[.15em] text-[#c8ff30]">Inference checkout</p><h2 id="checkout-title" className="mt-2 text-xl font-medium">{selected.model}</h2><p className="mt-1 text-xs text-white/42">via {selected.name}</p></div><button onClick={closeCheckout} aria-label="Close checkout" className="size-8 rounded-full border border-white/10 text-white/50">x</button></div>
          <div className="space-y-4 p-5">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-white/55"><p><span className="text-[#c8ff30]">POST</span> /v1/inference</p><p className="mt-3 text-white/30">{'{ model: "' + selected.model + '", max_tokens: 256 }'}</p></div>
            <div className="grid grid-cols-3 gap-2"><Mini label="Est. cost" value={'$' + selected.price.toFixed(4)} /><Mini label="Latency" value={String(selected.latency) + 'ms'} /><Mini label="Network" value="RH 4663" /></div>
            {run === 'done' ? <output className="block rounded-2xl border border-[#c8ff30]/20 bg-[#c8ff30]/[.06] p-4"><p className="flex gap-2 text-sm font-medium text-[#c8ff30]"><Check className="size-4" />Demo call complete</p><p className="mt-2 text-xs text-white/45">Simulation only. No real inference, signed receipt, or payment was created.</p></output> : <p className="text-xs leading-5 text-white/40">Prototype only. This test will not spend funds.</p>}
            <Button onClick={runCall} disabled={run !== 'idle'} className="h-11 w-full rounded-full bg-[#c8ff30] text-black">{run === 'running' ? 'Routing to worker...' : run === 'done' ? 'Call complete' : 'Run test call'}</Button>
          </div>
        </div>
      </dialog>}
    </main>
  );
}

function Metric({ icon, value, label, border = false }: { icon: React.ReactNode; value: string; label: string; border?: boolean }) {
  return <div className={border ? 'border-l border-white/[.08] pl-3' : ''}><p className="flex items-center gap-1.5 truncate text-[11px] text-white/75"><span className="[&>svg]:size-3 [&>svg]:text-white/30">{icon}</span>{value}</p><p className="mt-1 text-[8px] uppercase tracking-[.12em] text-white/28">{label}</p></div>;
}
function Step({ icon, n, title, body, border = false }: { icon: React.ReactNode; n: string; title: string; body: string; border?: boolean }) {
  return <div className={'group min-h-72 p-7 ' + (border ? 'border-l border-white/[.08]' : '')}><span className="font-mono text-[10px] text-white/25">{n}</span><span className="mt-14 block text-[#c8ff30] transition-transform group-hover:rotate-12 [&>svg]:size-7">{icon}</span><h3 className="mt-6 text-xl">{title}</h3><p className="mt-3 text-xs leading-5 text-white/42">{body}</p></div>;
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="font-mono text-xs">{value}</p><p className="mt-1 text-[8px] uppercase tracking-[.11em] text-white/30">{label}</p></div>;
}
