const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "segredo";

// "Banco de dados" simulado
let usuarios = [];
let consultas = [];

// Cadastro
app.post("/cadastro", (req, res) => {
  const { email, senha } = req.body;
  usuarios.push({ email, senha });
  res.status(201).json({ msg: "Cadastrado com sucesso" });
});

// Login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const user = usuarios.find((u) => u.email === email && u.senha === senha);

  if (!user) {
    return res.status(400).json({ msg: "Usuário inválido" });
  }

  const token = jwt.sign({ email }, SECRET);
  res.json({ token });
});

// Middleware
function autenticar(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ msg: "Sem token" });

  try {
    jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).json({ msg: "Token inválido" });
  }
}

// Agendamento
app.post("/agendar", autenticar, async (req, res) => {
  const { data, hora, cep } = req.body;

  let endereco = "";
  let clima = "Desconhecido";

  try {
    // CEP
    const resp = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    endereco = resp.data.logradouro;

    // Clima
    const climaResp = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=-22.90&longitude=-43.20&hourly=precipitation`,
    );

    const chuva = climaResp.data.hourly.precipitation[0];

    if (chuva > 0) {
      clima = "Possível chuva";
    } else {
      clima = "Sem chuva";
    }
  } catch {
    endereco = "Erro ao buscar CEP";
  }

  consultas.push({ data, hora, endereco, clima });

  res.json({
    msg: "Consulta agendada",
    endereco,
    clima,
  });
});

// Listar consultas
app.get("/consultas", autenticar, (req, res) => {
  res.json(consultas);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando");
});
