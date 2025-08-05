const express     = require('express');
const cors        = require('cors');
const createHafas = require('oebb-hafas');

const app   = express();
const port  = 4000;
const hafas = createHafas('bus-monitor');

app.use(cors());

// ?stationId=1350165
app.get('/api/departures', async (req, res) => {
    try {
        const { stationId } = req.query;
        if (!stationId) return res.status(400).json({ error: 'missing stationId' });
        const deps = await hafas.departures(stationId, {
            duration: 120,    // 2 h Zeitfenster, damit wir sicher 10 Busse finden
            results: 30
        });
        res.json(deps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () =>
    console.log(`Proxy läuft auf http://localhost:${port}`)
);
