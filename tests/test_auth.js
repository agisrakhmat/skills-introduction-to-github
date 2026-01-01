// Test Auth.js

const assert = require('assert');
const Database = require('../src/Database');
const Auth = require('../src/Auth');
const Config = require('../src/Config');

// Mock data
const mockUsers = [
    {
        user_id: '1',
        email: 'student@example.com',
        phone: '6281234567890',
        role: 'STUDENT',
        status: 'ACTIVE',
        password_hash: Auth.hashPassword('1234') // Hashed '1234'
    },
    {
        user_id: '2',
        email: 'staff@example.com',
        phone: '6289876543210',
        role: 'FINANCE',
        status: 'ACTIVE',
        password_hash: Auth.hashPassword('5678')
    }
];

// Override Database.findUser for testing
Database.findUser = function(identifier) {
    for (const user of mockUsers) {
        if (user.email === identifier || user.phone === identifier) {
            return user;
        }
    }
    return null;
};

// Test Login Success
console.log('Testing Login Success...');
const resultSuccess = Auth.login('student@example.com', '1234');
assert.strictEqual(resultSuccess.success, true);
assert.strictEqual(resultSuccess.user.email, 'student@example.com');
console.log('PASSED');

// Test Login Failure (Wrong Password)
console.log('Testing Login Failure (Wrong Password)...');
const resultFailPass = Auth.login('student@example.com', 'wrong');
assert.strictEqual(resultFailPass.success, false);
console.log('PASSED');

// Test Login Failure (User Not Found)
console.log('Testing Login Failure (User Not Found)...');
const resultFailUser = Auth.login('notfound@example.com', '1234');
assert.strictEqual(resultFailUser.success, false);
console.log('PASSED');
