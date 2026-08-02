import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const SUPABASE_URL = 'https://eyvjczgmjmbszqvejctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dmpjemdtam1ic3pxdmVqY3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzQ3NzksImV4cCI6MjEwMTI1MDc3OX0.D64EoqN_bX9Ra1u-LvVvIbEsCCow3yOkqctcLxwMK-M';

const manualStart = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Start', position: [200, 200] },
  output: [{}]
});

const weeklySchedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Weekly Schedule (Mon 06:00)',
    parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 6, triggerAtMinute: 0 }] } },
    position: [200, 400]
  },
  output: [{}]
});

const fetchSeasonSchedule = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Season Schedule',
    parameters: { method: 'GET', url: 'https://api.jolpi.ca/ergast/f1/current.json' },
    position: [460, 300]
  },
  output: [{ MRData: { RaceTable: { season: '2026', Races: [{ round: '1', raceName: 'Sample GP', date: '2026-03-08', time: '14:00:00Z', Circuit: { circuitName: 'Sample Circuit', Location: { country: 'Country', locality: 'City' } } }] } } }]
});

const buildSeasonData = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Season Data',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const helpers = this.helpers;

async function fetchJson(url) {
  return helpers.httpRequest({ method: 'GET', url, json: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TEAM_COLORS = {
  red_bull: '#3671C6',
  ferrari: '#E8002D',
  mercedes: '#27F4D2',
  mclaren: '#FF8000',
  aston_martin: '#229971',
  alpine: '#FF87BC',
  williams: '#64C4FF',
  rb: '#6692FF',
  sauber: '#52E252',
  haas: '#B6BABD',
  audi: '#00302C',
  cadillac: '#8A1538',
};

function teamColor(id) {
  return TEAM_COLORS[id] || '#B0B0B0';
}

const scheduleResp = $input.first().json;
const raceTable = scheduleResp.MRData.RaceTable;
const races = raceTable.Races;
const season = raceTable.season;
const now = new Date();

const racesRows = [];
const teamsMap = new Map();
const driversMap = new Map();
const resultsRows = [];
const qualifyingRows = [];
const driverStandingsRows = [];
const teamStandingsRows = [];

for (const race of races) {
  const round = parseInt(race.round, 10);
  const raceId = season + '-' + round;
  const raceDateTime = new Date(race.date + 'T' + (race.time || '00:00:00Z'));
  const isCompleted = raceDateTime.getTime() < now.getTime();

  racesRows.push({
    race_id: raceId,
    season: parseInt(season, 10),
    round,
    name: race.raceName,
    circuit_name: race.Circuit ? race.Circuit.circuitName : null,
    country: race.Circuit && race.Circuit.Location ? race.Circuit.Location.country : null,
    locality: race.Circuit && race.Circuit.Location ? race.Circuit.Location.locality : null,
    race_date: race.date,
    race_time: race.time ? race.time.replace('Z', '') : null,
    status: isCompleted ? 'completed' : 'upcoming',
  });

  if (!isCompleted) continue;

  try {
    const resultsResp = await fetchJson('https://api.jolpi.ca/ergast/f1/' + season + '/' + round + '/results.json');
    const raceResultsList = resultsResp.MRData.RaceTable.Races[0] ? resultsResp.MRData.RaceTable.Races[0].Results : [];
    for (const r of raceResultsList) {
      const d = r.Driver;
      const c = r.Constructor;
      teamsMap.set(c.constructorId, { constructor_id: c.constructorId, name: c.name, nationality: c.nationality || null, color: teamColor(c.constructorId) });
      driversMap.set(d.driverId, {
        driver_id: d.driverId,
        code: d.code || null,
        permanent_number: d.permanentNumber ? parseInt(d.permanentNumber, 10) : null,
        given_name: d.givenName,
        family_name: d.familyName,
        nationality: d.nationality || null,
        date_of_birth: d.dateOfBirth || null,
        current_constructor_id: c.constructorId,
      });
      resultsRows.push({
        race_id: raceId,
        driver_id: d.driverId,
        constructor_id: c.constructorId,
        grid: r.grid !== undefined ? parseInt(r.grid, 10) : null,
        position: r.position ? parseInt(r.position, 10) : null,
        position_text: r.positionText || null,
        points: r.points !== undefined ? parseFloat(r.points) : 0,
        status: r.status || null,
        laps: r.laps !== undefined ? parseInt(r.laps, 10) : null,
        time_millis: r.Time && r.Time.millis ? parseInt(r.Time.millis, 10) : null,
        fastest_lap_rank: r.FastestLap && r.FastestLap.rank ? parseInt(r.FastestLap.rank, 10) : null,
        fastest_lap_time: r.FastestLap && r.FastestLap.Time ? r.FastestLap.Time.time : null,
        fastest_lap_avg_speed: r.FastestLap && r.FastestLap.AverageSpeed ? parseFloat(r.FastestLap.AverageSpeed.speed) : null,
      });
    }
    await sleep(200);

    const qualResp = await fetchJson('https://api.jolpi.ca/ergast/f1/' + season + '/' + round + '/qualifying.json');
    const qualRace = qualResp.MRData.RaceTable.Races[0];
    if (qualRace && qualRace.QualifyingResults) {
      for (const q of qualRace.QualifyingResults) {
        qualifyingRows.push({
          race_id: raceId,
          driver_id: q.Driver.driverId,
          constructor_id: q.Constructor.constructorId,
          position: q.position ? parseInt(q.position, 10) : null,
          q1: q.Q1 || null,
          q2: q.Q2 || null,
          q3: q.Q3 || null,
        });
      }
    }
    await sleep(200);

    const dsResp = await fetchJson('https://api.jolpi.ca/ergast/f1/' + season + '/' + round + '/driverStandings.json');
    const dsLists = dsResp.MRData.StandingsTable.StandingsLists;
    if (dsLists && dsLists[0]) {
      for (const s of dsLists[0].DriverStandings) {
        driverStandingsRows.push({
          race_id: raceId,
          driver_id: s.Driver.driverId,
          position: s.position ? parseInt(s.position, 10) : null,
          points: s.points !== undefined ? parseFloat(s.points) : 0,
          wins: s.wins !== undefined ? parseInt(s.wins, 10) : 0,
        });
      }
    }
    await sleep(200);

    const csResp = await fetchJson('https://api.jolpi.ca/ergast/f1/' + season + '/' + round + '/constructorStandings.json');
    const csLists = csResp.MRData.StandingsTable.StandingsLists;
    if (csLists && csLists[0]) {
      for (const s of csLists[0].ConstructorStandings) {
        teamStandingsRows.push({
          race_id: raceId,
          constructor_id: s.Constructor.constructorId,
          position: s.position ? parseInt(s.position, 10) : null,
          points: s.points !== undefined ? parseFloat(s.points) : 0,
          wins: s.wins !== undefined ? parseInt(s.wins, 10) : 0,
        });
      }
    }
    await sleep(200);
  } catch (err) {
    continue;
  }
}

return [{
  json: {
    races: racesRows,
    teams: Array.from(teamsMap.values()),
    drivers: Array.from(driversMap.values()),
    results: resultsRows,
    qualifying: qualifyingRows,
    driverStandings: driverStandingsRows,
    teamStandings: teamStandingsRows,
  }
}];
`
    },
    position: [720, 300]
  },
  output: [{ races: [], teams: [], drivers: [], results: [], qualifying: [], driverStandings: [], teamStandings: [] }]
});

const upsertConstructors = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Constructors',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/constructors',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'constructor_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.teams }}")
    },
    position: [980, 300]
  },
  output: [{ success: true }]
});

const upsertDrivers = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Drivers',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/drivers',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'driver_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.drivers }}")
    },
    position: [1200, 300]
  },
  output: [{ success: true }]
});

const upsertRaces = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Races',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/races',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'race_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.races }}")
    },
    position: [1420, 300]
  },
  output: [{ success: true }]
});

const upsertResults = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Results',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/results',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'race_id,driver_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.results }}")
    },
    position: [1640, 300]
  },
  output: [{ success: true }]
});

const upsertQualifying = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Qualifying',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/qualifying_results',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'race_id,driver_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.qualifying }}")
    },
    position: [1860, 300]
  },
  output: [{ success: true }]
});

const upsertDriverStandings = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Driver Standings',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/driver_standings',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'race_id,driver_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.driverStandings }}")
    },
    position: [2080, 300]
  },
  output: [{ success: true }]
});

const upsertConstructorStandings = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Constructor Standings',
    parameters: {
      method: 'POST',
      url: 'https://eyvjczgmjmbszqvejctd.supabase.co/rest/v1/constructor_standings',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'on_conflict', value: 'race_id,constructor_id' }] },
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: SUPABASE_ANON_KEY },
          { name: 'Authorization', value: 'Bearer ' + SUPABASE_ANON_KEY },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=minimal' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ $('Build Season Data').item.json.teamStandings }}")
    },
    position: [2300, 300]
  },
  output: [{ success: true }]
});

export default workflow('f1-data-sync', 'F1 Data Sync')
  .add(manualStart)
  .to(fetchSeasonSchedule
    .to(buildSeasonData
      .to(upsertConstructors
        .to(upsertDrivers
          .to(upsertRaces
            .to(upsertResults
              .to(upsertQualifying
                .to(upsertDriverStandings
                  .to(upsertConstructorStandings)))))))))
  .add(weeklySchedule)
  .to(fetchSeasonSchedule);
