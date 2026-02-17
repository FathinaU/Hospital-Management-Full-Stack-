const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create clinic
router.post('/', async (req, res) => {
  try {
    const { name, opening_time, closing_time } = req.body;

    if (!name || !opening_time || !closing_time) {
      return res.status(400).json({ error: 'name, opening_time, closing_time are required' });
    }

    const result = await pool.query(
      `INSERT INTO clinics (name, opening_time, closing_time)
       VALUES ($1,$2,$3) RETURNING *`,
      [name, opening_time, closing_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get all active clinics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clinics WHERE status='active'`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// Update clinic hours
router.patch('/:id', async (req, res) => {
  const { name, opening_time, closing_time } = req.body;

  if (!name && !opening_time && !closing_time) {
    return res.status(400).json({ error: 'at least one field required' });
  }

  try {
    const result = await pool.query(
      `UPDATE clinics
       SET name = COALESCE($1, name),
           opening_time = COALESCE($2, opening_time),
           closing_time = COALESCE($3, closing_time)
       WHERE id = $4 AND status='active'
       RETURNING *`,
      [name, opening_time, closing_time, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'clinic not found or inactive' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Deactivate clinic
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE clinics SET status='inactive' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'clinic not found' });
    }

    res.json({ message: 'clinic deactivated' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
