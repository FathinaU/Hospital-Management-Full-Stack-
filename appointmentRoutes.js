const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { patient_id, doctor_id, suite_id, appointment_time } = req.body;

  if (!patient_id || !doctor_id || !suite_id || !appointment_time) {
    return res.status(400).json({ error: 'missing required fields' });
  }

  if (new Date(appointment_time) <= new Date()) {
    return res.status(400).json({ error: 'appointment time must be in the future' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const clinicCheck = await client.query(`
      SELECT c.id
      FROM doctors d
      JOIN clinics c ON d.clinic_id = c.id
      WHERE d.id = $1 AND c.status = 'active'
    `, [doctor_id]);

    if (clinicCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'clinic is inactive or doctor invalid' });
    }

    const suiteOwnership = await client.query(`
      SELECT 1 FROM doctors
      WHERE id = $1 AND suite_id = $2 AND status = 'active'
    `, [doctor_id, suite_id]);

    if (suiteOwnership.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'doctor is not assigned to this suite' });
    }

    const result = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, suite_id, appointment_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, doctor_id, suite_id, appointment_time]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') {
      return res.status(409).json({ error: 'slot already booked (doctor or room conflict)' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'invalid patient, doctor or suite' });
    }

    console.error(err);
    res.status(500).json({ error: 'server error' });

  } finally {
    client.release();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM appointments WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'appointment not found' });
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

router.patch('/:id/reschedule', async (req, res) => {
  const { appointment_time } = req.body;

  if (!appointment_time) {
    return res.status(400).json({ error: 'new appointment time required' });
  }

  try {
    const result = await pool.query(
      `UPDATE appointments 
       SET appointment_time=$1 
       WHERE id=$2 AND status='confirmed' RETURNING *`,
      [appointment_time, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'appointment not found or canceled' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'time already booked' });
    }
    res.status(500).json({ error: 'server error' });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  const result = await pool.query(
    `UPDATE appointments 
     SET status='cancelled' 
     WHERE id=$1 AND status='confirmed' RETURNING *`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'appointment not found or already cancelled' });
  }

  res.json({ message: 'appointment cancelled' });
});

module.exports = router;
