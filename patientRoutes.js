const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const { name, street, city, zip, contact, email } = req.body;

    if (!name || !street || !city || !contact) {
      return res.status(400).json({ error: "name, city, street and contact are required!" });
    }

    const result = await pool.query(
      'INSERT INTO patients(name,street,city,zip,contact,email) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, street, city, zip || null, contact, email || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "server error" });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, street, city, zip, contact, email } = req.body;

    const result = await pool.query(
      'UPDATE patients SET name=$1,street=$2,city=$3,zip=$4,contact=$5,email=$6 WHERE id=$7 RETURNING *',
      [name, street, city, zip || null, contact, email || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'patient not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "server error" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM patients WHERE id=$1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'patient not found' });
    }

    res.json({ message: 'patient deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
