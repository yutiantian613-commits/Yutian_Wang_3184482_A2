<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Add Appliance</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h2>Add New Appliance</h2>
        <form action="add.php" method="POST" class="mt-4">
            <h4>User Details</h4>
            <div class="row mb-3">
                <div class="col">
                    <label>First Name</label>
                    <input type="text" class="form-control" name="first_name" pattern="[A-Za-z]{2,50}" required>
                </div>
                <div class="col">
                    <label>Last Name</label>
                    <input type="text" class="form-control" name="last_name" pattern="[A-Za-z]{2,50}" required>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label>Mobile (e.g. 0871234567)</label>
                    <input type="text" class="form-control" name="mobile" pattern="^08[3-9][0-9]{7}$" required>
                </div>
                <div class="col">
                    <label>Eircode</label>
                    <input type="text" class="form-control" name="eircode" pattern="[A-Za-z0-9]{7}" required>
                </div>
            </div>
            
            <hr>
            <h4>Appliance Details</h4>
            <div class="row mb-3">
                <div class="col">
                    <label>Appliance Type</label>
                    <select class="form-select" name="appliance_type" required>
                        <option value="">Select Type...</option>
                        <option value="Washing Machine">Washing Machine</option>
                        <option value="Fridge">Fridge</option>
                        <option value="Oven">Oven</option>
                    </select>
                </div>
                <div class="col">
                    <label>Serial Number</label>
                    <input type="text" class="form-control" name="serial_number" pattern="[A-Z0-9]{5,20}" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Add Appliance</button>
            <a href="index.php" class="btn btn-secondary">Back to Home</a>
        </form>
    </div>
</body>
</html>