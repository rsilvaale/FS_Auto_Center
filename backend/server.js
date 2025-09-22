// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Adicionado para manipular caminhos
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Permitir requisições do frontend
app.use(express.static(path.join(__dirname, '../frontend'))); // Servir arquivos da pasta frontend

// Configuração da conexão com MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@1109Ale', // Substitua pela sua senha do MySQL
    database: 'fs_auto_center'
});

// Conectar ao banco
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        process.exit(1);
    }
    console.log('Conectado ao MySQL com sucesso!');
});

// Criar tabela de agendamentos se não existir
db.query(`
    CREATE TABLE IF NOT EXISTS agendamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(20) NOT NULL,
        service VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
        status_reason VARCHAR(255) DEFAULT ''
    )
`, err => {
    if (err) console.error('Erro ao criar tabela agendamentos:', err);
});

// Credenciais do admin (hardcoded por simplicidade; em produção, use hashing)
const adminCredentials = { username: 'admin', password: 'admin123' };

// Endpoint para login do admin
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        res.status(200).json({ message: 'Login bem-sucedido' });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Endpoint para criar novo agendamento
app.post('/agendamentos', (req, res) => {
    const { name, whatsapp, service, date, reason } = req.body;
    if (!name || !whatsapp || !service || !date || !reason) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    const query = 'INSERT INTO agendamentos (name, whatsapp, service, date, reason) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, whatsapp, service, date, reason], (err, result) => {
        if (err) {
            console.error('Erro ao inserir agendamento:', err);
            return res.status(500).json({ error: 'Erro ao salvar agendamento' });
        }
        res.status(201).json({ message: 'Agendamento criado com sucesso', id: result.insertId });
    });
});

// Endpoint para listar todos os agendamentos
app.get('/agendamentos', (req, res) => {
    const query = 'SELECT * FROM agendamentos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
        }
        res.status(200).json(results);
    });
});

// Endpoint para atualizar status de agendamento
app.put('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const { status, status_reason } = req.body;
    if (!status || !['pendente', 'aprovado', 'rejeitado'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
    }
    const query = 'UPDATE agendamentos SET status = ?, status_reason = ? WHERE id = ?';
    db.query(query, [status, status_reason || '', id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar agendamento:', err);
            return res.status(500).json({ error: 'Erro ao atualizar agendamento' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        res.status(200).json({ message: 'Agendamento atualizado com sucesso' });
    });
});

// Rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});