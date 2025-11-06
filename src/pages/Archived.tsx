
import React, { useMemo, useState, useCallback, useDeferredValue, useRef, useEffect } from 'react'
import { Download, Eye, Undo2, Search, ChevronDown, SlidersHorizontal, User as UserIcon, LogOut, ArrowLeft, ArrowUp, ArrowDown, History } from 'lucide-react'

const SITES = [
  { id: '229', name: 'Kroger Compton Ca' },
  { id: '234', name: 'Kroger Paramount Ca' },
  { id: '248', name: 'Shamrock Eastvale Ca' },
  { id: '415', name: 'Super Store Ind Lathrop Ca' },
]
const LABELS: Record<string,string> = {
  plan: 'Incentive Pay Plans',
  servicesCount: '# of Services',
  revenueType: 'Revenue Type',
  effectiveStart: 'Start Date',
  effectiveEnd: 'End Date',
  archivedBy: 'Removed by',
  dateArchived: 'Remove Timestamp',
  actions: 'Actions',
}

type Row = {
  id: string; plan: string; servicesCount: number; revenueType: string;
  effectiveStart: string; effectiveEnd: string; archivedBy: string; dateArchived: string;
}

const MOCK: Row[] = [
  { id: '229-1', plan: '229 – Shipping – v1.0000', servicesCount: 4, revenueType: 'Bill Code', effectiveStart: '01/10/2025', effectiveEnd: '04/15/2025', archivedBy: 'j.smith', dateArchived: '04/20/2025 09:15 PST' },
  { id: '229-2', plan: '229 – Pallet Management – v1.0003', servicesCount: 2, revenueType: 'Dock', effectiveStart: '02/01/2025', effectiveEnd: '05/01/2025', archivedBy: 'a.ortiz', dateArchived: '05/03/2025 14:05 PST' },
  { id: '229-3', plan: '229 – Receiving – v1.0012', servicesCount: 3, revenueType: 'Load Type', effectiveStart: '03/05/2025', effectiveEnd: '06/30/2025', archivedBy: 'm.tanaka', dateArchived: '07/02/2025 08:40 PST' },
  { id: '229-4', plan: '229 – Unloading – v1.0020', servicesCount: 5, revenueType: 'Bill Code', effectiveStart: '04/15/2025', effectiveEnd: '08/01/2025', archivedBy: 'l.ng', dateArchived: '08/05/2025 16:22 PST' },
]

function parseRemoveTs(ts: string){
  try{
    const [d,t] = ts.split(' ')
    const [mm,dd,yyyy] = d.split('/').map(Number)
    const [hh,mi] = (t||'0:0').split(':').map(Number)
    return new Date(yyyy, mm-1, dd, hh, mi).getTime()
  }catch{return 0}
}
function parseMDY(mdy: string){ const [mm,dd,yyyy] = mdy.split('/').map(Number); return new Date(yyyy,mm-1,dd).getTime() }

