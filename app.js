/* === SUPABASE === */
const SUPABASE_URL = 'https://ydetmjryjpnrpcmoxvre.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_uLl0hF0mVvqWHBHUZSMFEA_g-YtL6a9'

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let currentUser = null
let currentCompetition = null
let currentSession = null

// Shorthand for current-language translate
const t = (key, ...args) => HiLang.t(key, ...args)

/** Returns local date as YYYY-MM-DD (avoids UTC-shift bugs with toISOString) */
function localDateStr(d) {
  d = d || new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/** Parses YYYY-MM-DD as local midnight (avoids timezone shift from new Date(str)) */
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const APPS = {
  doubledo: 'https://doubledo.vercel.app',
  read: 'https://read-hi.vercel.app',
}

/** Pre-set nav link hrefs so clicks are instant — no async needed.
 *  Lang is appended to the hash so sub-apps (different origins) can read it. */
function updateNavLinks(session) {
  currentSession = session
  if (!session) return
  const lang = HiLang.getLang()
  const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=magiclink&lang=${lang}`
  document.getElementById('navDoubleDo').href = `${APPS.doubledo}#${hash}`
  document.getElementById('navRead').href      = `${APPS.read}#${hash}`
  // mobile
  const mDD  = document.getElementById('mobileDoubleDo')
  const mRd  = document.getElementById('mobileRead')
  if (mDD) mDD.href = `${APPS.doubledo}#${hash}`
  if (mRd) mRd.href = `${APPS.read}#${hash}`
  // read. open button in widget
  const readOpenBtn = document.getElementById('readOpenBtn')
  if (readOpenBtn) readOpenBtn.href = `${APPS.read}#${hash}`
  // btn-open widget (duo.)
  const btnOpen = document.querySelector('.btn-open')
  if (btnOpen) btnOpen.dataset.url = `${APPS.doubledo}#${hash}`
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

  // Apply language to all static elements
  HiLang.apply()

  const [{ data: { session } }] = await Promise.all([
    sb.auth.getSession(),
    runSplash(),
  ])

  updateNavLinks(session)

  if (!isMobile()) loadReadData(session?.user ?? null)

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

  if (!email) { errorEl.textContent = t('loginErrEmail'); return }

  btn.textContent = t('loginSending')
  btn.disabled = true
  errorEl.textContent = ''

  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })

  if (error) {
    errorEl.textContent = error.message || t('loginErrSend')
    btn.textContent = t('loginSendBtn')
    btn.disabled = false
    return
  }

  otpEmail = email
  document.getElementById('loginStep1').style.display = 'none'
  document.getElementById('loginStep2').style.display = 'block'
  document.getElementById('loginHint').textContent = t('loginHint', email)
  document.getElementById('loginOtp').focus()
})

document.getElementById('loginEmail').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginSendBtn').click()
})

document.getElementById('loginVerifyBtn').addEventListener('click', async () => {
  const token = document.getElementById('loginOtp').value.trim()
  const errorEl = document.getElementById('loginError')
  const btn = document.getElementById('loginVerifyBtn')

  if (!token || token.length < 6) { errorEl.textContent = t('loginErrCode'); return }

  btn.textContent = t('loginVerifying')
  btn.disabled = true
  errorEl.textContent = ''

  const { error } = await sb.auth.verifyOtp({ email: otpEmail, token, type: 'email' })

  if (error) {
    errorEl.textContent = t('loginErrOtp')
    btn.textContent = t('loginVerifyBtn')
    btn.disabled = false
    return
  }

  const { data: { user } } = await sb.auth.getUser()
  const { data: { session: newSession } } = await sb.auth.getSession()
  updateNavLinks(newSession)
  await handlePostAuth(user, {
    onExisting: async () => { hideLogin(); await loadDashboard(user) },
    onNew: () => {
      document.getElementById('loginStep2').style.display = 'none'
      document.getElementById('loginStep3').style.display = 'block'
      document.getElementById('loginUsername').focus()
    },
  })
})

