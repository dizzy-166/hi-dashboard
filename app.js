/* === SUPABASE === */
const SUPABASE_URL = 'https://ydetmjryjpnrpcmoxvre.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXRtanJ5anBucnBjbW94dnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2Nzk3NTcsImV4cCI6MjA3ODI1NTc1N30.P5aHR5ObmXF5g2Ov6_fWh-5YgYMXRcQs4LNIOgl0jnw'

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let currentUser = null
let currentCompetition = null

const APPS = {
  doubledo: 'https://doubledo.vercel.app',
}

async function openApp(baseUrl) {
  const { data: { session } } = await sb.auth.getSession()
  if (!session) { window.open(baseUrl, '_blank'); return }
  const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=magiclink`
  window.open(`${baseUrl}#${hash}`, '_blank')
}

/* === SPLASH === */
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function runSplash() {
  const splash = document.getElementById('splash')
  const se1 = document.getElementById('se1')
  const se2 = document.getElementById('se2')

  await sleep(500)

  // Expand: hi. → health industry.
  se1.classList.add('open')
  se2.classList.add('open')
  await sleep(750 + 1000) // transition + pause

  // Contract: health industry. → hi.
  se1.classList.remove('open')
  se2.classList.remove('open')
  await sleep(750 + 400) // transition + pause

  // Fade out
  splash.classList.add('fade-out')
  await sleep(600)
  splash.style.display = 'none'
}

/* === INIT === */
async function init() {
  drawSparkline()
  drawArcs(0)

  const [{ data: { session } }] = await Promise.all([
    sb.auth.getSession(),
    runSplash(),
  ])

  if (isMobile()) {
    await initMobile(session?.user ?? null)
  } else if (session) {
    await loadDashboard(session.user)
  } else {
    showLogin()
  }
}

/* === AUTH === */
function showLogin() {
  document.getElementById('loginOverlay').style.display = 'flex'
}

function hideLogin() {
  document.getElementById('loginOverlay').style.display = 'none'
}

let otpEmail = ''

document.getElementById('loginSendBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim()
  const errorEl = document.getElementById('loginError')
  const btn = document.getElementById('loginSendBtn')

  if (!email) { errorEl.textContent = 'Введи email'; return }

  btn.textContent = 'Отправка…'
  btn.disabled = true
  errorEl.textContent = ''

  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })

  if (error) {
    errorEl.textContent = 'Не удалось отправить код. Проверь email.'
    btn.textContent = 'Получить код'
    btn.disabled = false
    return
  }

  otpEmail = email
  document.getElementById('loginStep1').style.display = 'none'
  document.getElementById('loginStep2').style.display = 'block'
  document.getElementById('loginHint').textContent = `Код отправлен на ${email}`
  document.getElementById('loginOtp').focus()
})

document.getElementById('loginEmail').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginSendBtn').click()
})

document.getElementById('loginVerifyBtn').addEventListener('click', async () => {
  const token = document.getElementById('loginOtp').value.trim()
  const errorEl = document.getElementById('loginError')
  const btn = document.getElementById('loginVerifyBtn')

  if (!token || token.length < 6) { errorEl.textContent = 'Введи 6-значный код'; return }

  btn.textContent = 'Проверка…'
  btn.disabled = true
  errorEl.textContent = ''

  const { error } = await sb.auth.verifyOtp({ email: otpEmail, token, type: 'email' })

  if (error) {
    errorEl.textContent = 'Неверный или истёкший код'
    btn.textContent = 'Войти'
    btn.disabled = false
    return
  }

  const { data: { user } } = await sb.auth.getUser()
  hideLogin()
  await loadDashboard(user)
})

document.getElementById('loginOtp').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginVerifyBtn').click()
})

document.getElementById('loginBackBtn').addEventListener('click', () => {
  document.getElementById('loginStep1').style.display = 'block'
  document.getElementById('loginStep2').style.display = 'none'
  document.getElementById('loginError').textContent = ''
  document.getElementById('loginSendBtn').textContent = 'Получить код'
  document.getElementById('loginSendBtn').disabled = false
  document.getElementById('loginOtp').value = ''
})

document.getElementById('navDoubleDo').addEventListener('click', e => {
  e.preventDefault()
  openApp(APPS.doubledo)
})

/* === MOBILE AUTH === */
function isMobile() {
  return window.innerWidth <= 768
}

async function initMobile(user) {
  if (user) {
    showMobileLogged(user)
  } else {
    document.getElementById('mobileAuth').style.display = 'flex'
    document.getElementById('mobileLogged').style.display = 'none'
  }
}

async function showMobileLogged(user) {
  const { data: profile } = await sb.from('users').select('username').eq('id', user.id).single()
  document.getElementById('mobileAuth').style.display = 'none'
  document.getElementById('mobileLogged').style.display = 'flex'
  document.getElementById('mobileUsername').textContent = profile?.username ?? user.email
}

