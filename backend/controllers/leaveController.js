const db = require('../db/connection');

exports.getLeaves = async (req, res) => {
 try {
     const [rows] = await db.query(`
SELECT * FROM leave_request
     `, [req.params.id]);
     res.json(rows);
   } catch (err) {
     res.status(500).json({ error: 'Database error' });
   }
};
