import argon2 from "argon2";
export async function hashPassword(password) {
    return await argon2.hash(password);
}
export async function verifyPassword(password, passwordHash) {
    return await argon2.verify(passwordHash, password);
}