let mobileOtpEmail = ''

document.getElementById('mobileSendBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('mobileEmail').value.trim()
  const errorEl = document.getElementById('mobileError')
  const btn = document.getElementById('mobileSendBtn')
  if (!email) { errorEl.textContent = 'Введи email'; return }

  btn.textContent = 'Отправка…'; btn.disabled = true; errorEl.textContent = ''
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
  if (error) {
    errorEl.textContent = 'Не удалось отправить код'
    btn.textContent = 'Получить код'; btn.disabled = false; return
  }
  mobileOtpEmail = email
  document.getElementById('mobileStep1').style.display = 'none'
  document.getElementById('mobileStep2').style.display = 'flex'
  document.getElementById('mobileHint').textContent = `Код отправлен на ${email}`
  document.getElementById('mobileOtp').focus()
})

document.getElementById('mobileVerifyBtn')?.addEventListener('click', async () => {
  const token = document.getElementById('mobileOtp').value.trim()
  const errorEl = document.getElementById('mobileError')
  const btn = document.getElementById('mobileVerifyBtn')
  if (!token || token.length < 6) { errorEl.textContent = 'Введи 6-значный код'; return }

  btn.textContent = 'Проверка…'; btn.disabled = true; errorEl.textContent = ''
  const { error } = await sb.auth.verifyOtp({ email: mobileOtpEmail, token, type: 'email' })
  if (error) {
    errorEl.textContent = 'Неверный или истёкший код'
    btn.textContent = 'Войти'; btn.disabled = false; return
  }
  const { data: { user } } = await sb.auth.getUser()
  showMobileLogged(user)
})

document.getElementById('mobileBackBtn')?.addEventListener('click', () => {
  document.getElementById('mobileStep1').style.display = 'flex'
  document.getElementById('mobileStep2').style.display = 'none'
  document.getElementById('mobileError').textContent = ''
  document.getElementById('mobileOtp').value = ''
  const btn = document.getElementById('mobileSendBtn')
  btn.textContent = 'Получить код'; btn.disabled = false
})

document.getElementById('mobileLogout')?.addEventListener('click', async () => {
  await sb.auth.signOut()
  document.getElementById('mobileLogged').style.display = 'none'
  document.getElementById('mobileAuth').style.display = 'flex'
  document.getElementById('mobileStep1').style.display = 'flex'
  document.getElementById('mobileStep2').style.display = 'none'
  document.getElementById('mobileEmail').value = ''
  document.getElementById('mobileOtp').value = ''
})

document.getElementById('mobileDoubleDo')?.addEventListener('click', async e => {
  e.preventDefault()
  const { data: { session } } = await sb.auth.getSession()
  if (session) {
    const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=magiclink`
    window.location.href = `${APPS.doubledo}#${hash}`
  } else {
    window.location.href = APPS.doubledo
  }
})

document.querySelector('.btn-open').addEventListener('click', () => openApp(APPS.doubledo))

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut()
  currentUser = null
  currentCompetition = null
  showLogin()
})

