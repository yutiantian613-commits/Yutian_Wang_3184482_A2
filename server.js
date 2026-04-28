require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const xss = require('xss'); // Used to prevent Cross-Site Scripting (XSS) attacks

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serve static HTML files from 'public' folder

// Database Connection 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('✅ MySQL Database Connected Successfully!');
});

//Validation Regex Patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
const mobileRegex = /^08[0-9]{8}$/; // Must start with 08 and be 10 digits total
const eircodeRegex = /^[A-Za-z0-9]{7}$/; // Exactly 7 alphanumeric characters

// 1. CREATE (Add Appliance)

app.post('/add-appliance', (req, res) => {
    // Sanitize all inputs to prevent XSS attacks
    const first_name = xss(req.body.first_name);
    const last_name = xss(req.body.last_name);
    const address = xss(req.body.address);
    const mobile = xss(req.body.mobile);
    const email = xss(req.body.email);
    const eircode = xss(req.body.eircode);
    const appliance_type = xss(req.body.appliance_type);
    const brand = xss(req.body.brand);
    const model_number = xss(req.body.model_number);
    const serial_number = xss(req.body.serial_number);
    const purchase_date = xss(req.body.purchase_date);
    const warranty_date = xss(req.body.warranty_date);
    const cost = xss(req.body.cost);

    // Server-side Validation
    if (!emailRegex.test(email)) return res.send('<h3>Error: Invalid Email format.</h3><a href="/add.html">Go Back</a>');
    if (!mobileRegex.test(mobile)) return res.send('<h3>Error: Mobile must be an Irish number (e.g. 08...).</h3><a href="/add.html">Go Back</a>');
    if (!eircodeRegex.test(eircode)) return res.send('<h3>Error: Eircode must be 7 alphanumeric characters.</h3><a href="/add.html">Go Back</a>');

    // Helper function to insert appliance
    const insertAppliance = (userID) => {
        const applianceQuery = 'INSERT INTO Appliance (ApplianceType, Brand, ModelNumber, SerialNumber, PurchaseDate, WarrantyExpirationDate, CostOfAppliance, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(applianceQuery, [appliance_type, brand, model_number, serial_number, purchase_date, warranty_date, cost, userID], (err) => {
            if (err) return res.status(500).send('Database error while inserting appliance');
            res.send(`<h2 style="color:green;">New appliance added successfully.</h2><a href="/index.html">Go Back to Home</a>`);
        });
    };

    // Check for duplicate serial number
    db.query('SELECT ApplianceID FROM Appliance WHERE SerialNumber = ?', [serial_number], (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length > 0) return res.send(`<h3 style="color:red;">Error: Appliance already exists.</h3><a href="/add.html">Go Back</a>`);

        // Check if user exists by Email
        db.query('SELECT UserID FROM User WHERE Email = ?', [email], (err, userResults) => {
            if (err) return res.status(500).send('Database error');

            if (userResults.length > 0) {
                insertAppliance(userResults[0].UserID); // Link to existing user
            } else {
                const userQuery = 'INSERT INTO User (FirstName, LastName, Address, Mobile, Email, Eircode) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(userQuery, [first_name, last_name, address, mobile, email, eircode], (err, insertUserResult) => {
                    if (err) return res.status(500).send('Database error while inserting user');
                    insertAppliance(insertUserResult.insertId); // Link to new user
                });
            }
        });
    });
});


// 2. Search Appliance
app.get('/search', (req, res) => {
    const serialNumber = xss(req.query.serialNumber); // Sanitize input

    const sql = `
        SELECT a.*, u.FirstName, u.LastName, u.Email 
        FROM Appliance a 
        JOIN User u ON a.UserID = u.UserID 
        WHERE a.SerialNumber = ?
    `;

    db.query(sql, [serialNumber], (err, results) => {
        if (err) return res.status(500).send("Database error");

        if (results.length > 0) {
            const item = results[0];
            res.send(`
                <h2>Appliance Details Found!</h2>
                <p><strong>Owner:</strong> ${item.FirstName} ${item.LastName} (${item.Email})</p>
                <p><strong>Appliance:</strong> ${item.Brand} ${item.ApplianceType} (Model: ${item.ModelNumber})</p>
                <p><strong>Serial Number:</strong> ${item.SerialNumber}</p>
                <p><strong>Cost:</strong> €${item.CostOfAppliance}</p>
                <br><a href="/index.html">Go Back to Home</a>
            `);
        } else {
            res.send(`<h2 style="color: red;">No matching appliance found!</h2><a href="/index.html">Go Back to Home</a>`);
        }
    });
});

// 3.Update Appliance Cost/Brand
app.post('/update-appliance', (req, res) => {
    const serial_number = xss(req.body.serial_number);
    const new_brand = xss(req.body.new_brand);
    const new_cost = xss(req.body.new_cost);

    // Check if appliance exists first
    db.query('SELECT ApplianceID FROM Appliance WHERE SerialNumber = ?', [serial_number], (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.send(`<h3 style="color:red;">Error: Appliance not found.</h3><a href="/update.html">Go Back</a>`);

        const updateSql = 'UPDATE Appliance SET Brand = ?, CostOfAppliance = ? WHERE SerialNumber = ?';
        db.query(updateSql, [new_brand, new_cost, serial_number], (err) => {
            if (err) return res.status(500).send("Database error during update");
            res.send(`<h2 style="color:green;">Appliance has been updated successfully.</h2><a href="/index.html">Go Back to Home</a>`);
        });
    });
});


// 4. Delete Appliance
app.post('/delete-appliance', (req, res) => {
    const serial_number = xss(req.body.serial_number);

    db.query('SELECT ApplianceID FROM Appliance WHERE SerialNumber = ?', [serial_number], (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.send(`<h3 style="color:red;">Error: Appliance not found. Cannot delete.</h3><a href="/delete.html">Go Back</a>`);

        db.query('DELETE FROM Appliance WHERE SerialNumber = ?', [serial_number], (err) => {
            if (err) return res.status(500).send("Database error during deletion");
            res.send(`<h2 style="color:green;">Appliance Deleted successfully.</h2><a href="/index.html">Go Back to Home</a>`);
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running! Visit: http://localhost:${PORT}/index.html`);
});