// Setup file for Jest test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long';

beforeAll(async () => {
    // Setup logic if needed before all tests
});

afterAll(async () => {
    // Teardown logic if needed after all tests
});