/* === DASHBOARD === */
async function loadDashboard(user) {
  currentUser = user

  try {
    const { data: profile } = await sb
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    updateDateTime(profile?.username)

    const { data: competitions, error: compError } = await sb
      .from('competitions')
      .select('*')
      .eq('status', 'active')

    if (compError) throw compError

    if (!competitions || competitions.length === 0) {
      document.getElementById('insightText').textContent = 'Активных соревнований нет.'
      return
    }

    const competition = competitions[0]
    currentCompetition = competition

    const [{ data: habit }, { data: users }, { data: progress }] = await Promise.all([
      sb.from('habits').select('title').eq('id', competition.habit_id).single(),
      sb.from('users').select('id, username').in('id', [competition.user1_id, competition.user2_id]),
      sb.from('habit_progress')
        .select('user_id, completed_date, is_completed')
        .eq('habit_id', competition.habit_id)
        .in('user_id', [competition.user1_id, competition.user2_id])
        .gte('completed_date', competition.start_date)
        .order('completed_date'),
    ])

    competition.habit = habit
    competition.user1 = users?.find(u => u.id === competition.user1_id)
    competition.user2 = users?.find(u => u.id === competition.user2_id)

    const isUser1 = user.id === competition.user1_id
    const me = isUser1 ? competition.user1 : competition.user2
    const rival = isUser1 ? competition.user2 : competition.user1
    const myStreak = isUser1 ? competition.user1_streak : competition.user2_streak
    const rivalStreak = isUser1 ? competition.user2_streak : competition.user1_streak
    const myScore = isUser1 ? competition.user1_score : competition.user2_score
    const rivalId = isUser1 ? competition.user2_id : competition.user1_id

    const startDate = new Date(competition.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayNumber = Math.floor((today - startDate) / 86400000) + 1
    const todayStr = today.toISOString().slice(0, 10)

    const myDoneToday = progress?.some(p => p.user_id === user.id && p.completed_date === todayStr && p.is_completed) ?? false
    const rivalDoneToday = progress?.some(p => p.user_id === rivalId && p.completed_date === todayStr && p.is_completed) ?? false

    render({
      me, rival, myStreak, rivalStreak, myScore,
      competition, dayNumber, progress, todayStr, myDoneToday, rivalDoneToday,
      userId: user.id, rivalId,
    })
  } catch (err) {
    console.error('loadDashboard:', err)
    document.getElementById('insightText').textContent = 'Ошибка загрузки данных. Проверь консоль.'
  }
}

function render({ me, rival, myStreak, rivalStreak, myScore, competition, dayNumber, progress, todayStr, myDoneToday, rivalDoneToday, userId, rivalId }) {
  updateDateTime(me.username)

  // DoubleDo header
  document.getElementById('ddDay').textContent = dayNumber
  document.getElementById('ddHabitName').textContent = competition.habit.title
  document.getElementById('seriesLabel').textContent = `серия ${dayNumber}`
  document.getElementById('heatmapDaysLabel').textContent = `${dayNumber} ДНЕЙ`

  // Avatars & labels
  const myInitials = me.username.slice(0, 2).toUpperCase()
  const rivalInitials = rival.username.slice(0, 2).toUpperCase()
  document.getElementById('myAvatar').textContent = myInitials
  document.getElementById('rivalAvatar').textContent = rivalInitials
  document.getElementById('navAvatar').textContent = myInitials
  document.getElementById('myLabel').textContent = 'ты'
  document.getElementById('rivalLabel').textContent = rival.username
  document.getElementById('rivalHeatmapLabel').textContent = rival.username

  // Streaks
  document.getElementById('myStreak').textContent = myStreak
  document.getElementById('rivalStreak').textContent = rivalStreak

  // Today status
  const myStatusEl = document.getElementById('myStatus')
  myStatusEl.className = 'dd-status ' + (myDoneToday ? 'done' : 'none')
  myStatusEl.textContent = myDoneToday ? '● сегодня сделано' : '○ сегодня — нет'

  const rivalStatusEl = document.getElementById('rivalStatus')
  rivalStatusEl.className = 'dd-status ' + (rivalDoneToday ? 'done' : 'none')
  rivalStatusEl.textContent = rivalDoneToday ? '● сегодня сделано' : '○ сегодня — нет'

  // Mark button state
  const btnMark = document.getElementById('btnMark')
  btnMark.disabled = myDoneToday
  btnMark.textContent = myDoneToday ? '✓ Сегодня отмечено' : '✓ Отметить сегодня'
  btnMark.style.opacity = myDoneToday ? '0.5' : '1'

  // Cheer button
  document.getElementById('btnCheer').textContent = `→ Подбодрить ${rival.username}`

  // HI score
  document.getElementById('scoreNumber').textContent = myScore
  document.getElementById('streamScore').textContent = myScore
  drawArcs(myScore / 100)

  // Bottom card
  document.getElementById('bcSub').textContent = `${competition.habit.title} · vs · ${rival.username} · ${myStreak}–${rivalStreak}`

  // Insight
  const diff = rivalStreak - myStreak
  let insight
  if (myDoneToday && !rivalDoneToday) {
    insight = `Ты уже отметил(а) сегодня, а ${rival.username} — ещё нет. Хорошее начало дня ${dayNumber}!`
  } else if (!myDoneToday && rivalDoneToday) {
    insight = `${rival.username} уже отметил(а) сегодня. Не отставай — серия ${dayNumber} дней ждёт!`
  } else if (diff > 0) {
    insight = `Стрик ${rival.username} на ${diff} ${dayWord(diff)} больше. До его лучшего ещё есть пространство — не сбавляй темп.`
  } else if (diff < 0) {
    insight = `Твой стрик на ${Math.abs(diff)} ${dayWord(Math.abs(diff))} впереди ${rival.username}. Держи преимущество!`
  } else {
    insight = `Стрики равны — ${myStreak} ${dayWord(myStreak)} подряд у обоих. День ${dayNumber} решит многое.`
  }
  document.getElementById('insightText').textContent = insight

  // Footer
  const now = new Date()
  document.getElementById('footerSync').textContent = `SYNC · ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · OK`
  document.getElementById('footerUser').textContent = `+ habits · ${me.username}`

  // Heatmap
  buildHeatmaps(competition, progress, userId, rivalId, dayNumber, todayStr)
}

function updateDateTime(username) {
  const now = new Date()
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
  const months = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЯ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК']
  const d = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  document.getElementById('dateLabel').textContent = d
  if (username) document.getElementById('greetingName').textContent = username

  const h = now.getHours()
  let greeting = 'Доброе утро'
  if (h >= 12 && h < 17) greeting = 'Добрый день'
  else if (h >= 17 && h < 22) greeting = 'Добрый вечер'
  else if (h >= 22 || h < 5) greeting = 'Доброй ночи'
  document.querySelector('.greeting').childNodes[0].textContent = `${greeting}, `
}

function dayWord(n) {
  const abs = Math.abs(n) % 100
  if (abs >= 11 && abs <= 19) return 'дней'
  const last = abs % 10
  if (last === 1) return 'день'
  if (last >= 2 && last <= 4) return 'дня'
  return 'дней'
}

/* === MARK TODAY === */
document.getElementById('btnMark').addEventListener('click', async () => {
  if (!currentUser || !currentCompetition) return
  const btn = document.getElementById('btnMark')
  btn.disabled = true
  btn.textContent = 'Сохранение…'

  const todayStr = new Date().toISOString().slice(0, 10)

  const { error } = await sb.from('habit_progress').upsert({
    habit_id: currentCompetition.habit_id,
    user_id: currentUser.id,
    completed_date: todayStr,
    is_completed: true,
  }, { onConflict: 'habit_id,user_id,completed_date' })

  if (error) {
    btn.textContent = '✗ Ошибка'
    btn.disabled = false
    setTimeout(() => { btn.textContent = '✓ Отметить сегодня'; btn.disabled = false }, 2000)
    return
  }

  await loadDashboard(currentUser)
})

/* === HEATMAP === */
function buildHeatmaps(competition, progress, myId, rivalId, dayNumber, todayStr) {
  const start = new Date(competition.start_date)
  const dates = Array.from({ length: dayNumber }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const myDone = new Set(progress?.filter(p => p.user_id === myId && p.is_completed).map(p => p.completed_date))
  const rivalDone = new Set(progress?.filter(p => p.user_id === rivalId && p.is_completed).map(p => p.completed_date))

  renderHeatmapRow('heatmap-you', dates, myDone, todayStr)
  renderHeatmapRow('heatmap-mitya', dates, rivalDone, todayStr)
}

function renderHeatmapRow(containerId, dates, doneSet, todayStr) {
  const el = document.getElementById(containerId)
  if (!el) return
  el.innerHTML = ''
  dates.forEach(dateStr => {
    const cell = document.createElement('div')
    cell.className = 'heatmap-cell'
    const isToday = dateStr === todayStr
    if (doneSet.has(dateStr)) {
      cell.classList.add('done')
    } else if (isToday) {
      cell.classList.add('today')
    } else {
      cell.classList.add('miss')
    }
    el.appendChild(cell)
  })
}

/* === CANVAS: ARCS === */
function drawArcs(progress) {
  const canvas = document.getElementById('arcsCanvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const arcs = [
    { r: 88, progress, color: '#FF4D1C', width: 10 },
    { r: 72, progress: 0, color: '#E0DBD2', width: 8 },
    { r: 57, progress: 0, color: '#E0DBD2', width: 8 },
    { r: 42, progress: 0, color: '#E0DBD2', width: 8 },
  ]
  const startAngle = -Math.PI / 2
  const gapRad = (8 * Math.PI) / 180
  ctx.clearRect(0, 0, W, H)
  arcs.forEach(({ r, progress: p, color, width }) => {
    const end = startAngle + 2 * Math.PI
    ctx.beginPath()
    ctx.arc(cx, cy, r, startAngle + gapRad / 2, end - gapRad / 2)
    ctx.strokeStyle = '#EDE9E0'
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.stroke()
    if (p > 0) {
      const fillEnd = startAngle + (2 * Math.PI - gapRad) * p
      ctx.beginPath()
      ctx.arc(cx, cy, r, startAngle + gapRad / 2, fillEnd)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  })
}

/* === CANVAS: SPARKLINE === */
function drawSparkline() {
  const canvas = document.getElementById('sparklineCanvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const data = [68, 71, 75, 72, 78, 80, 82]
  const min = Math.min(...data) - 5
  const max = Math.max(...data) + 5
  const range = max - min
  const pad = 4
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }))
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, 'rgba(255,77,28,0.18)')
  grad.addColorStop(1, 'rgba(255,77,28,0)')
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2
    ctx.bezierCurveTo(cp, pts[i - 1].y, cp, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.lineTo(pts[pts.length - 1].x, H)
  ctx.lineTo(pts[0].x, H)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2
    ctx.bezierCurveTo(cp, pts[i - 1].y, cp, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.strokeStyle = '#FF4D1C'
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.stroke()
  const last = pts[pts.length - 1]
  ctx.beginPath()
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#FF4D1C'
  ctx.fill()
}

init()
