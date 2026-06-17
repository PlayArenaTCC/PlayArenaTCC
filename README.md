# ⚽ PlayArena

<p align="center">
  <img src="./frontend/public/logo.png" alt="Logo PlayArena" width="180">
</p>

<p align="center">
  Plataforma web para reserva e gerenciamento de quadras e espaços esportivos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow">
  <img src="https://img.shields.io/badge/version-v9-green">
  <img src="https://img.shields.io/badge/license-MIT-blue">
</p>

---

## 📋 Sobre o Projeto

O **PlayArena** é uma plataforma desenvolvida como Trabalho de Conclusão de Curso (TCC) com o objetivo de facilitar o agendamento de quadras e espaços esportivos.

A aplicação conecta usuários que desejam reservar espaços esportivos a proprietários que precisam gerenciar seus horários, reservas e pagamentos de forma simples e organizada.

Inicialmente, o projeto é voltado para a cidade de **Campo Mourão - PR**, com possibilidade de expansão para outras regiões.

---

## 🎯 Problema Resolvido

Atualmente, muitos espaços esportivos realizam reservas por:

- WhatsApp;
- Ligações telefônicas;
- Planilhas;
- Anotações manuais.

Esse processo gera problemas como:

- Conflito de horários;
- Dificuldade de gerenciamento;
- Falta de histórico das reservas;
- Cancelamentos sem controle;
- Pouca visibilidade para novos clientes.

O PlayArena centraliza todo esse processo em uma única plataforma.

---

## 🚀 Funcionalidades

### 👤 Usuários

- Cadastro e login;
- Recuperação de senha;
- Autenticação em duas etapas (2FA por e-mail);
- Pesquisa de quadras e espaços esportivos;
- Visualização de disponibilidade em tempo real;
- Realização de reservas;
- Cancelamento de reservas;
- Histórico de reservas;
- Recebimento de notificações;
- Avaliação de espaços.

### 🏟️ Proprietários

- Cadastro de espaços esportivos;
- Envio de documentação para validação;
- Gerenciamento de horários;
- Criação de horários fixos e específicos;
- Inativação e reativação de horários;
- Aprovação de reservas por código;
- Gerenciamento de promoções;
- Controle de cancelamentos;
- Recebimento de notificações;
- Dashboard gerencial.

### 🛡️ Administradores

- Aprovação ou reprovação de proprietários;
- Validação de documentos;
- Cadastro de administradores;
- Gerenciamento de usuários;
- Bloqueio temporário;
- Banimento de contas;
- Gerenciamento de espaços;
- Monitoramento de notificações;
- Auditoria do sistema.

---

## 🏗️ Arquitetura do Sistema

O projeto segue a arquitetura cliente-servidor.

```text
Frontend (React + Vite)
        ↓
API REST (Node.js + Express)
        ↓
Banco de Dados (PostgreSQL / Neon DB)