document.getElementById('loginOtp').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginVerifyBtn').click()
})

document.getElementById('loginCreateBtn').addEventListener('click', async () => {
  const username = document.getElementById('loginUsername').value.trim().toLowerCase()
  const errorEl = document.getElementById('loginError')
  const btn = document.getElementById('loginCreateBtn')

  if (!username || username.length < 3) { errorEl.textContent = t('loginErrMin3'); return }
  if (!/^[a-z0-9_]+$/.test(username)) { errorEl.textContent = t('loginErrLatin'); return }

  btn.textContent = t('loginCreating'); btn.disabled = true; errorEl.textContent = ''

  const { data: { user } } = await sb.auth.getUser()
  const { error } = await createProfile(user, username)
  if (error) {
    errorEl.textContent = error.code === '23505' ? t('loginErrTaken') : t('loginErrGeneric')
    btn.textContent = t('loginCreateBtn'); btn.disabled = false; return
  }
  hideLogin()
  await loadDashboard(user)
})

document.getElementById('loginUsername').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginCreateBtn').click()
})

document.getElementById('loginBackBtn').addEventListener('click', () => {
  document.getElementById('loginStep1').style.display = 'block'
  document.getElementById('loginStep2').style.display = 'none'
  document.getElementById('loginError').textContent = ''
  document.getElementById('loginSendBtn').textContent = t('loginSendBtn')
  document.getElementById('loginSendBtn').disabled = false
  document.getElementById('loginOtp').value = ''
})

/* === REGISTRATION HELPERS === */
async function handlePostAuth(user, { onExisting, onNew }) {
  const { data: profile } = await sb.from('users').select('id').eq('id', user.id).maybeSingle()
  if (profile) await onExisting()
  else await onNew()
}

async function createProfile(user, username) {
  return sb.from('users').insert({ id: user.id, email: user.email, username })
}

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
  if (!email) { errorEl.textContent = t('loginErrEmail'); return }

  btn.textContent = t('loginSending'); btn.disabled = true; errorEl.textContent = ''
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) {
    errorEl.textContent = error.message || t('loginErrSend')
    btn.textContent = t('loginSendBtn'); btn.disabled = false; return
  }
  mobileOtpEmail = email
  document.getElementById('mobileStep1').style.display = 'none'
  document.getElementById('mobileStep2').style.display = 'flex'
  document.getElementById('mobileHint').textContent = t('mobileHint', email)
  document.getElementById('mobileOtp').focus()
})

document.getElementById('mobileVerifyBtn')?.addEventListener('click', async () => {
  const token = document.getElementById('mobileOtp').value.trim()
  const errorEl = document.getElementById('mobileError')
  const btn = document.getElementById('mobileVerifyBtn')
  if (!token || token.length < 6) { errorEl.textContent = t('loginErrCode'); return }

  btn.textContent = t('loginVerifying'); btn.disabled = true; errorEl.textContent = ''
  const { error } = await sb.auth.verifyOtp({ email: mobileOtpEmail, token, type: 'email' })
  if (error) {
    errorEl.textContent = t('loginErrOtp')
    btn.textContent = t('loginVerifyBtn'); btn.disabled = false; return
  }
  const { data: { session: mobSession } } = await sb.auth.getSession()
  if (mobSession) updateNavLinks(mobSession)
  const { data: { user } } = await sb.auth.getUser()
  await handlePostAuth(user, {
    onExisting: async () => showMobileLogged(user),
    onNew: () => {
      document.getElementById('mobileStep2').style.display = 'none'
      document.getElementById('mobileStep3').style.display = 'flex'
      document.getElementById('mobileUsernameInput').focus()
    },
  })
})

