import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const SUPABASE_URL = 'https://eyvjczgmjmbszqvejctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dmpjemdtam1ic3pxdmVqY3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzQ3NzksImV4cCI6MjEwMTI1MDc3OX0.D64EoqN_bX9Ra1u-LvVvIbEsCCow3yOkqctcLxwMK-M';

const manualStart = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Start', position: [200, 200] },
  output: [{}]
});

const dailySchedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Daily Schedule (08:00)',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 8, triggerAtMinute: 0 }] } },
    position: [200, 400]
  },
  output: [{}]
});

const generateIdeas = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Generate Content Ideas',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const helpers = this.helpers;
const SUPABASE_URL = 'https://eyvjczgmjmbszqvejctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dmpjemdtam1ic3pxdmVqY3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzQ3NzksImV4cCI6MjEwMTI1MDc3OX0.D64EoqN_bX9Ra1u-LvVvIbEsCCow3yOkqctcLxwMK-M';

async function sb(pathAndQuery) {
  return helpers.httpRequest({
    method: 'GET',
    url: SUPABASE_URL + '/rest/v1/' + pathAndQuery,
    json: true,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
  });
}

function slug(text) {
  return String(text || '').replace(/[^a-zA-Z0-9]/g, '');
}

function isRetirement(status) {
  if (!status) return false;
  if (status === 'Finished' || status === 'Lapped') return false;
  if (status.indexOf('+') === 0) return false;
  return true;
}

const recentRaces = await sb('races?status=eq.completed&order=race_date.desc&limit=6&select=race_id,name,round,race_date,country');
const existing = await sb('content_ideas?source=eq.auto&select=race_id');
const coveredIds = new Set(existing.map((e) => e.race_id));
const targetRaces = recentRaces.filter((r) => !coveredIds.has(r.race_id)).slice(0, 3);

const ideas = [];

