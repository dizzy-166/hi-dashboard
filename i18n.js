/* ── hi. ecosystem i18n ─────────────────────────────────────────
   Key: localStorage 'hi_lang'  Values: 'ru' | 'en'  Default: 'ru'
   Storage events propagate the change to React sub-apps.
───────────────────────────────────────────────────────────────── */

;(function () {
  const S = {
    ru: {
      // Nav
      navOverview: 'Обзор',

      // DateTime
      days:   ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
      months: ['ЯНВ','ФЕВ','МАР','АПР','МАЯ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'],
      goodMorning: 'Доброе утро',
      goodDay:     'Добрый день',
      goodEvening: 'Добрый вечер',
      goodNight:   'Доброй ночи',

      // Insight / loading
      insightLabel:   'INSIGHT · СЕГОДНЯ',
      insightLoading: 'Загрузка данных…',
      insightError:   'Ошибка загрузки данных. Проверь консоль.',
      insightNoComp:  'Активных соревнований нет.',

      // Dashboard dynamic
      youLabel:       'ты',
      streakLabel:    'дня подряд',
      heatmapLegend:  'РАНЬШЕ — СЕГОДНЯ',
      heatmapYou:     'ты',
      statusDone:     '● сегодня сделано',
      statusNone:     '○ сегодня — нет',
      btnMark:        '✓ Отметить сегодня',
      btnMarkDone:    '✓ Сегодня отмечено',
      btnMarkSaving:  'Сохранение…',
      btnMarkError:   '✗ Ошибка',
      ddOpenBtn:      'открыть →',
      ddLoading:      'Загрузка…',

      // Parameterised
      series:    n  => `серия ${n}`,
      daysLabel: n  => `${n} ДНЕЙ`,
      ddTag:     n  => `DUO. · СОРЕВНОВАНИЕ · ДЕНЬ `,
      ddTagComp: 'СОРЕВНОВАНИЕ',
      ddTagDay:  'ДЕНЬ',
      btnCheer:  r  => `→ Подбодрить ${r}`,
      footerUser: u => `+ habits · ${u}`,
      loginHint:  e => `Код отправлен на ${e}`,
      mobileHint: e => `Код отправлен на ${e}`,

      // Insight sentences
      insightMeDone:     (r, d) => `Ты уже отметил(а) сегодня, а ${r} — ещё нет. Хорошее начало дня ${d}!`,
      insightRivalDone:  (r, d) => `${r} уже отметил(а) сегодня. Не отставай — серия ${d} дней ждёт!`,
      insightRivalAhead: (r, diff, dw) => `Стрик ${r} на ${diff} ${dw} больше. До его лучшего ещё есть пространство — не сбавляй темп.`,
      insightMeAhead:    (r, diff, dw) => `Твой стрик на ${diff} ${dw} впереди ${r}. Держи преимущество!`,
      insightTied:       (s, dw)       => `Стрики равны — ${s} ${dw} подряд у обоих. День решит многое.`,

      dayWord: n => {
        const abs = Math.abs(n) % 100
        if (abs >= 11 && abs <= 19) return 'дней'
        const last = abs % 10
        if (last === 1) return 'день'
        if (last >= 2 && last <= 4) return 'дня'
        return 'дней'
      },

      // Login
      loginSubtitle:   'health industry · экосистема',
      loginSendBtn:    'Получить код',
      loginSending:    'Отправка…',
      loginVerifyBtn:  'Войти',
      loginVerifying:  'Проверка…',
      loginBackBtn:    '← другой email',
      loginCreateBtn:  'Создать аккаунт',
      loginCreating:   'Создание…',
      loginStep3Hint:  'Последний шаг — выбери имя пользователя',
      loginErrEmail:   'Введи email',
      loginErrCode:    'Введи 6-значный код',
      loginErrMin3:    'Минимум 3 символа',
      loginErrLatin:   'Только латиница, цифры и _',
      loginErrTaken:   'Имя занято, выбери другое',
      loginErrGeneric: 'Ошибка, попробуй снова',
      loginErrOtp:     'Неверный или истёкший код',
      loginErrSend:    'Не удалось отправить код',

      // Mobile screen
      mobileTitle:   'Войди, чтобы\nоткрыть приложения',
      mobileSub:     'Твои приложения:',
      mobileLogout:  'выйти',
      mobilePcNote:  'Дашборд доступен только на компьютере',
      ddAppDesc:     'соревнование · привычки',
      readAppDesc:   'книги · отзывы · дуэты',
      auroraSub:     'сон · скоро',
      focusSub:      'концентрация · скоро',
      agendaSub:     'планер · скоро',
      noteSub:       'журнал · скоро',

      // Streams
      streamsStatus: '2 активны · 2 ждут\nзапуска',
      streamSoon:    'скоро',
      langBtnLabel:  'EN',

      // read. widget
      readTagNow:        'СЕЙЧАС',
      readLoading:       'Загрузка…',
      readNoBook:        'Сейчас ничего не читаешь',
      readLabelFinished: 'прочитано',
      readLabelPages:    'страниц',
      readLabelReviews:  'отзывов',
      readPageLabel:     (cur, tot) => `стр. ${cur} / ${tot}`,
      readCardSub:       (fin, rev) => `${fin} кн. · ${rev} отзывов`,
    },

    en: {
      // Nav
      navOverview: 'Overview',

      // DateTime
      days:   ['SUN','MON','TUE','WED','THU','FRI','SAT'],
      months: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
      goodMorning: 'Good morning',
      goodDay:     'Good afternoon',
      goodEvening: 'Good evening',
      goodNight:   'Good night',

      // Insight / loading
      insightLabel:   'INSIGHT · TODAY',
      insightLoading: 'Loading data…',
      insightError:   'Failed to load data. Check console.',
      insightNoComp:  'No active competitions.',

      // Dashboard dynamic
      youLabel:       'you',
      streakLabel:    'days in a row',
      heatmapLegend:  'PAST — TODAY',
      heatmapYou:     'you',
      statusDone:     '● done today',
      statusNone:     '○ today — none',
      btnMark:        '✓ Mark today',
      btnMarkDone:    '✓ Marked today',
      btnMarkSaving:  'Saving…',
      btnMarkError:   '✗ Error',
      ddOpenBtn:      'open →',
      ddLoading:      'Loading…',

      // Parameterised
      series:    n  => `series ${n}`,
      daysLabel: n  => `${n} DAYS`,
      ddTag:     n  => `DUO. · COMPETITION · DAY `,
      ddTagComp: 'COMPETITION',
      ddTagDay:  'DAY',
      btnCheer:  r  => `→ Cheer on ${r}`,
      footerUser: u => `+ habits · ${u}`,
      loginHint:  e => `Code sent to ${e}`,
      mobileHint: e => `Code sent to ${e}`,

      // Insight sentences
      insightMeDone:     (r, d) => `You already marked today, ${r} hasn't yet. Great start to day ${d}!`,
      insightRivalDone:  (r, d) => `${r} already marked today. Don't fall behind — day ${d} streak awaits!`,
      insightRivalAhead: (r, diff, dw) => `${r}'s streak is ${diff} ${dw} ahead. Keep going — don't slow down.`,
      insightMeAhead:    (r, diff, dw) => `Your streak is ${diff} ${dw} ahead of ${r}. Hold the lead!`,
      insightTied:       (s, dw)       => `Streaks tied — ${s} ${dw} in a row for both. Today decides.`,

      dayWord: n => n === 1 ? 'day' : 'days',

      // Login
      loginSubtitle:   'health industry · ecosystem',
      loginSendBtn:    'Get code',
      loginSending:    'Sending…',
      loginVerifyBtn:  'Sign in',
      loginVerifying:  'Checking…',
      loginBackBtn:    '← other email',
      loginCreateBtn:  'Create account',
      loginCreating:   'Creating…',
      loginStep3Hint:  'Last step — choose a username',
      loginErrEmail:   'Enter your email',
      loginErrCode:    'Enter the 6-digit code',
      loginErrMin3:    'At least 3 characters',
      loginErrLatin:   'Letters, digits and _ only',
      loginErrTaken:   'Name taken, choose another',
      loginErrGeneric: 'Error, please try again',
      loginErrOtp:     'Invalid or expired code',
      loginErrSend:    'Failed to send code',

      // Mobile screen
      mobileTitle:   'Sign in to\nopen the apps',
      mobileSub:     'Your apps:',
      mobileLogout:  'sign out',
      mobilePcNote:  'Dashboard is available on desktop only',
      ddAppDesc:     'competition · habits',
      readAppDesc:   'books · reviews · duets',
      auroraSub:     'sleep · coming soon',
      focusSub:      'focus · coming soon',
      agendaSub:     'planner · coming soon',
      noteSub:       'journal · coming soon',

      // Streams
      streamsStatus: '2 active · 2 waiting\nto launch',
      streamSoon:    'soon',
      langBtnLabel:  'RU',

      // read. widget
      readTagNow:        'NOW',
      readLoading:       'Loading…',
      readNoBook:        'Nothing to read right now',
      readLabelFinished: 'read',
      readLabelPages:    'pages',
      readLabelReviews:  'reviews',
      readPageLabel:     (cur, tot) => `p. ${cur} / ${tot}`,
      readCardSub:       (fin, rev) => `${fin} books · ${rev} reviews`,
    },
  }

  function getLang() {
    return localStorage.getItem('hi_lang') || 'ru'
  }

  function setLang(lang) {
    localStorage.setItem('hi_lang', lang)
    // Notify React sub-apps open in other tabs
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: 'hi_lang', newValue: lang, oldValue: getLang() }))
    } catch (_) {}
    apply()
  }

  function t(key, ...args) {
    const lang = getLang()
    const entry = S[lang]?.[key] ?? S.ru[key] ?? key
    return typeof entry === 'function' ? entry(...args) : entry
  }

  /** Update all static DOM nodes with data-i18n="key" */
  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n
      const val = t(key)
      el.textContent = val
    })
    // Lang toggle button: show target language
    const btn = document.getElementById('langToggle')
    if (btn) btn.textContent = t('langBtnLabel')
  }

  window.HiLang = { getLang, setLang, t, apply }
})()