document.getElementById('mobileCreateBtn')?.addEventListener('click', async () => {
  const username = document.getElementById('mobileUsernameInput').value.trim().toLowerCase()
  const errorEl = document.getElementById('mobileError')
  const btn = document.getElementById('mobileCreateBtn')

  if (!username || username.length < 3) { errorEl.textContent = t('loginErrMin3'); return }
  if (!/^[a-z0-9_]+$/.test(username)) { errorEl.textContent = t('loginErrLatin'); return }

  btn.textContent = t('loginCreating'); btn.disabled = true; errorEl.textContent = ''

  const { data: { user } } = await sb.auth.getUser()
  const { error } = await createProfile(user, username)
  if (error) {
    errorEl.textContent = error.code === '23505' ? t('loginErrTaken') : t('loginErrGeneric')
    btn.textContent = t('loginCreateBtn'); btn.disabled = false; return
  }
  showMobileLogged(user)
})

document.getElementById('mobileBackBtn')?.addEventListener('click', () => {
  document.getElementById('mobileStep1').style.display = 'flex'
  document.getElementById('mobileStep2').style.display = 'none'
  document.getElementById('mobileError').textContent = ''
  document.getElementById('mobileOtp').value = ''
  const btn = document.getElementById('mobileSendBtn')
  btn.textContent = t('loginSendBtn'); btn.disabled = false
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

document.querySelector('.btn-open').addEventListener('click', () => {
  const url = document.querySelector('.btn-open').dataset.url || APPS.doubledo
  window.location.href = url
})

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut()
  currentUser = null
  currentCompetition = null
  showLogin()
})

/* === LANG TOGGLE === */
document.getElementById('langToggle').addEventListener('click', () => {
  const next = HiLang.getLang() === 'ru' ? 'en' : 'ru'
  HiLang.setLang(next)
  // Rebuild nav links so sub-apps get the new lang on next click
  if (currentSession) updateNavLinks(currentSession)
  // Re-render the dashboard with new language if loaded
  if (currentUser && currentCompetition) {
    loadDashboard(currentUser)
  }
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
      document.getElementById('insightText').textContent = t('insightNoComp')
      return
    }

    const competition = competitions[0]
    currentCompetition = competition

    const today = new Date()
    const todayStr = localDateStr(today)

    const [{ data: habit }, { data: users }, { data: members }] = await Promise.all([
      sb.from('habits').select('title').eq('id', competition.habit_id).single(),
      sb.from('users').select('id, username').in('id', [competition.user1_id, competition.user2_id]),
      // Each participant owns their own habit copy — need their individual habit_id
      sb.from('habit_members')
        .select('user_id, habit_id')
        .eq('competition_id', competition.id)
        .eq('status', 'accepted'),
    ])

    // Map user_id → their personal habit_id; fall back to competition.habit_id if missing
    const habitIdFor = Object.fromEntries((members || []).map(m => [m.user_id, m.habit_id]))
    const u1HabitId = habitIdFor[competition.user1_id] || competition.habit_id
    const u2HabitId = habitIdFor[competition.user2_id] || competition.habit_id

    // Fetch progress for each user under their own habit_id
    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      sb.from('habit_progress')
        .select('user_id, completed_date, is_completed')
        .eq('habit_id', u1HabitId).eq('user_id', competition.user1_id)
        .gte('completed_date', competition.start_date).lte('completed_date', todayStr),
      sb.from('habit_progress')
        .select('user_id, completed_date, is_completed')
        .eq('habit_id', u2HabitId).eq('user_id', competition.user2_id)
        .gte('completed_date', competition.start_date).lte('completed_date', todayStr),
    ])
    const progress = [...(p1 || []), ...(p2 || [])]

    if (!habit) throw new Error('Habit not found for competition ' + competition.id)
    competition.habit = habit
    competition.user1 = users?.find(u => u.id === competition.user1_id)
    competition.user2 = users?.find(u => u.id === competition.user2_id)

    const isUser1 = user.id === competition.user1_id
    const me = isUser1 ? competition.user1 : competition.user2
    const rival = isUser1 ? competition.user2 : competition.user1
    if (!me || !rival) throw new Error('Participant data missing for competition ' + competition.id)
    const myStreak = (isUser1 ? competition.user1_streak : competition.user2_streak) ?? 0
    const rivalStreak = (isUser1 ? competition.user2_streak : competition.user1_streak) ?? 0
    const myScore = (isUser1 ? competition.user1_score : competition.user2_score) ?? 0
    const rivalId = isUser1 ? competition.user2_id : competition.user1_id

    const startDate = parseLocalDate(competition.start_date)
    const dayNumber = Math.floor((parseLocalDate(todayStr) - startDate) / 86400000) + 1

    const myDoneToday = progress?.some(p => p.user_id === user.id && p.completed_date === todayStr && p.is_completed) ?? false
    const rivalDoneToday = progress?.some(p => p.user_id === rivalId && p.completed_date === todayStr && p.is_completed) ?? false

    render({
      me, rival, myStreak, rivalStreak, myScore,
      competition, dayNumber, progress, todayStr, myDoneToday, rivalDoneToday,
      userId: user.id, rivalId,
    })
  } catch (err) {
    console.error('loadDashboard:', err)
    document.getElementById('insightText').textContent = t('insightError')
  }
}

