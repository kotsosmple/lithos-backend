require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json());

// Σύνδεση με την PostgreSQL μέσω του link στο .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Έλεγχος ότι η βάση συνδέθηκε σωστά
pool.connect()
    .then(() => console.log('✅ Επιτυχής σύνδεση με τη Βάση Δεδομένων (Neon)!'))
    .catch(err => console.error('❌ Σφάλμα σύνδεσης:', err));
// Το Endpoint που δέχεται τις κρατήσεις και τις βάζει στη Βάση
app.post('/api/bookings', async (req, res) => {
    try {
        const { 
            villaId, checkin, checkout, guests, 
            firstName, lastName, email, phone, 
            totalPrice, depositAmount 
        } = req.body;

        // Εντολή SQL για εισαγωγή δεδομένων
        const query = `
            INSERT INTO bookings 
            (villa_id, checkin_date, checkout_date, guests, first_name, last_name, email, phone, total_price, deposit_amount) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING id;
        `;
        
        const values = [villaId, checkin, checkout, guests, firstName, lastName, email, phone, totalPrice, depositAmount];

        // Εκτέλεση στην PostgreSQL
        const result = await pool.query(query, values);
        
        console.log(`🔥 ΝΕΑ ΚΡΑΤΗΣΗ ΑΠΟΘΗΚΕΥΤΗΚΕ! ID: ${result.rows[0].id}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Η κράτηση αποθηκεύτηκε επιτυχώς!',
            bookingId: result.rows[0].id
        });

    } catch (error) {
        console.error("Σφάλμα κατά την αποθήκευση της κράτησης:", error);
        res.status(500).json({ success: false, error: 'Αποτυχία αποθήκευσης στη βάση.' });
    }
});
// --- ΝΕΟ ENDPOINT: Επιστρέφει τις κρατημένες ημερομηνίες ανά βίλα ---
app.get('/api/bookings/:villaId', async (req, res) => {
    try {
        const { villaId } = req.params;
        const query = `SELECT checkin_date, checkout_date FROM bookings WHERE villa_id = $1`;
        const result = await pool.query(query, [villaId]);
        
        res.status(200).json({ success: true, bookings: result.rows });
    } catch (error) {
        console.error("Σφάλμα κατά την ανάκτηση κρατήσεων:", error);
        res.status(500).json({ success: false, error: 'Αποτυχία ανάκτησης δεδομένων.' });
    }
});
app.listen(PORT, () => {
    console.log(`Ο διακομιστής τρέχει στο http://localhost:${PORT}`);
});