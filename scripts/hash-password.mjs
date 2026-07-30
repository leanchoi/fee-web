#!/usr/bin/env node
/**
 * Genera el hash de una contraseña para ADMIN_PASSWORD_HASH.
 *
 *   node scripts/hash-password.mjs "mi contraseña segura"
 *
 * Copiar la salida a `.env`. La contraseña en texto plano no queda escrita
 * en ningún archivo.
 */
import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "<contraseña>"');
  process.exit(1);
}

if (password.length < 12) {
  console.error("La contraseña debe tener al menos 12 caracteres.");
  process.exit(1);
}

const COST = { N: 16384, r: 8, p: 1 };
const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(password, salt, 64, COST);

console.log(
  `ADMIN_PASSWORD_HASH="scrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString(
    "hex"
  )}$${derived.toString("hex")}"`
);
