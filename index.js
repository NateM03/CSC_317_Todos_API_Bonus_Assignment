// Bonus Question
const sqlite3 = require('sqlite3').verbose(); // Import SQLite
const express = require('express');
const app = express();
const port = 3000;

const db = new sqlite3.Database('./todos.db');

// Database is initialized
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        priority TEXT DEFAULT 'medium'
    )`);
});

// Middleware to parse JSON bodies
app.use(express.json());

// GET /todos - Retrieve all to-do items
app.get('/todos', (req, res) => {
    const { completed } = req.query;
    let query = "SELECT * FROM todos";
    let params = [];

    if (completed !== undefined) {
        query += " WHERE completed = ?";
        params.push(completed === 'true' ? 1 : 0);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/* 
Q.3"
GET /todos - Retrieve all to-do items or filter by completed status.
after completing this part, you need to comment out the GET end point 
already implemented here to test this new GET endpoint! 
*/



// POST /todos - Add a new to-do item
app.post('/todos', (req, res) => {
    const { task, priority = 'medium' } = req.body;

    if (!["high", "medium", "low"].includes(priority)) {
        return res.status(400).json({ error: "Invalid priority value" });
    }

    db.run("INSERT INTO todos (task, completed, priority) VALUES (?, ?, ?)",
        [task, 0, priority],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, task, completed: 0, priority });
        });
});


// PUT /todos/:id - Update an existing to-do item
app.put('/todos/:id', (req, res) => {
    const { id } = req.params;
    const { task, completed, priority } = req.body;

    db.run(`UPDATE todos 
            SET task = COALESCE(?, task), 
                completed = COALESCE(?, completed), 
                priority = COALESCE(?, priority) 
            WHERE id = ?`,
        [task, completed, priority, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "To-Do item not found" });
            res.json({ message: "To-Do item updated" });
        });
});

// DELETE /todos/:id - Deletes an exsisting 
app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM todos WHERE id = ?", id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "To-Do item not found" });
        res.status(204).send();
    });
});

/*
Question 2: Implement a "Complete All" Endpoint
example usage: 
curl -X PUT http://localhost:3000/todos/complete-all
*/

// COMPLETE ALL
app.put('/todos/complete-all', (req, res) => {
    todos.forEach(todo => {
      todo.completed = true;
    });
    res.json({ message: "All to-do items marked as completed." });
  });

  // PUT /todos/:id - Update an existing to-do item
app.put('/todos/complete-all', (req, res) => {
    db.run("UPDATE todos SET completed = 1", function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "All to-do items marked as completed" });
    });
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
