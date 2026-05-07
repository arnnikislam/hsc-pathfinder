import jsPDF from 'jspdf'
import { format } from 'date-fns'

export async function exportStudyReport({ profile, todayLogs, allLogs, t }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, margin = 20
  let y = margin

  // ── Helper functions ──────────────────────────────────────────
  const addText = (text, x, yPos, opts = {}) => {
    const { size = 11, bold = false, color = [255,255,255], align = 'left' } = opts
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(String(text), x, yPos, { align })
    return yPos
  }

  const addLine = (yPos, color = [255,255,255], opacity = 0.1) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.3)
    doc.setGState(new doc.GState({ opacity }))
    doc.line(margin, yPos, W - margin, yPos)
    doc.setGState(new doc.GState({ opacity: 1 }))
  }

  const fmtMin = (m) => {
    const h = Math.floor(m / 60), min = m % 60
    return h > 0 ? `${h}h ${min > 0 ? `${min}m` : ''}`.trim() : `${min}m`
  }

  const checkPage = (needed = 20) => {
    if (y + needed > 270) {
      doc.addPage()
      // Dark background for new page
      doc.setFillColor(10, 15, 30)
      doc.rect(0, 0, W, 297, 'F')
      y = margin
    }
  }

  // ── Background ────────────────────────────────────────────────
  doc.setFillColor(10, 15, 30) // surface-900
  doc.rect(0, 0, W, 297, 'F')

  // ── Header gradient bar ───────────────────────────────────────
  doc.setFillColor(14, 165, 233) // brand-500
  doc.rect(0, 0, W, 2, 'F')

  // ── Logo area ─────────────────────────────────────────────────
  doc.setFillColor(14, 60, 100)
  doc.roundedRect(margin, y, W - margin*2, 38, 4, 4, 'F')

  addText('HSC PathFinder', W/2, y + 12, { size: 20, bold: true, color: [14, 165, 233], align: 'center' })
  addText('তোমার লক্ষ্য, তোমার পথ  |  Your Goal, Your Path', W/2, y + 20, { size: 9, color: [150, 200, 230], align: 'center' })
  addText(t('pdf.title'), W/2, y + 30, { size: 12, bold: true, color: [255,255,255], align: 'center' })
  y += 48

  // Generated date
  addText(`${t('pdf.generated')}: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`, margin, y, { size: 8, color: [120, 140, 160] })
  y += 12

  // ── Student Info ──────────────────────────────────────────────
  doc.setFillColor(15, 23, 42) // surface-800
  doc.roundedRect(margin, y, W - margin*2, 42, 3, 3, 'F')
  doc.setDrawColor(14, 165, 233)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, y, W - margin*2, 42, 3, 3, 'S')

  addText(t('pdf.student_info'), margin + 5, y + 9, { size: 10, bold: true, color: [14, 165, 233] })

  const infoLeft = margin + 5, infoRight = W/2 + 5
  addText(`Name:`, infoLeft, y + 18, { size: 9, color: [140,160,180] })
  addText(profile?.name || '—', infoLeft + 25, y + 18, { size: 9, bold: true, color: [255,255,255] })

  addText(`College:`, infoLeft, y + 26, { size: 9, color: [140,160,180] })
  addText(profile?.college || '—', infoLeft + 25, y + 26, { size: 9, bold: true, color: [255,255,255] })

  addText(`Group:`, infoRight, y + 18, { size: 9, color: [140,160,180] })
  const gLabel = { science: 'Science 🔬', arts: 'Arts 🎨', commerce: 'Commerce 💼' }
  addText(gLabel[profile?.group] || '—', infoRight + 22, y + 18, { size: 9, bold: true, color: [255,255,255] })

  addText(`Daily Goal:`, infoRight, y + 26, { size: 9, color: [140,160,180] })
  addText(`${profile?.dailyGoal || 8} hours`, infoRight + 30, y + 26, { size: 9, bold: true, color: [249, 115, 22] })

  addText(`Email:`, infoLeft, y + 34, { size: 9, color: [140,160,180] })
  addText(profile?.email || '—', infoLeft + 25, y + 34, { size: 9, color: [180,200,220] })
  y += 52

  // ── Summary stats ─────────────────────────────────────────────
  addText(t('pdf.study_summary'), margin, y, { size: 11, bold: true, color: [255,255,255] })
  y += 8

  const totalMins = allLogs.reduce((s, l) => s + l.minutes, 0)
  const daysStudied = new Set(allLogs.map(l => l.date)).size
  const avgDaily = daysStudied > 0 ? Math.round(totalMins / daysStudied) : 0

  const stats = [
    { label: 'Total Study Time', value: fmtMin(totalMins), color: [14, 165, 233] },
    { label: 'Days Studied', value: `${daysStudied} days`, color: [34, 197, 94] },
    { label: 'Daily Average', value: fmtMin(avgDaily), color: [249, 115, 22] },
    { label: 'Current Streak', value: `${profile?.streak || 0} days 🔥`, color: [251, 146, 60] },
  ]

  const statW = (W - margin*2 - 9) / 4
  stats.forEach((s, i) => {
    const sx = margin + i * (statW + 3)
    doc.setFillColor(20, 30, 50)
    doc.roundedRect(sx, y, statW, 22, 2, 2, 'F')
    doc.setFillColor(...s.color)
    doc.roundedRect(sx, y, statW, 2, 1, 1, 'F')
    addText(s.value, sx + statW/2, y + 12, { size: 10, bold: true, color: s.color, align: 'center' })
    addText(s.label, sx + statW/2, y + 19, { size: 7, color: [120,140,160], align: 'center' })
  })
  y += 32

  // ── Daily log table ───────────────────────────────────────────
  checkPage(30)
  addText(t('pdf.daily_log'), margin, y, { size: 11, bold: true, color: [255,255,255] })
  y += 8

  // Table header
  doc.setFillColor(14, 165, 233, 0.3)
  doc.setFillColor(14, 60, 100)
  doc.rect(margin, y, W - margin*2, 8, 'F')
  addText(t('pdf.date'), margin + 5, y + 5.5, { size: 8, bold: true, color: [14, 165, 233] })
  addText(t('pdf.duration'), W/2, y + 5.5, { size: 8, bold: true, color: [14, 165, 233], align: 'center' })
  addText('Sessions', W - margin - 5, y + 5.5, { size: 8, bold: true, color: [14, 165, 233], align: 'right' })
  y += 10

  // Group logs by date
  const byDate = {}
  allLogs.forEach(l => {
    if (!byDate[l.date]) byDate[l.date] = []
    byDate[l.date].push(l)
  })

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 30) // last 30 days

  sortedDates.forEach((date, idx) => {
    checkPage(10)
    const logs = byDate[date]
    const dayTotal = logs.reduce((s, l) => s + l.minutes, 0)
    const goalMins = (profile?.dailyGoal || 8) * 60
    const met = dayTotal >= goalMins

    // Alternate rows
    if (idx % 2 === 0) {
      doc.setFillColor(15, 23, 42)
      doc.rect(margin, y - 1, W - margin*2, 8, 'F')
    }

    // Goal met indicator
    if (met) {
      doc.setFillColor(34, 197, 94)
      doc.rect(margin, y - 1, 1.5, 8, 'F')
    }

    addText(format(new Date(date), 'dd MMM yyyy'), margin + 5, y + 4.5, { size: 8, color: [200,215,230] })
    addText(fmtMin(dayTotal), W/2, y + 4.5, { size: 8, bold: true, color: met ? [34,197,94] : [249,115,22], align: 'center' })
    addText(`${logs.length} session${logs.length > 1 ? 's' : ''}`, W - margin - 5, y + 4.5, { size: 8, color: [120,140,160], align: 'right' })
    y += 8
  })

  if (sortedDates.length === 0) {
    addText('No study logs found.', W/2, y + 6, { size: 9, color: [100,120,140], align: 'center' })
    y += 14
  }

  // ── Footer ────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(14, 165, 233)
    doc.rect(0, 293, W, 4, 'F')
    addText(t('pdf.footer'), W/2, 291, { size: 7, color: [100,130,160], align: 'center' })
    addText(`Page ${i} of ${totalPages}`, W - margin, 291, { size: 7, color: [100,130,160], align: 'right' })
  }

  const fileName = `HSC-PathFinder-Report-${profile?.name?.replace(/\s/g, '_')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}
