/**
 * Generates a random secure password for driver enrollment.
 * Includes: 8 characters, 1 Upper, 1 Special, 1 Number.
 * This mirrors the logic used for staff password generation.
 */
export const generateDriverPassword = (): string => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const special = "@#$%&*!";
    const numbers = "0123456789";
    const all = "abcdefghijklmnopqrstuvwxyz" + upper + special + numbers;

    let password = "";
    // Ensure at least one of each required type
    password += upper[Math.floor(Math.random() * upper.length)];
    password += special[Math.floor(Math.random() * special.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Fill the rest to 8 characters
    for (let i = 0; i < 5; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the result
    return password.split('').sort(() => Math.random() - 0.5).join('');
};
