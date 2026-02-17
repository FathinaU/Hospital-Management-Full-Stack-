const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const {
      name, speciality, contact,
      start_time, end_time,
      appointment_duration, break_duration, break_after_n,
      clinic_id, suite_id
    } = req.body;

    if (!name || !speciality || !clinic_id || !suite_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'missing required fields' });
    }

    const clinicCheck = await pool.query(
      `SELECT id FROM clinics WHERE id=$1 AND status='active'`,
      [clinic_id]
    );

    if (clinicCheck.rows.length === 0) {
      return res.status(400).json({ error: 'clinic is invalid or inactive' });
    }

    const suiteCheck = await pool.query(
      `
      SELECT cs.id
      FROM consultation_suites cs
      WHERE cs.id = $1
        AND cs.clinic_id = $2
        AND cs.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM doctors d WHERE d.suite_id = cs.id AND d.status = 'active'
        )
      `,
      [suite_id, clinic_id]
    );

    if (suiteCheck.rows.length === 0) {
      return res.status(400).json({ error: 'suite is invalid, unavailable, or already assigned to another doctor' });
    }

    const result = await pool.query(
      `INSERT INTO doctors 
      (name, speciality, contact, start_time, end_time, appointment_duration, break_duration, break_after_n, clinic_id, suite_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, speciality, contact || null, start_time, end_time, appointment_duration, break_duration, break_after_n, clinic_id, suite_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM doctors WHERE status='active'`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM doctors WHERE id=$1 AND status='active'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'doctor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

router.patch('/:id', async (req, res) => {
  const { name, speciality, contact } = req.body;

  if (!name && !speciality && !contact) {
    return res.status(400).json({ error: 'at least one field must be provided' });
  }

  try {
    const result = await pool.query(
      `UPDATE doctors 
       SET name=COALESCE($1,name),
           speciality=COALESCE($2,speciality),
           contact=COALESCE($3,contact)
       WHERE id=$4 AND status='active' RETURNING *`,
      [name, speciality, contact, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'doctor not found or inactive' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

router.patch('/:id/deactivate', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE doctors SET status='inactive' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'doctor not found' });
    }

    res.json({ message: 'doctor deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