function render({ me, rival, myStreak, rivalStreak, myScore, competition, dayNumber, progress, todayStr, myDoneToday, rivalDoneToday, userId, rivalId }) {
  updateDateTime(me.username)

  // duo. header
  document.getElementById('ddDay').textContent = dayNumber
  document.getElementById('ddHabitName').textContent = competition.habit.title
  document.getElementById('seriesLabel').textContent = t('series', dayNumber)
  document.getElementById('heatmapDaysLabel').textContent = t('daysLabel', dayNumber)

  // Avatars & labels
  const myInitials = me.username.slice(0, 2).toUpperCase()
  const rivalInitials = rival.username.slice(0, 2).toUpperCase()
  document.getElementById('myAvatar').textContent = myInitials
  document.getElementById('rivalAvatar').textContent = rivalInitials
  document.getElementById('navAvatar').textContent = myInitials
  document.getElementById('myLabel').textContent = t('youLabel')
  document.getElementById('rivalLabel').textContent = rival.username
  document.getElementById('rivalHeatmapLabel').textContent = rival.username

  // Streaks
  document.getElementById('myStreak').textContent = myStreak
  document.getElementById('rivalStreak').textContent = rivalStreak

  // Today status
  const myStatusEl = document.getElementById('myStatus')
  myStatusEl.className = 'dd-status ' + (myDoneToday ? 'done' : 'none')
  myStatusEl.textContent = myDoneToday ? t('statusDone') : t('statusNone')

  const rivalStatusEl = document.getElementById('rivalStatus')
  rivalStatusEl.className = 'dd-status ' + (rivalDoneToday ? 'done' : 'none')
  rivalStatusEl.textContent = rivalDoneToday ? t('statusDone') : t('statusNone')

  // HI score
  document.getElementById('scoreNumber').textContent = myScore
  document.getElementById('streamScore').textContent = myScore
  drawArcs(myScore / 100)

  // Bottom card
  document.getElementById('bcSub').textContent = `${competition.habit.title} · vs · ${rival.username} · ${myStreak}–${rivalStreak}`

  // Heatmap labels
  document.getElementById('heatmapYouLabel').textContent = t('heatmapYou')

  // Insight
  const diff = rivalStreak - myStreak
  const dw = t('dayWord', Math.abs(diff))
  let insight
  if (myDoneToday && !rivalDoneToday) {
    insight = t('insightMeDone', rival.username, dayNumber)
  } else if (!myDoneToday && rivalDoneToday) {
    insight = t('insightRivalDone', rival.username, dayNumber)
  } else if (diff > 0) {
    insight = t('insightRivalAhead', rival.username, Math.abs(diff), dw)
  } else if (diff < 0) {
    insight = t('insightMeAhead', rival.username, Math.abs(diff), t('dayWord', Math.abs(diff)))
  } else {
    insight = t('insightTied', myStreak, t('dayWord', myStreak))
  }
  document.getElementById('insightText').textContent = insight

  // Footer
  const now = new Date()
  document.getElementById('footerSync').textContent = `SYNC · ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · OK`
  document.getElementById('footerUser').textContent = t('footerUser', me.username)

  // Heatmap
  buildHeatmaps(competition, progress, userId, rivalId, dayNumber, todayStr)
}

