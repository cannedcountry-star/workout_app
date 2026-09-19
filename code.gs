// Googleカレンダー同期用 Apps Script
// 1. SECRET を自分で決めた文字列に変える
// 2. CALENDAR_ID は既定のカレンダーでよければ '' のまま
// 3. デプロイ → 新しいデプロイ → 種類:ウェブアプリ
//    実行者: 自分 / アクセスできるユーザー: 全員
// 4. 発行された /exec URL をアプリの「デプロイURL」に、SECRET を「合言葉」に入れる

const SECRET = 'ここを自分で決めた文字列に変更';
const CALENDAR_ID = '';

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.token !== SECRET) return out({ ok: false, error: 'token' });

    const cal = CALENDAR_ID ? CalendarApp.getCalendarById(CALENDAR_ID)
                            : CalendarApp.getDefaultCalendar();
    let created = 0, updated = 0;

    (p.events || []).forEach(function (ev) {
      const s = new Date(ev.start), en = new Date(ev.end);
      const d0 = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const d1 = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
      const tag = '#gymlog:' + ev.key.replace(/-/g, '');

      const hit = cal.getEvents(d0, d1).filter(function (x) {
        return (x.getDescription() || '').indexOf(tag) >= 0;
      })[0];

      if (hit) {
        hit.setTitle(ev.title);
        hit.setDescription(ev.desc);
        hit.setTime(s, en);
        updated++;
      } else {
        cal.createEvent(ev.title, s, en, { description: ev.desc });
        created++;
      }
    });

    return out({ ok: true, created: created, updated: updated });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() {
  return out({ ok: true, msg: 'barload sync endpoint' });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
