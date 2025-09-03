// stringUtils.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');
/**
 * toUpperCase: Converts a given string to uppercase.
 * @param {String} str - The input string to convert.
 * @returns {String} - The input string converted to uppercase.
 */
function toUpperCase (str) {
  return str.toUpperCase();
}

/**
 * toLowerCase: Converts a given string to lowercase.
 * @param {String} str - The input string to convert.
 * @returns {String} - The input string converted to lowercase.
 */
function toLowerCase (str) {
  return str.toLowerCase();
}

/**
 * capitalize: Capitalizes the first letter of each word in a given string.
 * @param {String} str - The input string to capitalize.
 * @returns {String} - The input string with the first letter of each word capitalized.
 */
function capitalize (str) {
  const words = str.split(' ');
  const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
  return capitalizedWords.join(' ');
}

/**
 * generateStrongPassword: Generates a strong password with a given length.
 * @param {Number} length - The length of the password to generate.
 * @returns {String} - The generated strong password.
 */
function generateStrongPassword (length) {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_+=<>?';

  // Combine all character sets
  const allChars = uppercaseChars + lowercaseChars + numbers + symbols;

  let password = '';

  // Generate random characters from combined character set
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}
function cryptoFUN (text, type) {
  var algorithm = 'aes-192-cbc';
  var password = 'DarkWorldEncryption';
  var key = crypto.scryptSync(password, 'salt', 24, { N: 1024 }); //create key
  var iv = crypto.scryptSync(password, 'salt', 16, { N: 1024 }); //create initVector

  if (type.toString() === 'encrypt') {
    var cipher = crypto.createCipheriv(algorithm, key, iv);
    var encrypted = cipher.update(text.toString(), 'utf8', 'hex') + cipher.final('hex'); // encrypted text
    return encrypted.toString();
  } else {
    var decipher = crypto.createDecipheriv(algorithm, key, iv);
    var decrypted = decipher.update(text.toString(), 'hex', 'utf8') + decipher.final('utf8'); //decrypted text
    return decrypted.toString();
  }
}

async function sendEmail (recipientEmail, subject, body) {
  try {
    // Create a transporter
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,      // e.g., 'smtp.gohashinclude.com'
      port: process.env.SMTP_PORT,      // e.g., 587
      secure: false,                    // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,   // your company email
        pass: process.env.EMAIL_PASS    // your company email password
      },
      tls: { rejectUnauthorized: false }
    });

    // Define the mail options
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      text: body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    return true; // Return true if the email is sent successfully
  } catch (error) {
    console.log('Error occurred: ', error);
    return false; // Return false if there's an error
  }
}

module.exports = {
  toUpperCase,
  toLowerCase,
  capitalize,
  generateStrongPassword,
  cryptoFUN,
  sendEmail
};