function updateDateTime(username) {
  const now = new Date()
  const days   = t('days')
  const months = t('months')
  const d = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  document.getElementById('dateLabel').textContent = d
  if (username) document.getElementById('greetingName').textContent = username

  const h = now.getHours()
  let greeting = t('goodMorning')
  if (h >= 12 && h < 17) greeting = t('goodDay')
  else if (h >= 17 && h < 22) greeting = t('goodEvening')
  else if (h >= 22 || h < 5) greeting = t('goodNight')
  document.querySelector('.greeting').childNodes[0].textContent = `${greeting}, `
}

/* === HEATMAP === */
function buildHeatmaps(competition, progress, myId, rivalId, dayNumber, todayStr) {
  const start = parseLocalDate(competition.start_date)
  const dates = Array.from({ length: dayNumber }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return localDateStr(d)
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

/* === READ. DATA === */
async function loadReadData(user) {
  if (!user) return
  try {
    const [{ data: statsRows }, { data: readingBooks }] = await Promise.all([
      sb.rpc('get_my_stats'),
      sb.from('user_books')
        .select('current_page, books(title, author, cover_id, cover_url, pages)')
        .eq('user_id', user.id)
        .eq('shelf', 'reading')
        .order('updated_at', { ascending: false })
        .limit(1),
    ])

    const stats   = statsRows?.[0]
    const reading = readingBooks?.[0]

    const finished = stats?.books_finished ?? 0
    const pages    = stats?.pages_read    ?? 0
    const reviews  = stats?.reviews_written ?? 0

    document.getElementById('readStatFinished').textContent = finished
    document.getElementById('readStatPages').textContent    = formatNum(pages)
    document.getElementById('readStatReviews').textContent  = reviews

    // Reading stream score: books finished × 5, cap 100
    document.getElementById('streamReadScore').textContent = Math.min(finished * 5, 100)

    // Bottom card sub-line
    const bcSub = document.getElementById('bcReadSub')
    if (bcSub) bcSub.textContent = t('readCardSub', finished, reviews)

    // Currently reading book
    const nowWrap = document.getElementById('readNowWrap')
    const emptyEl = document.getElementById('readEmpty')

    if (reading) {
      const b   = reading.books
      const pct = b.pages ? Math.round((reading.current_page / b.pages) * 100) : 0
      const coverUrl = b.cover_id
        ? `https://covers.openlibrary.org/b/id/${b.cover_id}-S.jpg`
        : (b.cover_url ?? '')

      document.getElementById('readNowTitle').textContent  = b.title  ?? ''
      document.getElementById('readNowAuthor').textContent = b.author ?? ''
      document.getElementById('readNowFill').style.width   = pct + '%'
      document.getElementById('readNowPct').textContent    = pct + '%'
      document.getElementById('readNowPages').textContent  = t('readPageLabel', reading.current_page ?? 0, b.pages ?? '?')

      const img = document.getElementById('readNowCover')
      if (coverUrl) { img.src = coverUrl; img.style.display = 'block' }

      nowWrap.style.display = 'flex'
      emptyEl.style.display = 'none'
    } else {
      nowWrap.style.display = 'none'
      emptyEl.style.display = 'flex'
    }
  } catch (err) {
    console.error('loadReadData:', err)
  }
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

init()