export default function App(){
  const [siteId, setSiteId] = useState('229')
  const [preset, setPreset] = useState<'ytd'|'lastYear'|'lastQuarter'|'lastMonth'|'lastWeek'|'today'>('ytd')
  const [search, setSearch] = useState('')
  const [plans, setPlans] = useState<Row[]>(MOCK)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [openRestoreRow, setOpenRestoreRow] = useState<Row|null>(null)
  const [openAuditRow, setOpenAuditRow] = useState<Row|null>(null)
  const [openViewRow, setOpenViewRow] = useState<Row|null>(null)
  const [toast, setToast] = useState<{title:string, lines?:string[]}|null>(null)
  const [toastPhase, setToastPhase] = useState<'in'|'out'>('in')
  const deferredSearch = useDeferredValue(search)

  // Sort
  const SORTABLE = useMemo(()=> new Set(['servicesCount','effectiveStart','effectiveEnd','dateArchived']), [])
  const [sortBy,setSortBy] = useState<string>('dateArchived')
  const [sortDir,setSortDir] = useState<'asc'|'desc'>('desc')
  const toggleSort = useCallback((id:string)=>{
    if(!SORTABLE.has(id)) return
    setSortBy(prev => prev===id ? prev : id)
    setSortDir(d => sortBy===id ? (d==='asc'?'desc':'asc') : 'asc')
  },[SORTABLE, sortBy])

  const range = useMemo(()=>{
    const now = new Date(), startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()), startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1)
    if(preset==='today') return {start:+startOfToday, end:+startOfTomorrow}
    if(preset==='ytd') return {start:+new Date(now.getFullYear(),0,1), end:+startOfTomorrow}
    if(preset==='lastYear'){ const y=now.getFullYear(); return {start:+new Date(y-1,0,1), end:+new Date(y,0,1)} }
    if(preset==='lastMonth'){ const y=now.getFullYear(), m=now.getMonth(); return {start:+new Date(y,m-1,1), end:+new Date(y,m,1)} }
    if(preset==='lastWeek'){ const end=+startOfTomorrow; const start=end-7*86400000; return {start,end} }
    const y=now.getFullYear(), m=now.getMonth(), curQ=Math.floor(m/3), lastQ=(curQ+3-1)%4, qYear=curQ===0?y-1:y
    return {start:+new Date(qYear,lastQ*3,1), end:+new Date(curQ===0?y:y, curQ*3,1)}
  },[preset])

  const rows = useMemo(()=>{
    const base = plans.filter(r => String(r.plan).startsWith(siteId))
    const byDate = base.filter(r=>{
      const t = parseRemoveTs(r.dateArchived)
      return t>=range.start && t<range.end
    })
    const q = deferredSearch.trim().toLowerCase()
    const filtered = q? byDate.filter(r=> r.plan.toLowerCase().includes(q) || r.revenueType.toLowerCase().includes(q) || r.archivedBy.toLowerCase().includes(q)) : byDate
    const arr = [...filtered]
    const getVal = (row:Row, key:string) => {
      if(key==='servicesCount') return row.servicesCount
      if(key==='effectiveStart') return parseMDY(row.effectiveStart)
      if(key==='effectiveEnd') return parseMDY(row.effectiveEnd)
      if(key==='dateArchived') return parseRemoveTs(row.dateArchived)
      return String((row as any)[key]??'').toLowerCase()
    }
    const dir = sortDir==='asc'?1:-1
    if(SORTABLE.has(sortBy)){
      arr.sort((a,b)=>{
        const av=getVal(a,sortBy), bv=getVal(b,sortBy)
        if(typeof av==='number' && typeof bv==='number') return (av-bv)*dir
        return String(av).localeCompare(String(bv))*dir
      })
    }
    return arr
  },[plans, siteId, range, deferredSearch, sortBy, sortDir, SORTABLE])

  const allVisible = rows.length>0 && rows.every(r=>selected[r.id])
  const someVisible = rows.some(r=>selected[r.id]) && !allVisible
  const toggleAll = (v:boolean)=> setSelected(prev=>{ const nx={...prev}; rows.forEach(r=>nx[r.id]=v); return nx })

  const exportCsv = () => {
    const visibleCols = ['plan','servicesCount','revenueType','effectiveStart','effectiveEnd','archivedBy','dateArchived']
    const header = visibleCols.map(c=>LABELS[c]).join(',')
     const lines = rows.map(r => 
    visibleCols.map(id => {
      const s = String((r as any)[id] ?? '').replace(/"/g, '""');
      return s.includes(',') ? `"${s}"` : s;
    }).join(',')
  );
    const csv = header + '\n' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download=`archive_${siteId}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const showToast = (title:string, lines?:string[]) => {
    setToast({title, lines}); setToastPhase('in')
    window.setTimeout(()=>{ setToastPhase('out'); window.setTimeout(()=>setToast(null), 200) }, 5000)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="flex items-center justify-between px-6 py-3 bg-[#1072BE] text-white shadow-sm">
        <button onClick={()=>window.location.assign('/')} className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-white" aria-hidden />
          <span className="text-sm font-medium">Capstone Logistics</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="text-sm px-3 h-8 rounded hover:bg-blue-500">Help</button>
          <button className="h-9 w-9 grid place-items-center rounded-full bg-white text-[#1072BE] shadow"><UserIcon className="w-5 h-5"/></button>
        </div>
      </header>

      <main className="p-6">
        <button onClick={()=>window.history.length>1?window.history.back():window.location.assign('/')} className="inline-flex items-center gap-2 text-blue-700 hover:underline text-sm">
          <ArrowLeft className="h-4 w-4"/> Back to last page
        </button>

        <div className="rounded-lg border bg-white mt-4">
          <div className="p-5">
            <h1 className="text-2xl font-semibold">Archive</h1>
            <p className="mt-2 text-sm text-slate-600">Review and restore archived Site Incentive Pay Plans. Filter by site/date, search, and export.</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white mt-4">
          <div className="p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-600 mb-1">Site</span>
                <div className="relative">
                  <select value={siteId} onChange={e=>setSiteId(e.target.value)} className="h-10 px-3 min-w-[24ch] md:min-w-[32ch] rounded-md border shadow-sm">
                    {SITES.sort((a,b)=>a.name.localeCompare(b.name)).map(s=>(<option key={s.id} value={s.id}>{s.name} ({s.id})</option>))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-600 mb-1">Date range</span>
                <select value={preset} onChange={e=>setPreset(e.target.value as any)} className="h-10 w-44 rounded-md border shadow-sm">
                  <option value="ytd">Year to date</option>
                  <option value="lastYear">Last year</option>
                  <option value="lastQuarter">Last quarter</option>
                  <option value="lastMonth">Last month</option>
                  <option value="lastWeek">Last week</option>
                  <option value="today">Today</option>
                </select>
              </div>
            </div>

            <div className="mt-2 md:mt-0 flex justify-end gap-2">
              <button
                className={"h-10 w-10 p-0 border rounded bg-white text-slate-800 " + (rows.filter(r=>selected[r.id]).length===0 ? "opacity-50 cursor-not-allowed" : "bg-yellow-100 text-yellow-900")}
                disabled={rows.filter(r=>selected[r.id]).length===0}
                title="Restore selected"
                onClick={()=>setOpenRestoreRow({id:'bulk', plan:'(bulk)', servicesCount:0, revenueType:'', effectiveStart:'', effectiveEnd:'', archivedBy:'', dateArchived:''})}
              ><Undo2 className="h-4 w-4 m-auto"/></button>
              <button title="Customize columns" className="h-10 w-10 p-0 border rounded bg-white text-slate-800"><SlidersHorizontal className="h-4 w-4 m-auto"/></button>
              <button title="Export CSV" onClick={exportCsv} className="h-10 w-10 p-0 border rounded bg-white text-slate-800"><Download className="h-4 w-4 m-auto"/></button>
              <button className="h-10 px-3 border rounded text-sm">Seed samples</button>
            </div>
          </div>

          <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-[minmax(320px,1fr)_auto] md:items-center md:gap-4">
            <div className="flex w-full items-center gap-3 md:max-w-2xl flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plans, site, revenue type, removed by" className="pl-9 h-10 w-full rounded-md border" />
              </div>
              <button type="button" onClick={()=>setSearch('')} className="ml-3 text-sm text-slate-700 underline underline-offset-4 hover:text-slate-900 whitespace-nowrap">Reset filters</button>
            </div>
            <div className="mt-2 md:mt-0 text-sm text-slate-600 text-right">{rows.length} result{rows.length===1?'':'s'}</div>
          </div>
        </div>

        {/* Table */}
        <div className="relative">
          <div className="hidden md:block mt-4 overflow-y-auto rounded-lg border bg-white" style={{maxHeight:'min(70vh,720px)'}}>
            <table className="min-w-[960px] w-full table-fixed">
              <colgroup>
                <col style={{width:40}} />
                <col style={{width:132}} />
                <col /><col style={{width:120}} /><col style={{width:220}} /><col style={{width:140}} /><col style={{width:140}} /><col style={{width:180}} /><col style={{width:220}} />
              </colgroup>
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="w-10"><input type="checkbox" aria-label="Select all visible" checked={allVisible?true:(someVisible?true:false)} onChange={e=>toggleAll(e.target.checked)} /></th>
                  <th className="text-center">{LABELS.actions}</th>
                  {['plan','servicesCount','revenueType','effectiveStart','effectiveEnd','archivedBy','dateArchived'].map((id)=>{
                    const isSortable = SORTABLE.has(id); const ariaSort = sortBy===id ? (sortDir==='asc'?'ascending':'descending') : 'none'
                    return (
                      <th key={id} aria-sort={isSortable?ariaSort:undefined} className={(id==='servicesCount'?'text-right ':'') + 'whitespace-nowrap overflow-hidden text-ellipsis'}>
                        {isSortable ? (
                          <button type="button" onClick={()=>toggleSort(id)} className="group inline-flex items-center gap-1 max-w-full" title={LABELS[id]}>
                            <span className="block truncate">{LABELS[id]}</span>
                            <span className="inline-flex h-4 w-4 items-center justify-center opacity-60 group-hover:opacity-100">
                              {sortBy===id ? (sortDir==='asc' ? <ArrowUp className="h-4 w-4"/> : <ArrowDown className="h-4 w-4"/>) : <ArrowUp className="h-4 w-4 opacity-20"/>}
                            </span>
                          </button>
                        ) : <span className="block truncate" title={LABELS[id]}>{LABELS[id]}</span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.length===0 && (
                  <tr><td colSpan={9} className="text-center text-sm text-slate-600 py-8">No results. <button className="underline" onClick={()=>setSearch('')}>Clear search</button> or choose a different filter.</td></tr>
                )}
                {rows.map(r => (
            <tr key={r.id} className="border-t">
                <td>
                <input
                    type="checkbox"
                    aria-label={`Select ${r.plan}`}
                    checked={!!selected[r.id]}
                    onChange={e =>
                    setSelected(p => ({ ...p, [r.id]: e.target.checked }))
                    }
                />
                </td>
                <td className="text-center">
                <div className="inline-flex items-center justify-center gap-2">
                    <button
                    title="View"
                    className="h-8 w-8 p-0 text-slate-700 hover:bg-slate-100 rounded"
                    onClick={() => setOpenViewRow(r)}
                    >
                    <Eye className="h-4 w-4 m-auto" />
                    </button>
                    <button
                    title="Audit log"
                    className="h-8 w-8 p-0 text-slate-700 hover:bg-slate-100 rounded"
                    onClick={() => setOpenAuditRow(r)}
                    >
                    <History className="h-4 w-4 m-auto" />
                    </button>
                    <button
                    title="Restore"
                    className="h-8 w-8 p-0 rounded bg-green-600 text-white hover:bg-green-700"
                    onClick={() => setOpenRestoreRow(r)}
                    >
                    <Undo2 className="h-4 w-4 m-auto" />
                    </button>
                </div>
                </td>
                <td title={r.plan}>
                <button
                    type="button"
                    onClick={() => alert('Open in edit mode')}
                    className="inline-flex items-center gap-1 text-[#1072BE] font-medium block truncate hover:underline"
                    style={{ maxWidth: '30ch' }}
                >
                    {r.plan}
                </button>
                </td>
                <td className="text-right tabular-nums" title={String(r.servicesCount)}>
                {r.servicesCount}
                </td>
                <td className="truncate" title={r.revenueType}>
                {r.revenueType}
                </td>
                <td className="tabular-nums" title={r.effectiveStart}>
                {r.effectiveStart}
                </td>
                <td className="tabular-nums" title={r.effectiveEnd}>
                {r.effectiveEnd}
                </td>
                <td className="truncate" title={r.archivedBy}>
                {r.archivedBy}
                </td>
                <td className="tabular-nums" title={r.dateArchived}>
                {r.dateArchived}
                </td>
            </tr>
            ))}

              </tbody>
            </table>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
            <div className={"pointer-events-auto relative max-w-[92vw] sm:max-w-md rounded-lg border border-green-300 bg-green-50 shadow-lg px-4 py-3 pr-10 transition-all duration-200 " + (toastPhase==='in'?'opacity-100 translate-y-0':'opacity-0 translate-y-2')}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg" aria-hidden />
              <div className="text-sm font-medium text-green-900">{toast.title}</div>
              {toast.lines && toast.lines.length>0 && <ul className="mt-1 list-disc pl-5 text-xs text-green-900/90">{toast.lines.map((t,i)=>(<li key={i}>{t}</li>))}</ul>}
              <button type="button" aria-label="Close notification" className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-green-100" onClick={()=>{ setToastPhase('out'); window.setTimeout(()=>setToast(null),200) }}>✕</button>
            </div>
          </div>
        )}

        {/* Simple modals */}
        {openViewRow && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setOpenViewRow(null)} />
            <div className="absolute left-0 top-0 h-full w-[70vw] bg-white shadow-xl p-4">
              <div className="text-lg font-semibold mb-2">View plan</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-slate-500">Incentive Plan</div><div>{openViewRow.plan}</div></div>
                <div><div className="text-slate-500">Revenue Type</div><div>{openViewRow.revenueType}</div></div>
                <div><div className="text-slate-500"># of Services</div><div className="tabular-nums text-right">{openViewRow.servicesCount}</div></div>
                <div><div className="text-slate-500">Start / End</div><div>{openViewRow.effectiveStart} – {openViewRow.effectiveEnd}</div></div>
                <div><div className="text-slate-500">Remove Timestamp</div><div>{openViewRow.dateArchived}</div></div>
                <div><div className="text-slate-500">Removed by</div><div>{openViewRow.archivedBy}</div></div>
              </div>
              <div className="mt-4"><button className="border rounded px-3 py-2" onClick={()=>setOpenViewRow(null)}>Close</button></div>
            </div>
          </div>
        )}

        {openAuditRow && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setOpenAuditRow(null)} />
            <div className="absolute left-0 top-0 h-full w-[70vw] bg-white shadow-xl p-4">
              <div className="text-lg font-semibold mb-2">Audit log</div>
              <div className="text-sm text-slate-600">No audit entries yet.</div>
              <div className="mt-4"><button className="border rounded px-3 py-2" onClick={()=>setOpenAuditRow(null)}>Close</button></div>
            </div>
          </div>
        )}

        {openRestoreRow && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setOpenRestoreRow(null)} />
            <div className="absolute left-0 top-0 h-full w-[70vw] bg-white shadow-xl p-4">
              <div className="text-lg font-semibold mb-2">Restore {openRestoreRow.id==='bulk'?'selected plans':'plan'}</div>
              {openRestoreRow.id!=='bulk' && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-slate-500">Incentive Plan</div><div>{openRestoreRow.plan}</div></div>
                  <div><div className="text-slate-500">Revenue Type</div><div>{openRestoreRow.revenueType}</div></div>
                  <div><div className="text-slate-500"># of Services</div><div className="tabular-nums text-right">{openRestoreRow.servicesCount}</div></div>
                  <div><div className="text-slate-500">Start / End</div><div>{openRestoreRow.effectiveStart} – {openRestoreRow.effectiveEnd}</div></div>
                  <div><div className="text-slate-500">Remove Timestamp</div><div>{openRestoreRow.dateArchived}</div></div>
                  <div><div className="text-slate-500">Removed by</div><div>{openRestoreRow.archivedBy}</div></div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button className="border rounded px-3 py-2" onClick={()=>setOpenRestoreRow(null)}>Cancel</button>
                <button className="rounded px-3 py-2 bg-green-600 text-white" onClick={()=>{
                  if(openRestoreRow.id==='bulk'){
                    const ids = Object.keys(selected).filter(id=>selected[id])
                    const idSet = new Set(ids); setPlans(prev=>prev.filter(p=>!idSet.has(p.id))); setSelected({})
                    showToast('Incentive Pay Plans restored.', ['All restored plans now show a PENDING badge in Incentives.'])
                  }else{
                    setPlans(prev=>prev.filter(p=>p.id!==openRestoreRow.id))
                    showToast('Incentive Pay Plan restored.', ['Restored plans now show a PENDING badge in Incentives.'])
                  }
                  setOpenRestoreRow(null)
                }}>Restore as Draft</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
