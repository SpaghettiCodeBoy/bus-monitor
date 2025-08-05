const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const createHafas = require('oebb-hafas');

const app   = express();
const port  = process.env.PORT || 4000;   // liest ENV, falls gesetzt
const hafas = createHafas('bus-monitor');

app.use(cors());

/* ------------ API -------------------------------------------------- */
app.get('/api/departures', async (req, res) => {
    try {
        const { stationId } = req.query;
        if (!stationId) return res.status(400).json({ error: 'missing stationId' });

        const deps = await hafas.departures(stationId, {
            duration: 120,
            results:  30
        });
        res.json(deps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ------------ React-App ausliefern -------------------------------- */
const buildDir = path.join(__dirname, '..', 'build');
app.use(express.static(buildDir));

app.get('*', (_, res) =>
    res.sendFile(path.join(buildDir, 'index.html'))
);

/* ------------ Start ------------------------------------------------ */
app.listen(port, () =>
    console.log(`Bus-Monitor läuft auf http://localhost:${port}`)
);
