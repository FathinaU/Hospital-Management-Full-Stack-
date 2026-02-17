const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { clinic_id, name } = req.body;
  if (!clinic_id || !name) return res.status(400).json({ error: 'clinic_id and name required' });

  try {
    const result = await pool.query(
      'INSERT INTO consultation_suites (clinic_id, name) VALUES ($1, $2) RETURNING *',
      [clinic_id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consultation_suites');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/clinic/:clinic_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM consultation_suites WHERE clinic_id=$1',
      [req.params.clinic_id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

router.patch('/:id/unavailable', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE consultation_suites SET status='unavailable' WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'suite not found' });
    res.json({ message: 'suite marked unavailable' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM consultation_suites WHERE id=$1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'suite not found' });
    res.json({ message: 'suite deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