for (const race of targetRaces) {
  const results = await sb(
    'results?race_id=eq.' + race.race_id +
    '&select=driver_id,constructor_id,grid,position,status,fastest_lap_rank,fastest_lap_time,drivers(given_name,family_name),constructors(name)' +
    '&order=position.asc'
  );

  const standings = await sb(
    'driver_standings?race_id=eq.' + race.race_id +
    '&select=position,points,wins,drivers(given_name,family_name)' +
    '&order=position.asc&limit=5'
  );

  const raceLabel = race.name;
  const raceHashtag = '#' + slug(race.name);
  const finishers = results.filter((r) => r.position !== null && r.position !== undefined);

  const podium = finishers.filter((r) => r.position <= 3).sort((a, b) => a.position - b.position);
  if (podium.length === 3) {
    const medals = ['🥇', '🥈', '🥉'];
    const lines = podium.map((r, i) => medals[i] + ' ' + r.drivers.given_name + ' ' + r.drivers.family_name + ' (' + r.constructors.name + ')');
    ideas.push({
      race_id: race.race_id,
      idea_type: 'podium',
      title: 'Podio - ' + raceLabel,
      caption: '🏁 PODIO ' + raceLabel.toUpperCase() + '!\\n\\n' + lines.join('\\n') + '\\n\\nChe gara! 🔥 Cosa ne pensate di questo podio? 👇',
      hashtags: ['F1', 'FormulaUno', slug(raceHashtag), slug(podium[0].drivers.family_name), 'Podio'],
      stats: { podium: podium.map((r) => ({ position: r.position, driver: r.drivers.given_name + ' ' + r.drivers.family_name, team: r.constructors.name })) },
      status: 'idea',
      source: 'auto',
    });
  }

  const fastestLap = results.find((r) => r.fastest_lap_rank === 1);
  if (fastestLap) {
    ideas.push({
      race_id: race.race_id,
      idea_type: 'fastest_lap',
      title: 'Giro veloce - ' + raceLabel,
      caption: '⏱️ GIRO PIÙ VELOCE - ' + raceLabel.toUpperCase() + '\\n\\n' + fastestLap.drivers.given_name + ' ' + fastestLap.drivers.family_name + ' (' + fastestLap.constructors.name + ') firma il giro più veloce in ' + (fastestLap.fastest_lap_time || '-') + '! 💨\\n\\nUn dettaglio che può fare la differenza per il podio dei "Driver of the Day"!',
      hashtags: ['F1', 'FastestLap', slug(fastestLap.drivers.family_name), slug(raceHashtag)],
      stats: { driver: fastestLap.drivers.given_name + ' ' + fastestLap.drivers.family_name, team: fastestLap.constructors.name, time: fastestLap.fastest_lap_time },
      status: 'idea',
      source: 'auto',
    });
  }

  let bestMover = null;
  let bestDelta = 0;
  for (const r of finishers) {
    if (r.grid === null || r.grid === undefined || r.grid === 0) continue;
    const delta = r.grid - r.position;
    if (delta > bestDelta) {
      bestDelta = delta;
      bestMover = r;
    }
  }
  if (bestMover && bestDelta >= 3) {
    ideas.push({
      race_id: race.race_id,
      idea_type: 'comeback',
      title: 'Rimonta della gara - ' + raceLabel,
      caption: '📈 RIMONTA DELLA GARA\\n\\n' + bestMover.drivers.given_name + ' ' + bestMover.drivers.family_name + ' (' + bestMover.constructors.name + ') parte P' + bestMover.grid + ' e chiude P' + bestMover.position + ': +' + bestDelta + ' posizioni guadagnate! 🚀\\n\\nSecondo voi chi ha fatto la gara migliore? 👇',
      hashtags: ['F1', 'Comeback', slug(bestMover.drivers.family_name), slug(raceHashtag)],
      stats: { driver: bestMover.drivers.given_name + ' ' + bestMover.drivers.family_name, team: bestMover.constructors.name, grid: bestMover.grid, finish: bestMover.position, positionsGained: bestDelta },
      status: 'idea',
      source: 'auto',
    });
  }

  const retirees = results.filter((r) => isRetirement(r.status));
  if (retirees.length > 0) {
    const lines = retirees.map((r) => '• ' + r.drivers.given_name + ' ' + r.drivers.family_name + ' (' + r.constructors.name + '): ' + r.status);
    ideas.push({
      race_id: race.race_id,
      idea_type: 'drama',
      title: 'Colpi di scena - ' + raceLabel,
      caption: '💥 COLPI DI SCENA A ' + raceLabel.toUpperCase() + '\\n\\n' + lines.join('\\n') + '\\n\\nGara ricca di emozioni! 😱 Chi vi ha sorpreso di più?',
      hashtags: ['F1', 'DNF', slug(raceHashtag), 'Drama'],
      stats: { retirees: retirees.map((r) => ({ driver: r.drivers.given_name + ' ' + r.drivers.family_name, team: r.constructors.name, status: r.status })) },
      status: 'idea',
      source: 'auto',
    });
  }

  if (standings.length > 0) {
    const lines = standings.map((s, i) => (i + 1) + '. ' + s.drivers.given_name + ' ' + s.drivers.family_name + ' - ' + s.points + ' pt');
    ideas.push({
      race_id: race.race_id,
      idea_type: 'standings',
      title: 'Classifica piloti dopo ' + raceLabel,
      caption: '📊 CLASSIFICA PILOTI dopo il GP ' + raceLabel + '\\n\\n' + lines.join('\\n') + '\\n\\nLotta apertissima per il titolo! 🏆 Chi vincerà il mondiale secondo voi?',
      hashtags: ['F1', 'Standings', 'Mondiale', slug(raceHashtag)],
      stats: { top5: standings.map((s) => ({ position: s.position, driver: s.drivers.given_name + ' ' + s.drivers.family_name, points: s.points })) },
      status: 'idea',
      source: 'auto',
    });
  }
}

return [{ json: { ideas, targetRaceCount: targetRaces.length } }];
`
    },
    position: [460, 300]
  },
  output: [{ ideas: [], targetRaceCount: 0 }]
});

const insertIdeas = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Insert Content Ideas',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/content_ideas',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Generate Content Ideas').item.json.ideas }}")
    },
    position: [720, 300]
  },
  output: [{ success: true }]
});

export default workflow('f1-content-idea-generator', 'F1 Content Idea Generator')
  .add(manualStart)
  .to(generateIdeas
    .to(insertIdeas))
  .add(dailySchedule)
  .to(generateIdeas);
