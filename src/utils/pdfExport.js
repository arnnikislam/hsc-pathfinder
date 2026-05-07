import jsPDF from 'jspdf'
import { format } from 'date-fns'

function fmtMin(m) {
  const h = Math.floor(m/60), min = m%60
  if (h>0 && min>0) return `${h}h ${min}m`
  if (h>0) return `${h}h`
  return `${min}m`
}

export async function exportStudyReport({ profile, allLogs, t }) {
  const doc  = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W    = 210
  const M    = 18   // margin
  let y      = M

  // ── helpers ──────────────────────────────────────────────────
  const rgb  = (r,g,b) => { doc.setTextColor(r,g,b) }
  const fill = (r,g,b) => { doc.setFillColor(r,g,b) }
  const rect = (x,yy,w,h,s='F') => doc.rect(x,yy,w,h,s)
  const text = (str, x, yy, opts={}) => {
    const { size=10, bold=false, align='left' } = opts
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(String(str), x, yy, { align })
  }
  const newPage = (needed=20) => {
    if (y + needed > 275) {
      doc.addPage()
      fill(10,15,30); rect(0,0,W,297)
      y = M
    }
  }

  // ── Background ───────────────────────────────────────────────
  fill(10,15,30); rect(0,0,W,297)

  // ── Top gradient bar ─────────────────────────────────────────
  fill(14,165,233); rect(0,0,W,3)

  // ── App header ───────────────────────────────────────────────
  fill(15,30,55); rect(M, y, W-M*2, 36)
  rgb(14,165,233); text('HSC PathFinder', W/2, y+12, { size:20, bold:true, align:'center' })
  rgb(150,200,230); text('তোমার লক্ষ্য, তোমার পথ  |  Your Goal, Your Path', W/2, y+20, { size:9, align:'center' })
  rgb(200,220,240); text('Personal Study Report', W/2, y+29, { size:11, bold:true, align:'center' })
  y += 44

  // Generated date
  rgb(100,130,160); text(`Generated: ${format(new Date(),'dd MMMM yyyy, hh:mm a')}`, M, y, { size:8 })
  y += 10

  // ── Student info box ─────────────────────────────────────────
  fill(15,23,42); rect(M, y, W-M*2, 38)
  doc.setDrawColor(14,165,233); doc.setLineWidth(0.4)
  doc.rect(M, y, W-M*2, 38, 'S')
  rgb(14,165,233); text('Student Information', M+4, y+8, { size:9, bold:true })

  const L1=M+4, L2=W/2+2
  rgb(120,150,180); text('Name:',    L1, y+17, { size:8 }); rgb(220,235,250); text(profile?.name||'—',    L1+18, y+17, { size:8, bold:true })
  rgb(120,150,180); text('College:', L1, y+25, { size:8 }); rgb(220,235,250); text(profile?.college||'—', L1+18, y+25, { size:8 })
  const gMap = { science:'Science 🔬', arts:'Arts 🎨', commerce:'Commerce 💼' }
  rgb(120,150,180); text('Group:',   L2, y+17, { size:8 }); rgb(220,235,250); text(gMap[profile?.group]||'—', L2+16, y+17, { size:8, bold:true })
  rgb(120,150,180); text('Goal:',    L2, y+25, { size:8 }); rgb(249,115,22);  text(`${profile?.dailyGoal||8}h / day`, L2+14, y+25, { size:8, bold:true })
  rgb(120,150,180); text('Email:',   L1, y+33, { size:8 }); rgb(160,185,210); text(profile?.email||'—', L1+18, y+33, { size:8 })
  y += 46

  // ── Summary stats ─────────────────────────────────────────────
  rgb(220,235,250); text('Study Summary', M, y, { size:11, bold:true })
  y += 7

  const totalMins  = allLogs.reduce((s,l)=>s+l.minutes,0)
  const daysSet    = new Set(allLogs.map(l=>l.date).filter(Boolean))
  const daysCount  = daysSet.size
  const avgM       = daysCount>0 ? Math.round(totalMins/daysCount) : 0

  const stats = [
    { label:'Total Study Time', value:fmtMin(totalMins),   color:[14,165,233]  },
    { label:'Days Studied',     value:`${daysCount} days`,  color:[34,197,94]   },
    { label:'Daily Average',    value:fmtMin(avgM),         color:[249,115,22]  },
    { label:'Current Streak',   value:`${profile?.streak||0} days`, color:[251,146,60] },
  ]
  const sw = (W-M*2-9)/4
  stats.forEach((s,i) => {
    const sx = M + i*(sw+3)
    fill(20,30,50); rect(sx, y, sw, 20)
    doc.setFillColor(...s.color); rect(sx, y, sw, 2)
    doc.setTextColor(...s.color); text(s.value, sx+sw/2, y+11, { size:9, bold:true, align:'center' })
    rgb(100,130,160); text(s.label, sx+sw/2, y+17, { size:6.5, align:'center' })
  })
  y += 28

  // ── Daily log table ───────────────────────────────────────────
  newPage(30)
  rgb(220,235,250); text('Daily Study Log', M, y, { size:11, bold:true })
  y += 7

  // Table header
  fill(14,60,100); rect(M, y, W-M*2, 7)
  rgb(14,165,233)
  text('Date',     M+4,    y+5, { size:8, bold:true })
  text('Duration', W/2,    y+5, { size:8, bold:true, align:'center' })
  text('vs Goal',  W-M-4,  y+5, { size:8, bold:true, align:'right' })
  y += 9

  // Group logs by date
  const byDate = {}
  allLogs.forEach(l => { if (!byDate[l.date]) byDate[l.date]=[]; byDate[l.date].push(l) })
  const sortedDates = Object.keys(byDate).sort((a,b)=>b.localeCompare(a)).slice(0,45)

  sortedDates.forEach((date, i) => {
    newPage(9)
    const logs    = byDate[date]
    const dayMins = logs.reduce((s,l)=>s+l.minutes,0)
    const goalM   = (profile?.dailyGoal||8)*60
    const met     = dayMins >= goalM
    const pct     = Math.min(100, Math.round(dayMins/goalM*100))

    if (i%2===0) { fill(15,23,42); rect(M, y-1, W-M*2, 8) }
    if (met) { fill(34,197,94); rect(M, y-1, 1.5, 8) }

    rgb(180,205,225); text(format(new Date(date),'dd MMM yyyy'), M+4, y+4.5, { size:8 })
    doc.setTextColor(...(met ? [34,197,94] : [249,115,22]))
    text(fmtMin(dayMins), W/2, y+4.5, { size:8, bold:true, align:'center' })
    rgb(120,145,170); text(`${pct}%`, W-M-4, y+4.5, { size:7.5, align:'right' })
    y += 8
  })

  if (sortedDates.length===0) {
    rgb(100,120,140); text('No study logs found.', W/2, y+6, { size:9, align:'center' })
    y += 14
  }

  // ── Footer on every page ──────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let i=1; i<=pages; i++) {
    doc.setPage(i)
    fill(14,165,233); rect(0,293,W,4)
    rgb(100,130,160)
    doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.text('Generated by HSC PathFinder • arnnikislam.vercel.app', W/2, 291, { align:'center' })
    doc.text(`Page ${i} of ${pages}`, W-M, 291, { align:'right' })
  }

  const name = (profile?.name||'Student').replace(/\s/g,'_')
  doc.save(`HSC-PathFinder-${name}-${format(new Date(),'yyyy-MM-dd')}.pdf`)
}
