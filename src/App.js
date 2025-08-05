import { useEffect, useState } from 'react';
import './App.css';

const STOPS = [
    { id: '1350165', name: 'Justizgebäude' },
    { id: '591194',  name: 'UKH' }
];

/* ----------- Mapping: sichtbarer Steig-Name ---------- */
const PLATFORM_MAP = {
    '1350165': {                // Justizgebäude
        A: 'Künstlerhaus',
        B: 'Künstlerhaus',
        C: 'Justizgebäude',
        D: 'Justizgebäude',
        E: 'Rudolfsplatz',
        F: 'Unipark',
        G: 'Unipark'
    },
    '591194': {                 // UKH
        A: 'UKH A',
        B: 'UKH B',
        C: 'UKH C',
        D: 'UKH D',
    }
};

/* ----------- Mapping: Gehzeit in Minuten pro Steig ---- */
const WALK_MIN = {
    '1350165': { A: 5, B: 5, C: 7, D: 7, E: 6, F: 7, G: 7 },
    '591194':  { A: 10, B: 10 }          // UKH
};

export default function App() {
    const [rows, setRows] = useState([]);

    // Lade & mische Abfahrten
    // Lade & mische Abfahrten
    const fetchAll = async () => {
        const perStopRows = await Promise.all(
            STOPS.map(async (s) => {
                const res  = await fetch(`/api/departures?stationId=${s.id}`);
                const rows = (await res.json())
                    .filter((d) => d.line?.mode === 'bus')
                    .slice(0, 15)
                    .map((d) => {
                        const rawPlatform = (d.platform || d.stop?.platform || '—').trim();
                        const key         = rawPlatform.charAt(0).toUpperCase();
                        const mappedName  = PLATFORM_MAP[s.id]?.[key] || rawPlatform;
                        const walkMin     = WALK_MIN[s.id]?.[key] ?? 5;
                        const cleanLine = d.line.name.replace(/^(O[-\s]?Bus|Bus)\s*/i, '').trim();
                        const cleanDir  = d.direction
                                .replace(/salzburg|europark/gi, '') // Wörter entfernen
                                .replace(/\s{2,}/g, ' ')            // doppelte Leerzeichen
                                .trim()
                            || d.direction;                     // Fallback, falls alles weg

                        const depTime     = new Date(d.when);
                        const leaveInMin  = Math.round((depTime - Date.now()) / 60000) - walkMin;

                        return {
                            time:      depTime,
                            line:      cleanLine,
                            direction: cleanDir,
                            stopName:  s.name,
                            platform:  mappedName,
                            delayMin:  Math.round((d.delay ?? 0) / 60),
                            leaveIn:   leaveInMin                     // ← wichtig fürs Filtern
                        };
                    });
                return rows;
            })
        );

        // ▸ nur Einträge behalten, bei denen leaveIn ≥ –5
        const visible = perStopRows
            .flat()
            .filter((r) => r.leaveIn >= -3)
            .sort((a, b) => a.time - b.time);

        setRows(visible);
    };



    useEffect(() => {
        fetchAll();
        const t = setInterval(fetchAll, 30_000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="screen">
            <table className="board">
                <thead>
                <tr>
                    <th>Zeit</th>
                    <th>Linie</th>
                    <th>Richtung</th>
                    <th>Haltestelle</th>
                    <th><img src="/img/time.png" alt="Verspätung" className="hdr-icon" /></th>
                    <th><img src="/img/los.png"        alt="Los in"       className="hdr-icon" /></th>
                </tr>
                </thead>

                <tbody>
                {rows.map((r, idx) => (
                    <tr key={idx}>
                        <td>{r.time.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="line">{r.line}</td>
                        <td className="dir">{r.direction}</td>

                        <td>{r.platform}</td>
                        <td className={r.delayMin > 0 ? 'late' : r.delayMin < 0 ? 'early' : 'ontime'}>
                            <center>
                            {r.delayMin > 0
                                ? `+${r.delayMin}`
                                : r.delayMin < 0
                                    ? `${r.delayMin}`
                                    : '🟢'}
                            </center>
                        </td>
                        <td className={r.leaveIn < 0 ? 'late' : undefined}>
                            <center>
                            {r.leaveIn > 0 ? `${r.leaveIn}` : `${r.leaveIn}`}
                            </center>
                        </td>
                    </tr>
                ))}

                {!rows.length && (
                    <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                            Lade Daten …
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
