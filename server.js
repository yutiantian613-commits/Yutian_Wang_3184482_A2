const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '123456',
    database: 'household_inventory'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('✅ MySQL Database Connected Successfully!');
});


app.post('/add-appliance', (req, res) => {
    const { first_name, last_name, address, mobile, email, eircode, appliance_type, brand, model_number, serial_number, purchase_date, warranty_date, cost } = req.body;

    // Check if appliance exists
    db.query('SELECT ApplianceID FROM Appliance WHERE SerialNumber = ?', [serial_number], (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length > 0) return res.send(`<h3 style="color:red;">Error: Appliance already exists.</h3><a href="/add.html">Go Back</a>`);

        // Check if user exists
        db.query('SELECT UserID FROM User WHERE Email = ?', [email], (err, userResults) => {
            if (err) return res.status(500).send('Database error');

            if (userResults.length > 0) {
                // User exists
                insertAppliance(userResults[0].UserID);
            } else {
                // New user
                const userQuery = 'INSERT INTO User (FirstName, LastName, Address, Mobile, Email, Eircode) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(userQuery, [first_name, last_name, address, mobile, email, eircode], (err, insertUserResult) => {
                    if (err) return res.status(500).send('Database error');
                    insertAppliance(insertUserResult.insertId);
                });
            }
        });
    });

    // Helper function to insert appliance
    function insertAppliance(userId) {
        const appQuery = 'INSERT INTO Appliance (ApplianceType, Brand, ModelNumber, SerialNumber, PurchaseDate, WarrantyExpirationDate, CostOfAppliance, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(appQuery, [appliance_type, brand, model_number, serial_number, purchase_date, warranty_date, cost, userId], (err) => {
            if (err) return res.status(500).send('Database error');
            res.send(`<h3 style="color:green;">Success: New appliance added successfully!</h3><a href="/add.html">Return to Form</a>`);
        });
    }
});

// Start the server
app.listen(3000, () => {
    console.log(' Server is running! Visit: http://localhost:3000/add.html');
});